import {mountOrb} from '../assets/anlb-orb/orb.js';
const orb=mountOrb(document.getElementById('pad-voice-orb'));
let ready=false,active=false,last=null,timer;
function apply(){if(!ready||!last)return;if(active!==!!last.active){active=!!last.active;active?orb.start():orb.end();}orb.setLevel(Number(last.level)||0);}
orb.ready.then(()=>{ready=true;apply();}).catch(()=>{const message=document.getElementById('pad-voice-status');message.hidden=false;message.textContent='此瀏覽器暫不支援語音球';});
window.addEventListener('pad:voice',e=>{last=e.detail;apply();clearTimeout(timer);timer=setTimeout(()=>{if(ready)orb.setLevel(0);},700);});
window.addEventListener('pagehide',e=>{if(!e.persisted){clearTimeout(timer);orb.dispose();}});
