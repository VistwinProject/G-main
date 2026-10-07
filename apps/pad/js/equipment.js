// Equipment-location mode: no live exit availability or walking-route claims.
const style=document.createElement('style');style.textContent=`
#n-next{display:none!important}
body[data-view="app"] .app__hero,body[data-view="app"] .app__card,body[data-view="app"] .app__tiles{display:none!important}
.pad-equipment{grid-column:1/-1;grid-row:2/4;padding:1rem 2rem;color:var(--ink)}
.pad-equipment img{width:24rem;max-width:80%;margin-bottom:1rem}
html[data-skin="light"] .pad-equipment img{filter:brightness(0)}
.pad-equipment li{list-style:none;margin:.7rem 0;padding:.6rem;border-left:2px solid #ff4545}
.pad-equipment small{opacity:.7}
`;document.head.append(style);
const panel=document.createElement('section');panel.className='pad-equipment';
panel.innerHTML='<img src="./assets/baopu-logo.png" alt="寶舖全健築知行"><h2>逃生設備位置</h2><ul><li>安全梯｜5F・6F・7F</li><li>5F 右側｜緩降機位置</li><li>6F 陽台側｜緩降機位置</li><li>7F 左側｜緩降機位置</li></ul><small>位置方向以提供的平面圖為準</small>';
document.querySelector('.pad__app')?.append(panel);
const button=document.getElementById('act-guide');if(button){button.textContent='展示逃生設備方向';button.setAttribute('aria-label','展示逃生設備方向');}
