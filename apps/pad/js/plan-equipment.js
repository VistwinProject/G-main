import { BOUNDS, PLAN, ROUTES } from './plan-data.js';
const X=z=>z-BOUNDS.z[0],Y=x=>BOUNDS.x[1]-x;
const paths=Object.values(PLAN).flatMap(polys=>polys.map(poly=>`<path d="${poly.map(([x,z],i)=>`${i?'L':'M'}${X(z)} ${Y(x)}`).join('')}Z"/>`)).join('');
const stair='<path d="M-.6 .6h.4v-.4h.4v-.4h.4v-.4h.4"/>';
const descent='<circle cx="0" cy="-.45" r=".15"/><path d="M-.5-.7v1.4M-.5-.15H0v.5m-.3-.3L0-.15l.4.3M0 .35l-.3.4M0 .35l.4.4"/>';
const mark=(x,z,icon,text)=>`<g class="map-equipment" transform="translate(${X(z)} ${Y(x)})"><rect x="-.85" y="-.85" width="1.7" height="1.7" rx=".12"/>${icon}<text y="1.45">${text}</text></g>`;
const panel=document.createElement('section');panel.className='pad-plan';
panel.innerHTML=`<header><div><small>03 / ESCAPE EQUIPMENT</small><h1>逃生設備平面圖</h1></div><strong>7F</strong></header><div class="pad-plan-map"><svg viewBox="-2 -2 44.3 22.65" role="img" aria-label="七樓線稿平面圖與逃生設備位置"><g class="plan-lines">${paths}</g>${mark(-12,-23,stair,'緊急出口')}${mark(-12,-16,stair,'緊急出口')}${mark(-5.8,-38.5,descent,'緩降機')}</svg></div><footer><span>綠色圖示：緊急出口・緩降機</span><button type="button">展示逃生設備方向</button></footer>`;
document.querySelector('.pad__main').append(panel);
const heading=panel.querySelector('header>div');
heading.replaceChildren();
const logo=document.createElement('div');logo.className='pad-plan-logo';
logo.setAttribute('role','img');logo.setAttribute('aria-label','寶舖全健築知行');heading.append(logo);
const svg=panel.querySelector('svg');
const arrows=document.createElementNS('http://www.w3.org/2000/svg','g');
arrows.setAttribute('class','pad-direction-arrows');
svg.insertBefore(arrows,svg.querySelector('.map-equipment'));
let routeKey='';
window.addEventListener('pad:route-state',({detail:s})=>{
  const index=s?.scene==='aiRoute'&&s?.phase==='running'?s.route:-1;
  if(routeKey===String(index))return;
  routeKey=String(index);arrows.replaceChildren();
  const points=ROUTES[index]?.pts;if(!points)return;
  for(let i=1;i<points.length;i++){
    const a=[X(points[i-1][1]),Y(points[i-1][0])],b=[X(points[i][1]),Y(points[i][0])];
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<.25)continue;
    const count=Math.max(1,Math.ceil(length/3)),step=length/count;
    for(let j=0;j<count;j++){
      const g=document.createElementNS(svg.namespaceURI,'g');
      g.style.setProperty('--wave-delay',`${arrows.childElementCount*.18}s`);
      g.setAttribute('transform',`translate(${a[0]+dx/length*(j+.1)*step} ${a[1]+dy/length*(j+.1)*step}) rotate(${Math.atan2(dy,dx)*180/Math.PI})`);
      const end=step*.78,head=Math.min(.6,end*.35);
      g.innerHTML=`<path d="M0 0H${end-head}"/><path class="arrow-head" d="M${end} 0L${end-head} -.22V.22Z"/>`;
      arrows.append(g);
    }
  }
  arrows.style.setProperty('--wave-duration',`${Math.max(1.2,arrows.childElementCount*.18+.65)}s`);
});
panel.querySelector('button').onclick=()=>document.getElementById('act-guide')?.click();
const style=document.createElement('style');style.textContent=`
.pad-direction-arrows{stroke:#18b776;stroke-width:.1;fill:none}.pad-direction-arrows>g{opacity:.15;animation:padArrowWave var(--wave-duration,2s) linear var(--wave-delay,0s) infinite}.pad-direction-arrows .arrow-head{fill:#18b776;stroke:none}@keyframes padArrowWave{0%{opacity:.15}8%,16%{opacity:1}36%,100%{opacity:.15}}@media(prefers-reduced-motion:reduce){.pad-direction-arrows>g{animation:none;opacity:1}}
html[data-skin="light"] .pad-brand-logo{filter:brightness(0) saturate(100%) invert(25%) sepia(80%) saturate(1000%) hue-rotate(175deg)}
.pad-plan{display:none}body[data-equipment="true"] .pad__main>section:not(.pad-plan){display:none!important}
body[data-equipment="true"] .pad-plan{display:flex;flex-direction:column;position:absolute;inset:1.5rem 2.5rem .5rem;gap:1rem;color:var(--ink,#bcecff);background:transparent;border:0;padding:0;border-radius:0;box-shadow:none}
.pad-plan-logo{width:clamp(14rem,32vw,25rem);aspect-ratio:3891/738;background:var(--tone,var(--brand-hi));mask:url('./assets/baopu-logo.png') center/contain no-repeat;-webkit-mask:url('./assets/baopu-logo.png') center/contain no-repeat}
.pad-plan{color:var(--tone)!important}.pad-plan header{padding-bottom:.4rem}.pad-plan footer>span{color:var(--tone);letter-spacing:.06em}
.pad-plan header,.pad-plan footer{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-shrink:0}.pad-plan small{font-size:.7rem;letter-spacing:.18em;opacity:.65}.pad-plan h1{font-size:1.5rem;margin:.3rem 0}.pad-plan strong{font-size:2rem}
.pad-plan-map{flex:1;min-height:0;min-width:0}.pad-plan-map svg{display:block;width:100%;height:100%}.plan-lines{fill:none;stroke:var(--tone,var(--brand-hi,#80dfff));stroke-width:.035;stroke-linejoin:round;opacity:.85}
.map-equipment{stroke:#18b776;stroke-width:.09;fill:none}.map-equipment rect{fill:var(--bg-0,#071523)}.map-equipment text{fill:#18b776;stroke:none;font-size:.48px;text-anchor:middle;font-family:sans-serif}
.pad-plan footer{font-size:.8rem}.pad-plan button{padding:.8rem 1.2rem;border:1px solid var(--tone);border-radius:.3rem;background:transparent;color:inherit;font:inherit;cursor:pointer}#n-next{display:none!important}
@media(max-height:550px){body[data-equipment="true"] .pad-plan{inset:.5rem 1.5rem .25rem;padding:0;gap:.4rem}.pad-plan-logo{width:clamp(12rem,28vw,20rem)}.pad-plan button{padding:.4rem .8rem}}
`;document.head.append(style);
