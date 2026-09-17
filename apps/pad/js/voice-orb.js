// Default off; 9 toggles the unchanged approved renderer on this Pad.
const host=document.getElementById('pad-voice-orb');
const shell=host.closest('.pad-voice');
const message=document.getElementById('pad-voice-status');
let orb=null,ready=false,enabled=false,active=false,last=null,lastAt=0,timer;
let request=0,orbModule;
function apply(){
  if(!ready||!last)return;
  if(active!==!!last.active){active=!!last.active;active?orb.start():orb.end();}
  orb.setLevel(Date.now()-lastAt<700?(Number(last.level)||0):0);
}
async function setEnabled(next){
  const ticket=++request;
  enabled=next;ready=false;active=false;
  clearTimeout(timer);orb?.dispose();orb=null;
  shell.style.display=next?'':'none';message.hidden=true;
  if(!next)return;
  let candidate;
  try{
    const module=await (orbModule??=import('../assets/anlb-orb/orb.js'));
    if(ticket!==request)return;
    candidate=module.mountOrb(host);
    await candidate.ready;
    if(ticket!==request){candidate.dispose();return;}
    orb=candidate;ready=true;apply();
  }catch{
    candidate?.dispose();
    if(ticket!==request)return;
    orbModule=null;message.hidden=false;message.textContent='此瀏覽器暫不支援語音球';
  }
}
function onKey(e){
  if(e.defaultPrevented||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||e.key!=='9')return;
  if(e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return;
  e.preventDefault();void setEnabled(!enabled);
}
window.addEventListener('keydown',onKey);
window.addEventListener('pad:voice',e=>{
  last=e.detail;lastAt=Date.now();apply();clearTimeout(timer);
  if(ready)timer=setTimeout(()=>{if(ready)orb.setLevel(0);},700);
});
window.addEventListener('pagehide',e=>{
  if(!e.persisted){++request;window.removeEventListener('keydown',onKey);clearTimeout(timer);orb?.dispose();}
});
void setEnabled(new URLSearchParams(location.search).get('orb')==='on');
