import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function createLighting({port=process.env.G_LIGHT_PORT||'COM3',enabled=process.platform==='win32'&&process.env.G_LIGHT_DISABLED!=='1',run=execFile}={}){
  let desired=null,confirmed=null,busy=false,failed=null;
  function pump(){
    if(!enabled||busy||desired===confirmed||desired===failed)return;
    const effect=desired;if(!effect)return;
    const transition=confirmed==='green'&&effect==='blue'?900:200;
    busy=true;
    run('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',fileURLToPath(new URL('./g-light.ps1',import.meta.url)),'-Effect',effect,'-Port',port,'-TransitionMs',String(transition)],{windowsHide:true,timeout:20000},(error,stdout,stderr)=>{
      busy=false;
      if(error){failed=effect;console.error('[G-light]',effect,'FAILED',stderr||error.message);}
      else{confirmed=effect;failed=null;console.log('[G-light]',stdout.trim());}
      pump();
    });
  }
  return {set(effect){if(!['red','green','blue','off'].includes(effect))return;if(desired!==effect)failed=null;desired=effect;pump();},status(){return {enabled,port,desired,confirmed,busy,failed};}};
}
