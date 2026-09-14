import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const disasters = [
  {name:'火災',topics:[
    ['防火區劃',['doors','walls'],'門、牆與樓板共同形成阻隔，限制火與煙向其他空間蔓延。防火門必須能正常關閉，牆面與管線穿越處也需要完整的防火處理。','不要楔住防火門，也不要堆放物品妨礙關閉。'],
    ['安全梯與阻煙',['doors','core'],'樓梯周邊的區劃與門扇有助維持避難空間；防火不等於完全遮煙，實際性能取決於整體設計與維護。','平時熟悉出口；火災時依現場狀況及消防指示行動，不進入充滿濃煙的通道。'],
    ['偵測與初期應變',[],'警報、探測器、撒水與排煙設備各有不同作用，需要整體連動與定期檢查。本模型不以牆板代替消防設備。','發現火煙先示警並通報；勿為取物返回危險區域。']
  ]},
  {name:'地震',topics:[
    ['梁柱抗震',['beams','columns'],'梁柱構成承受及傳遞地震作用的骨架。實際耐震能力還受接頭、鋼筋細節、材料與施工品質影響，不能單憑外觀判定。','不要任意拆改梁柱或鑿切結構構件。'],
    ['牆體與核心',['walls','core'],'部分結構牆與核心可參與抵抗水平作用；此處亮起的是牆體位置示意，並非認定每面牆都是剪力牆。','裝修前請專業人員確認牆體性質。'],
    ['非結構構件',['frames','glass'],'玻璃、窗框及其他非結構構件的連接與變形容許能力，也影響地震時的掉落風險。','平時固定家具，震動時遠離玻璃與可能掉落的物品。']
  ]},
  {name:'颱風',topics:[
    ['窗框與玻璃',['frames','glass'],'強風對門窗施加壓力；玻璃、框材、固定件與安裝方式需共同符合設計要求，水密性能則影響風雨滲入。','颱風前檢查窗戶能否鎖妥，強風時避免靠近玻璃。'],
    ['外牆與結構',['walls','beams','columns'],'風力由外殼傳至結構。外牆固定與主体耐風設計是不同層次的保護，表面完整不代表連接一定安全。','發現外牆鬆動或異常聲響，通知管理單位檢查。'],
    ['樓板與排水界面',['slabs'],'陽台及屋頂的排水有助減少積水。本次以樓板示意相關空間，不代表已確認排水口或設備的位置。','清理可安全接近的排水口，收妥陽台物品。']
  ]},
  {name:'暴雨／淹水',topics:[
    ['開口與防水界面',['doors','walls'],'出入口、外牆接縫與地下空間開口可能成為進水路徑。防洪需要高程、擋水與防倒灌等整體規劃；防火門不等於防洪門。','依管理單位安排事先部署擋水措施，不冒險穿越積水。'],
    ['樓地板與積水',['slabs'],'樓地板高程及排水坡度影響水流。此处僅標示相關構件，沒有以模型推算淹水深度或抽水能力。','關注地下室與低窪處警示，不在進水時下地下室取車。'],
    ['機電與備援',[],'抽水設備、逆止裝置與備援電源共同影響防淹韌性；設備設置高度及維護也很重要。','留意社區公告與停電安排，勿接觸浸水電器。']
  ]},
  {name:'坡地／土砂',topics:[
    ['基地風險',[],'是否需要坡地防護，須依基地位置、地形與地質判定。建築模型本身無法證明基地位於危險區或已有擋土設施。','留意官方警戒與社區疏散通知。'],
    ['結構異常觀察',['columns','walls'],'柱與牆可作為認識裂縫、傾斜等異常的觀察示意；裂縫原因須由專業人員判讀，不能只看寬度自行下結論。','發現突然增大的裂縫、地面變形或異常聲響，遠離並通報。'],
    ['排水與地盤',[],'坡地截排水及擋土系統有助控制逕流與穩定風險；一般樓板或建築牆不應直接視為護坡、擋土設施。','不要自行改變排水路徑，依警戒提前準備撤離。']
  ]}
];

export function createPreventionPage(){
  const page=document.createElement('section');page.className='page page--home page--prevention';page.dataset.page='prevention';
  const home=document.querySelector('[data-page="home"]');
  const brand=home.querySelector('.home__brand').cloneNode(true);
  brand.removeAttribute('data-obj');brand.removeAttribute('data-label');
  page.innerHTML='<div class="grain"></div><div class="prevention-heading"></div><p class="prevention-subtitle">先行預防</p><div class="stage prevention-stage" id="stage-prevention"></div>';
  page.querySelector('.prevention-heading').append(brand);document.getElementById('app').append(page);
  const nav=document.createElement('nav');nav.className='page-nav';nav.setAttribute('aria-label','展示頁面切換');
  [['welcome','00',''],['intro','01','前言介紹'],['first','02','黃金30秒'],['home','03','逃生動線'],['prevention','04','先行預防'],['outro','05','結語']].forEach(([key,number,label])=>{
    const button=document.createElement('button');button.type='button';button.dataset.goPage=key;button.innerHTML=`<span>${number}</span>${label}`;nav.append(button);
  });
  const skin=document.getElementById('skin-toggle');nav.append(skin);
  const skinLabel=document.createElement('span');skinLabel.className='skin-toggle__label';skin.append(skinLabel);
  const label=()=>{skinLabel.textContent=skin.getAttribute('aria-label')?.includes('淺色')?'淺色版':'深色版';};label();new MutationObserver(label).observe(skin,{attributes:true,attributeFilter:['aria-label']});
  document.getElementById('app').append(nav);
}

export function createInformation(viewer){
  const page=document.querySelector('[data-page="prevention"]');
  const nav=document.createElement('nav');nav.className='information-nav';nav.setAttribute('aria-label','災害科普');
  const panel=document.createElement('aside');panel.className='information-panel';panel.hidden=true;panel.setAttribute('aria-label','建築防災科普');
  panel.innerHTML='<header><h2></h2><button type="button" aria-label="關閉科普解說">關閉</button></header><div class="information-topics"></div><h3></h3><p class="information-description"></p><p class="information-action"></p><p class="information-status" role="status"></p><p class="information-note">教學示意｜紅色代表選取的構件，不代表損壞或警報。構件用途與災害關聯包含推測，非本棟性能認證或即時避難指引。</p>';
  page.append(nav,panel);
  const root=new THREE.Group();root.name='information-components';viewer.modelRoot.add(root);
  let cameraLimits=null;
  const overview=document.createElement('button');overview.type='button';overview.textContent='回到全景';overview.className='information-overview';panel.querySelector('header').after(overview);
  function restoreLimits(){if(cameraLimits){viewer.controls.minDistance=cameraLimits.min;viewer.controls.maxDistance=cameraLimits.max;cameraLimits=null;}}
  overview.onclick=()=>{restoreLimits();viewer.releaseShot(1.2);};
  // Cancel topic motion when the visitor starts dragging; keep OrbitControls available.
  viewer.controls.addEventListener('start',()=>{if(page.classList.contains('is-active')){viewer._fly=null;viewer.controls.autoRotate=false;viewer.swing.on=false;}});
  function boxes(group){if(!group)return [];group.updateWorldMatrix(true,true);return group.children.filter(x=>x.isMesh).map(mesh=>new THREE.Box3().setFromObject(mesh)).filter(box=>!box.isEmpty());}
  function focusTopic(topic,groups){
    if(!page.classList.contains('is-active'))return;
    if(!groups.length){overview.click();return;}
    root.updateWorldMatrix(true,true);
    const full=new THREE.Box3().setFromObject(root),center=full.getCenter(new THREE.Vector3());let target=center.clone(),size=full.getSize(new THREE.Vector3()),direction=new THREE.Vector3(1,.7,1),detail=false;
    const mapped=Object.fromEntries(topic[1].map((key,i)=>[key,groups[i]]));
    if(topic[0]==='防火區劃'||topic[0].includes('積水')||topic[0].includes('排水')){
      direction.set(.015,1,.045);
    }else if(topic[0]==='梁柱抗震'){
      const joints=[];
      for(const beam of boxes(mapped.beams))for(const column of boxes(mapped.columns)){
        const hit=beam.clone().expandByScalar(.12).intersect(column);
        if(!hit.isEmpty())joints.push(hit.getCenter(new THREE.Vector3()));
      }
      joints.sort((a,b)=>b.y-a.y||a.distanceToSquared(center)-b.distanceToSquared(center));
      if(joints.length){target=joints[0];size.set(6,5,6);detail=true;direction.set(1,.65,1);}
    }else if(topic[1].includes('glass')||topic[1].includes('frames')){
      const candidates=boxes(mapped.glass??mapped.frames).filter(box=>{const s=box.getSize(new THREE.Vector3());return Math.max(s.x,s.y,s.z)<8&&Math.max(s.x,s.y,s.z)>.3;});
      candidates.sort((a,b)=>a.getCenter(new THREE.Vector3()).distanceToSquared(viewer.camera.position)-b.getCenter(new THREE.Vector3()).distanceToSquared(viewer.camera.position));
      if(candidates.length){const chosen=candidates[0];target=chosen.getCenter(new THREE.Vector3());size=chosen.getSize(new THREE.Vector3()).multiplyScalar(2.5);detail=true;direction.copy(target).sub(center);direction.y=.6;if(direction.length()<.1)direction.set(1,.3,1);}
    }else if(topic[0]==='安全梯與阻煙'){
      const doors=boxes(mapped.doors);if(doors.length){const selected=doors.sort((a,b)=>b.max.y-a.max.y)[0];target=selected.getCenter(new THREE.Vector3());size.set(9,9,9);detail=true;direction.set(1,1.1,1);}
    }
    cameraLimits??={min:viewer.controls.minDistance,max:viewer.controls.maxDistance};viewer.controls.minDistance=2;viewer.controls.maxDistance=Math.max(cameraLimits.max,180);
    const fov=THREE.MathUtils.degToRad(viewer.camera.fov),extent=detail?Math.max(size.x,size.y,size.z):Math.max(size.x,size.z,size.y);
    const distance=Math.max(5,extent/(2*Math.tan(fov/2))*1.3);
    const position=target.clone().add(direction.normalize().multiplyScalar(distance));
    viewer._override=true;viewer._hold=true;viewer.controls.autoRotate=false;viewer.swing.on=false;
    viewer._flyTo({pos:position.toArray(),target:target.toArray()},matchMedia('(prefers-reduced-motion: reduce)').matches?.01:1.5);
  }
  // Match the original tower coordinates; no independent normalization or camera changes.
  const visibility=new MutationObserver(()=>{root.visible=page.classList.contains('is-active')&&!panel.hidden;if(!page.classList.contains('is-active')){++ticket;restoreLimits();}});
  visibility.observe(page,{attributes:true,attributeFilter:['class']});
  const cache=new Map();let ticket=0;
  async function component(key){
    if(!cache.has(key))cache.set(key,new GLTFLoader().loadAsync(`./models/information/component-${key}.gltf`).then(({scene})=>{
      scene.updateMatrixWorld(true);const group=new THREE.Group();
      scene.traverse(source=>{if(!source.isMesh)return;const geometry=source.geometry.clone();geometry.applyMatrix4(source.matrixWorld);
        const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:key==='doors'?.85:.32,depthWrite:false,depthTest:false,side:THREE.DoubleSide}));mesh.renderOrder=90;group.add(mesh);
        const lines=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial({color:0xff4545,transparent:true,opacity:.85,depthTest:false,depthWrite:false}));lines.renderOrder=91;group.add(lines);
      });return group;
    }).catch(error=>{cache.delete(key);throw error;}));return cache.get(key);
  }
  async function selectTopic(topic,button){
    panel.querySelectorAll('.information-topics button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    panel.querySelector('h3').textContent=topic[0];panel.querySelector('.information-description').textContent=topic[2];panel.querySelector('.information-action').textContent=`居民可以做：${topic[3]}`;
    const status=panel.querySelector('.information-status');const id=++ticket;root.clear();root.visible=true;
    status.textContent=topic[1].length?'正在載入相關構件…':'此主題以文字說明，不以其他構件代替設備。';
    try{const groups=await Promise.all(topic[1].map(component));if(id!==ticket)return;groups.forEach(g=>root.add(g));focusTopic(topic,groups);status.textContent=groups.length?'紅色構件：'+topic[0]+' · 可拖曳調整視角':status.textContent;}
    catch{if(id===ticket)status.textContent='構件載入未完成，請重新選取主題。';}
  }
  disasters.forEach(disaster=>{const button=document.createElement('button');button.type='button';button.textContent=disaster.name;button.setAttribute('aria-pressed','false');nav.append(button);button.addEventListener('click',()=>{
    panel.hidden=false;page.classList.add('information-open');nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));panel.querySelector('h2').textContent=disaster.name+' · 建築防護';
    const topics=panel.querySelector('.information-topics');topics.replaceChildren();disaster.topics.forEach(topic=>{const b=document.createElement('button');b.type='button';b.textContent=topic[0];b.setAttribute('aria-pressed','false');b.onclick=()=>selectTopic(topic,b);topics.append(b);});topics.firstElementChild.click();
  });});
  panel.querySelector('header button').onclick=()=>{++ticket;overview.click();root.clear();root.visible=false;panel.hidden=true;page.classList.remove('information-open');nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));};
}
