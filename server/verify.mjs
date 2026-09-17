// Isolated migration checks. Explicit test port; never changes the production port.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.TEST_PORT || 5391);
const base = 'http://127.0.0.1:' + port;
const child = spawn(process.execPath, ['server/server.mjs', String(port)], {cwd:root,stdio:['ignore','pipe','pipe']});
let log = '';
child.stdout.on('data', chunk => log += chunk);
child.stderr.on('data', chunk => log += chunk);
const sockets = [];
const delay = ms => new Promise(r=>setTimeout(r,ms));
function raw(path, method='GET', body='') {
  return new Promise((resolve,reject)=>{
    const req=request({hostname:'127.0.0.1',port,path,method},res=>{
      const chunks=[];res.on('data',x=>chunks.push(x));
      res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(chunks),headers:res.headers}));
    });req.on('error',reject);req.end(body);
  });
}
async function connect(role) {
  const ws = new WebSocket('ws://127.0.0.1:'+port+'/ws?role='+role);
  const messages=[];ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
  sockets.push(ws);await once(ws,'open');
  return {ws,messages};
}
async function take(client, predicate) {
  for(let i=0;i<100;i++){
    const index=client.messages.findIndex(predicate);
    if(index>=0)return client.messages.splice(index,1)[0];
    await delay(20);
  }
  throw Error('Timed out waiting for state');
}
async function walk(dir) {
  const files=[];
  for(const e of await readdir(new URL(dir,import.meta.url),{withFileTypes:true})){
    if(e.name.startsWith('.'))continue;
    const path=dir+e.name;
    if(e.isDirectory())files.push(...await walk(path+'/'));else files.push(path);
  }
  return files;
}
try {
  for(let i=0;i<100&&!log.includes('Main:');i++){
    if(child.exitCode!==null)throw Error(log);await delay(30);
  }
  assert.match(log,/Main:/);
  assert.equal((await raw('/')).headers.location,'/main/');
  assert.equal((await raw('/pad?server=localhost:5280')).headers.location,'/pad/?server=localhost:5280');
  let checked=0;
  for(const app of ['main','pad']){
    assert.equal((await raw('/'+app+'/')).status,200);
    for(const file of await walk('../apps/'+app+'/')){
      const url='/'+file.slice('../apps/'.length).split('/').map(encodeURIComponent).join('/');
      const response=await raw(url);
      assert.equal(response.status,200,url);
      assert.deepEqual(response.body,await readFile(new URL(file,import.meta.url)),url);
      checked++;
    }
  }
  console.log('PASS all '+checked+' app files served byte-for-byte (including models/audio/layouts)');
  for(const path of ['/missing','/pad/models/tower.glb','/main/missing.js','/server/server.mjs'])
    assert.equal((await raw(path)).status,404,path);
  for(const path of ['/main/%2e%2e/server/server.mjs','/main/%5c..%5cserver.mjs','/main/.git/config','/pad/C:/test'])
    assert.equal((await raw(path)).status,403,path);
  assert.equal((await raw('/main/%ZZ')).status,400);
  const layout='/main/layout-monorepotest.json';
  assert.equal((await raw(layout)).status,404,'test file must not preexist');
  const payload=JSON.stringify({migrationTest:true,view:{shots:[]}});
  assert.equal((await raw(layout,'PUT',payload)).status,204);
  assert.equal((await raw(layout)).body.toString(),payload);
  assert.equal((await raw(layout,'POST',payload)).status,204);
  assert.equal((await raw(layout,'PUT','not json')).status,400);
  assert.equal((await raw('/pad/layout-test.json','PUT',payload)).status,405);
  assert.equal((await raw('/main/js/test.json','PUT',payload)).status,405);
  assert.equal((await raw(layout,'DELETE')).status,204);
  assert.equal((await raw(layout)).status,404);
  console.log('PASS 404 / traversal / Main-only JSON PUT POST DELETE');
  const display=await connect('display'),pad=await connect('pad');
  await take(display,m=>m.scene==='intro');await take(pad,m=>m.scene==='intro');
  const animation={kind:'route',t0:10000,dur:12};
  display.ws.send(JSON.stringify({scene:'aiRoute',phase:'running',route:2,anim:animation,now:12345}));
  const forwarded=await take(pad,m=>m.scene==='aiRoute');
  assert.equal(forwarded.route,2);assert.deepEqual(forwarded.anim,animation);assert.equal(forwarded.now,12345);
  pad.ws.send(JSON.stringify({scene:'prevention',cmd:'prevention-select',cmdId:'test-1',preventionChoice:{disaster:'火災',topic:'防火區劃'}}));
  assert.equal((await take(display,m=>m.cmdId==='test-1'))._sourceRole,'pad');
  pad.ws.send(JSON.stringify({scene:'aiRoute',cmd:'route-play',cmdId:'test-2',route:3}));
  assert.equal((await take(display,m=>m.cmdId==='test-2')).route,3);
  const reload=await connect('pad');
  assert.equal((await take(reload,m=>m.cmdId==='test-2')).route,3);
  display.messages.length=0;
  const displayReload=await connect('display');
  await take(displayReload,m=>m.cmdId==='test-2');
  await delay(100);assert.equal(display.messages.length,0,'connection must not rebroadcast cached commands');
  display.ws.send(JSON.stringify({type:'voice',active:true,level:0.42}));
  assert.equal((await take(pad,m=>m.type==='voice')).level,0.42);
  pad.ws.send(JSON.stringify({type:'hello'}));
  assert.equal((await take(pad,m=>m.cmdId==='test-2')).type,undefined,'voice not stored in state');
  console.log('PASS bidirectional states / route command / animation fields / reconnect snapshot / no reconnect broadcast / voice');
  const second=spawn(process.execPath,['server/server.mjs',String(port)],{cwd:root,stdio:'pipe'});
  let error='';second.stderr.on('data',d=>error+=d);
  const [code]=await once(second,'exit');assert.equal(code,1);assert.match(error,/already in use/);
  console.log('PASS occupied port fails without fallback');
  await delay(26000); // Existing heartbeat should keep standard clients alive.
  assert.equal(pad.ws.readyState,WebSocket.OPEN);
  pad.ws.send(JSON.stringify({type:'hello'}));await take(pad,m=>m.cmdId==='test-2');
  console.log('PASS connection survives existing ping/pong cycle');
} finally {
  for(const socket of sockets)socket.close();
  child.kill();
}
