import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { createDetectionDiscs } from './detection-discs.js';
import { createInformationCamera } from './information-camera.js';
import { createCaptionDirector,buildCaptionShots,createCaptionProgress } from './information-story.js';
import { fitInformationShot } from './information-framing.js';
import { createCompartmentSmoke } from './compartment-smoke.js';

export const disasters = [
  {
    "name": "火災",
    "topics": [
      [
        "防火區劃",
        [
          "doors",
          "fire-walls"
        ],
        "建築透過防火門、防火窗等構件建立防火區劃，在火災發生時協助限制火勢向其他空間蔓延。公區生命週期計畫也已將防火門、防火窗納入後續保養與更新管理。",
        "平時保持防火門正常關閉，不以物品固定門扇，也不要堆放物品妨礙防火門運作。"
      ],
      [
        "安全梯與避難",
        [
          "doors",
          "stairs"
        ],
        "公共空間配置緊急照明、出口標示及避難方向指示等設備，在火災或停電時協助辨識避難方向，相關消防設備也納入後續定期維護管理。",
        "平時熟悉出口；火災時依現場狀況及消防指示行動，不進入充滿濃煙的通道。"
      ],
      [
        "偵測與初期應變",
        [],
        "建築配置火警受信總機、緊急廣播、探測、消防栓、泡沫滅火及自動撒水等設備，從偵測、警報到初期滅火形成多層防護。",
        "發現火煙請先示警並通報；勿為取物返回危險區域。"
      ]
    ]
  },
  {
    "name": "地震",
    "topics": [
      [
        "梁柱抗震",
        [
          "beams",
          "columns"
        ],
        "建築採用 0.41G 耐震設計，由結構骨架承受及傳遞地震作用，提升建築面對地震時的耐震能力。",
        "日常裝修時，不任意拆改梁柱，也不要自行鑿切結構構件。"
      ],
      [
        "結構與管線分離",
        ["pipes","beams","columns"],
        "採用 SI 工法，將結構與管線分離，使管線在地震時具有搖晃與緩衝空間，也讓震後檢查及維修更容易進行。",
        "裝修或變更管線前先確認原有設計，避免任意破壞結構或改變管線配置。"
      ],
      [
        "地震感知與安全停靠",
        ["core"],
        "電梯配置地震感知器，地震發生時可自動定位並於避難樓層停靠開門，降低人員受困於電梯的風險。",
        "地震發生時依現場指示避難；震後未確認設備安全前，不自行搭乘電梯。"
      ]
    ]
  },
  {
    "name": "颱風",
    "topics": [
      [
        "窗框與玻璃",
        [
          "frames",
          "glass"
        ],
        "門窗的玻璃、框材與固定方式共同形成抵抗風雨的建築外殼，外牆金屬構件採用不鏽鋼材質，降低長期鏽蝕造成鬆動的風險。",
        "颱風前檢查窗戶能否鎖妥，強風時避免靠近玻璃。"
      ],
      [
        "外牆與結構",
        [
          "beams",
          "columns"
        ],
        "外牆構件的材料、固定與後續巡檢共同維持建築外殼的安全，並透過長期維護降低材料老化、鬆動與掉落的風險。",
        "一旦發現外牆鬆動或異常聲響，通知管理單位檢查。"
      ],
      [
        "樓板與排水界面",
        [
          "slabs",
          "drainage"
        ],
        "建築配置雨水排水及相關抽水設備，包括雨水泵浦與機坑抽水設備，協助雨水排除。",
        "平時清理可安全接近的排水口，收妥陽台物品。"
      ]
    ]
  },
  {
    "name": "暴雨／淹水",
    "topics": [
      [
        "排水與抽水",
        ["drainage"],
        "建築配置雨水、廢水排水及抽水設備，在豪雨期間協助排除積水，相關設備並納入後續維護管理。",
        "關注地下室與低窪處警示，不在進水時下地下室取車。"
      ],
      [
        "機電與備援",
        ["pipes"],
        "建築配置緊急發電機，並將發電設備納入定期保養與運轉管理，在停電等異常狀況下提供必要的備援能力。",
        "留意社區公告與停電安排，勿接觸浸水電器。"
      ]
    ]
  },
  {
    "name": "坡地／土砂",
    "topics": [
      [
        "結構異常觀察",
        [
          "columns",
          "walls"
        ],
        "建築的柱、牆及其他結構構件可作為觀察裂縫、傾斜等異常的位置；異常原因仍應由專業人員進一步判讀。",
        "發現突然增大的裂縫、地面變形或異常聲響，遠離並通報。"
      ],
      [
        "排水與地盤",
        ["drainage"],
        "坡地安全也和排水、地盤狀況密切相關。排水路徑如果受到改變，可能影響原本的排水方式，因此這類設施不適合自行調整。",
        "不要自行改變排水路徑，依警戒公告提前準備撤離。"
      ]
    ]
  }
];

export function createPreventionPage(){
  const page=document.createElement('section');page.className='page page--home page--prevention';page.dataset.page='prevention';
  const home=document.querySelector('[data-page="home"]');
  const brand=home.querySelector('.home__brand').cloneNode(true);
  brand.removeAttribute('data-obj');brand.removeAttribute('data-label');
  page.innerHTML='<div class="grain"></div><div class="prevention-heading"></div><p class="prevention-subtitle">先行預防</p><div class="stage prevention-stage" id="stage-prevention"></div>';
  page.querySelector('.prevention-heading').append(brand);document.getElementById('app').append(page);
  const nav=document.createElement('nav');nav.className='page-nav';nav.setAttribute('aria-label','展示頁面切換');
  [['welcome','01','前言介紹'],['first','02','黃金30秒'],['home','03','逃生動線'],['prevention','04','先行預防'],['outro','05','結語']].forEach(([key,number,label])=>{
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
  const detectionNote=document.createElement('p');detectionNote.className='detection-note';detectionNote.textContent='紅色圓盤為偵測設備示意，非實際設備位置、數量或警報。';detectionNote.hidden=true;panel.append(detectionNote);
  let detection=null;
  function clearDetection(){detection?.dispose();detection=null;detectionNote.hidden=true;}
  const stage=document.getElementById('stage-prevention');
  function sizeStage(){
    const bounds=page.getBoundingClientRect(),upper=nav.getBoundingClientRect(),lower=(document.querySelector('.narration-dock:not([hidden])')||document.querySelector('.page-nav')).getBoundingClientRect();
    if(!bounds.height||!bounds.width)return;
    const scale=page.clientHeight/bounds.height;
    const top=(upper.bottom-bounds.top+5)*scale,bottom=(lower.top-bounds.top-5)*scale;
    stage.style.top=`${top}px`;stage.style.height=`${Math.max(100,bottom-top)}px`;
    viewer.resize();
  }
  const root=new THREE.Group();root.name='information-components';viewer.modelRoot.add(root);
  let cameraLimits=null,motionGeneration=0,windowHighlight=null,story=null;
  let compartmentSmoke=null;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  function stopDrift(){motionGeneration++;viewer._informationMotion=null;}
  function stopStory(){story?.director.cancel();story=null;compartmentSmoke?.hide();}
  window.addEventListener('narration:caption',event=>story?.director.accept(event.detail));
  window.addEventListener('narration:ended',event=>story?.director.finish(event.detail));
  const overview=document.createElement('button');overview.type='button';overview.textContent='回到全景';overview.className='information-overview';panel.querySelector('header').after(overview);
  function restoreLimits(){stopStory();stopDrift();if(cameraLimits){viewer.controls.minDistance=cameraLimits.min;viewer.controls.maxDistance=cameraLimits.max;cameraLimits=null;}}
  overview.onclick=()=>{restoreLimits();if(windowHighlight){windowHighlight.groups.forEach(g=>g.visible=true);windowHighlight.focus.visible=false;}const tower=viewer.customModels.tower;if(tower)focusTopic(['全景',[]],[tower]);else viewer.releaseShot(1.2);};
  // Cancel topic motion when the visitor starts dragging; keep OrbitControls available.
  viewer.controls.addEventListener('start',()=>{if(page.classList.contains('is-active')){stopStory();stopDrift();viewer._fly=null;viewer.controls.autoRotate=false;viewer.swing.on=false;}});
  function boxes(group){if(!group)return [];group.updateWorldMatrix(true,true);return group.children.filter(x=>x.isMesh||x.isLine).map(mesh=>new THREE.Box3().setFromObject(mesh)).filter(box=>!box.isEmpty());}
  function focusTopic(topic,groups,focusWindow=null){
    if(!page.classList.contains('is-active'))return;
    stopDrift();
    sizeStage();
    if(!groups.length){const tower=viewer.customModels.tower;if(tower)focusTopic(topic,[tower]);return;}
    root.updateWorldMatrix(true,true);
    // The drainage opening shot must fit the whole tower, not only the lower slab bounds.
    const framingGroups=['樓板與排水界面','機電與備援'].includes(topic[0])&&viewer.customModels.tower?[viewer.customModels.tower]:groups;
    const full=new THREE.Box3(),framingMeshes=[];framingGroups.forEach(group=>{
      if(group===viewer.customModels.tower){
        // Hidden route runners/smoke helpers can extend to the origin. They must
        // not pull the building's framing center below its actual geometry.
        const materials=Object.values(viewer._blueprintMats??{});
        group.updateWorldMatrix(true,true);
        group.traverse(mesh=>{if((mesh.isMesh||mesh.userData.buildingLineArt)&&materials.includes(mesh.material)){full.union(new THREE.Box3().setFromObject(mesh));framingMeshes.push(mesh);}});
      }else {full.union(new THREE.Box3().setFromObject(group));group.traverse(mesh=>{if(mesh.isMesh||mesh.isLine)framingMeshes.push(mesh);});}
    });if(full.isEmpty())return;const center=full.getCenter(new THREE.Vector3());let target=center.clone(),size=full.getSize(new THREE.Vector3()),direction=new THREE.Vector3(1,.7,1),detail=false;
    const mapped=Object.fromEntries(topic[1].map((key,i)=>[key,groups[i]]));
    // Topics showing the same beam/column pair share one spatial storyboard.
    // Mixed systems (e.g. pipes + structure) keep their own wider framing.
    const jointTour=topic[1].length===2&&topic[1].includes('beams')&&topic[1].includes('columns');
    const jointStops=[];
    const planView=topic[0]==='防火區劃'||topic[0].includes('積水');
    if(planView){
      // Principal horizontal axis of the actual geometry, not the world axes.
      let xx=0,xz=0,zz=0,count=0,mx=0,mz=0;
      const points=[];framingMeshes.forEach(object=>{const p=(object.userData.framingGeometry??object.geometry).attributes.position;for(let i=0;i<p.count;i+=Math.max(1,Math.floor(p.count/300))){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(object.matrixWorld);points.push(v);mx+=v.x;mz+=v.z;count++;}});
      mx/=count||1;mz/=count||1;points.forEach(p=>{const x=p.x-mx,z=p.z-mz;xx+=x*x;xz+=x*z;zz+=z*z;});
      const angle=.5*Math.atan2(2*xz,xx-zz);
      direction.set(-Math.sin(angle)*.025,1,Math.cos(angle)*.025);
    }else if(jointTour){
      const joints=[];
      for(const beam of boxes(mapped.beams))for(const column of boxes(mapped.columns)){
        const hit=beam.clone().expandByScalar(.12).intersect(column);
        if(!hit.isEmpty())joints.push(hit.getCenter(new THREE.Vector3()));
      }
      joints.sort((a,b)=>b.y-a.y||a.distanceToSquared(center)-b.distanceToSquared(center));
      if(joints.length){
        // Spread stops across the upper-floor beam/column intersections, not three
        // faces of one joint. Keep a common viewing direction throughout the tour.
        const candidates=joints.filter(p=>p.y>=joints[0].y-.5);
        jointStops.push(joints[0].clone());
        while(jointStops.length<3){
          let next=null,separation=4;
          for(const point of candidates){
            const nearest=Math.min(...jointStops.map(stop=>stop.distanceToSquared(point)));
            if(nearest>separation){separation=nearest;next=point;}
          }
          if(!next)break;
          jointStops.push(next.clone());
        }
        target=jointStops[0].clone();size.set(6,5,6);detail=true;direction.set(1,.65,1);
      }
    }else if(topic[1].includes('glass')||topic[1].includes('frames')){
      if(focusWindow){
        // The supplied window retains building coordinates, including its frame and glass.
        const chosen=new THREE.Box3().setFromObject(focusWindow);
        target=chosen.getCenter(new THREE.Vector3());size=chosen.getSize(new THREE.Vector3());
        // Face the thin axis of this window from outside the building.
        direction.set(size.x<size.z?(Math.sign(target.x-center.x)||1):0,.18,size.x<size.z?0:(Math.sign(target.z-center.z)||1));
        size.multiplyScalar(1.65);detail=true;
      }
    }else if(topic[0]==='安全梯與避難'&&mapped.stairs){
      // The stair asset contains many small flights/landings. Frame the whole
      // highlighted set, never the highest individual fragment.
      target=full.getCenter(new THREE.Vector3());
      size=full.getSize(new THREE.Vector3()).multiplyScalar(1.05);
      detail=true;direction.set(1,1.1,1);
    }else if(topic[0]==='地震感知與安全停靠'){
      target=full.getCenter(new THREE.Vector3());
      size=full.getSize(new THREE.Vector3());detail=true;direction.set(1,.7,1);
    }
    cameraLimits??={min:viewer.controls.minDistance,max:viewer.controls.maxDistance};viewer.controls.minDistance=2;viewer.controls.maxDistance=Math.max(cameraLimits.max,180);
    // Fit the projected bounds to the model area, accounting for horizontal FOV.
    // The previous max-dimension/vertical-FOV fit left wide top views too small.
    const forward=direction.clone().normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),forward).normalize(),up=new THREE.Vector3().crossVectors(forward,right);
    const fit=detail?new THREE.Box3().setFromCenterAndSize(target,size):full;
    const fov=THREE.MathUtils.degToRad(viewer.camera.fov),tanY=Math.tan(fov/2),tanX=tanY*viewer.camera.aspect;
    let distance=5;
    const projected=[];
    const groundUp=new THREE.Vector3(up.x,0,up.z).normalize();
    const footprint=topic[0]==='防火區劃'?{origin:target.toArray(),up:groundUp.toArray(),minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity}:null;
    function include(v){
      const p=v.sub(target);projected.push([p.dot(right),p.dot(up),p.dot(forward)]);
      if(footprint){
        const x=p.dot(right),y=p.dot(groundUp);
        footprint.minX=Math.min(footprint.minX,x);footprint.maxX=Math.max(footprint.maxX,x);
        footprint.minY=Math.min(footprint.minY,y);footprint.maxY=Math.max(footprint.maxY,y);
      }
    }
    if(detail){for(const x of [fit.min.x,fit.max.x])for(const y of [fit.min.y,fit.max.y])for(const z of [fit.min.z,fit.max.z])include(new THREE.Vector3(x,y,z));}
    else framingMeshes.forEach(mesh=>{const p=(mesh.userData.framingGeometry??mesh.geometry).attributes.position;for(let i=0;i<p.count;i++)include(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));});
    // Use occupied geometry, not the empty corners of a rotated world bounding box.
    // Solve vertical framing first, then retain only the horizontal safety constraint.
    for(const [x,y,z] of projected)distance=Math.max(distance,z+Math.abs(x)/(tanX*.96),z+Math.abs(y)/(tanY*.96));
    // Center the perspective silhouette, which need not share the world-box center.
    const fixedStairPivot=topic[0]==='安全梯與避難'&&!!mapped.stairs;
    for(let pass=0;pass<(fixedStairPivot?0:3);pass++){
      let lo=Infinity,hi=-Infinity;
      for(const [,y,z] of projected){const value=y/(distance-z);lo=Math.min(lo,value);hi=Math.max(hi,value);}
      const offset=(lo+hi)*.5*distance;target.addScaledVector(up,offset);projected.forEach(p=>p[1]-=offset);
      distance=5;for(const [x,y,z] of projected)distance=Math.max(distance,z+Math.abs(x)/(tanX*.96),z+Math.abs(y)/(tanY*.96));
    }
    if(fixedStairPivot){
      // A sphere fits every orbit angle, including the paths between subtitle
      // shots. Keep the physical center fixed instead of shifting it upward.
      const limitingHalfFov=Math.atan(Math.min(tanX,tanY)*.96);
      distance=Math.max(distance,size.length()*.5/Math.sin(limitingHalfFov));
    }
    const position=target.clone().add(direction.normalize().multiplyScalar(distance));
    viewer._override=true;viewer._hold=true;viewer.controls.autoRotate=false;viewer.swing.on=false;
    const reduced=reducedMotion.matches,activeTicket=ticket,generation=motionGeneration;
    const shot={pos:position.toArray(),target:target.toArray()};
    const motionMode=planView?'plan':detail?(jointTour?'joint':'detail'):'overview';
    const framingShift=jointStops.length?target.clone().sub(jointStops[0]):null;
    const targets=jointStops.map(point=>point.clone().add(framingShift).toArray());
    if(story?.topic===topic[0]){
      const selectedStory=story;
      selectedStory.refocus=()=>focusTopic(topic,groups,focusWindow);
      selectedStory.director.prepare();
      let lo=Infinity,hi=-Infinity;
      for(const [x] of projected){lo=Math.min(lo,x);hi=Math.max(hi,x);}
      const kind=topic[0]==='防火區劃'?'compartment':topic[0]==='機電與備援'?'backup':motionMode;
      let topShot;
      if(kind==='backup'){
        const pivot=full.getCenter(new THREE.Vector3());
        const normal=new THREE.Vector3(-.025,1,0).normalize();
        const topRight=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),normal).normalize();
        const topUp=new THREE.Vector3().crossVectors(normal,topRight);
        let topDistance=5;
        for(const x of [full.min.x,full.max.x])for(const y of [full.min.y,full.max.y])for(const z of [full.min.z,full.max.z]){
          const p=new THREE.Vector3(x,y,z).sub(pivot),depth=p.dot(normal);
          topDistance=Math.max(topDistance,depth+Math.abs(p.dot(topRight))/(tanX*.94),depth+Math.abs(p.dot(topUp))/(tanY*.94));
        }
        topShot={target:pivot.toArray(),pos:pivot.clone().addScaledVector(normal,topDistance).toArray()};
      }
      selectedStory.shots=buildCaptionShots({shot,kind,targets,right:right.toArray(),span:hi-lo,footprint,topShot});
      if(kind==='compartment'){
        compartmentSmoke??=createCompartmentSmoke();
        compartmentSmoke.fit(footprint,right.toArray(),full.max.y,[selectedStory.smokeWalls,mapped.doors]);root.add(compartmentSmoke.mesh);
      }
      // Preserve authored spatial stops (compartments, joints, drainage), while
      // re-fitting orbit shots around their actual subject at each new angle.
      if(!['compartment','joint','drainage','plan'].includes(kind)){
        const points=[],subjects=focusWindow?[focusWindow]:framingGroups;
        subjects.forEach(group=>group.traverse(mesh=>{
          if(!(mesh.isMesh||mesh.isLine))return;
          if(group===viewer.customModels.tower&&!mesh.userData.buildingLineArt&&!Object.values(viewer._blueprintMats??{}).includes(mesh.material))return;
          const geometry=mesh.userData.framingGeometry??mesh.geometry,p=geometry?.attributes.position;
          if(!p)return;
          mesh.updateWorldMatrix(true,false);
          const step=Math.max(1,Math.floor(p.count/1600));
          for(let i=0;i<p.count;i+=step)points.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray());
        }));
        selectedStory.shots=selectedStory.shots.map((view,index)=>fitInformationShot(view,points,{tanX,tanY,rotate:kind==='overview'||(kind==='backup'&&index>0)}));
      }
      selectedStory.onArrive=index=>{if(kind==='compartment')compartmentSmoke.show(index);if(focusWindow){groups.forEach(g=>g.visible=false);focusWindow.visible=true;}};
      const ready=()=>{
        if(selectedStory!==story||generation!==motionGeneration||activeTicket!==ticket||!page.classList.contains('is-active'))return;
        selectedStory.director.ready();
      };
      // Always establish the topic view, even if browser audio playback is blocked.
      // Further sentence shots still follow media time rather than an independent timer.
      const initial=['compartment','joint','drainage','plan'].includes(kind)?(topShot??shot):selectedStory.shots[0];
      const entry=topic[0]==='防火區劃'?shot:{target:[...initial.target],pos:initial.pos.map((v,i)=>initial.target[i]+(v-initial.target[i])*1.12)};
      viewer._flyTo(entry,reduced?.01:1.3,ready);
      return;
    }
    const sample=createInformationCamera({...shot,right:right.toArray(),up:up.toArray(),mode:motionMode,tanX,tanY,targets});
    viewer._flyTo(shot,reduced?.01:1.5,()=>{
      if(generation!==motionGeneration||activeTicket!==ticket||!page.classList.contains('is-active'))return;
      // Arrive first, isolate the chosen window second, then begin the camera swing.
      // Hide only the red overlays; the tower's original window materials stay intact.
      if(focusWindow){groups.forEach(g=>g.visible=false);focusWindow.visible=true;}
      if(reduced)return;
      // Use the viewer's existing render loop; leave 02/03 route timing untouched.
      viewer._informationMotion=(time,paused)=>{
        if(generation!==motionGeneration||activeTicket!==ticket||!page.classList.contains('is-active')||reducedMotion.matches){stopDrift();return;}
        const next=sample(time,paused||document.hidden);
        viewer.camera.position.fromArray(next.pos);
        viewer.controls.target.fromArray(next.target);
      };
    });
  }
  // Match the original tower coordinates; no independent normalization or camera changes.
  const visibility=new MutationObserver(()=>{root.visible=page.classList.contains('is-active')&&!panel.hidden;if(!page.classList.contains('is-active')){++ticket;clearDetection();restoreLimits();}});
  visibility.observe(page,{attributes:true,attributeFilter:['class']});
  const cache=new Map();let ticket=0;
  function redLineMaterial(){
    // Native WebGL lines are one framebuffer pixel; preserve the exact 2x ratio.
    return new LineMaterial({color:0xff4545,linewidth:2/viewer.renderer.getPixelRatio(),worldUnits:false,transparent:true,opacity:.85,depthTest:false,depthWrite:false});
  }
  function redLines(geometry,material,segments=true,loop=false){
    const p=geometry.attributes.position,index=geometry.index,count=index?index.count:p.count,positions=[];
    function append(i){const n=index?index.getX(i):i;positions.push(p.getX(n),p.getY(n),p.getZ(n));}
    for(let i=0;i<count-1;i+=segments?2:1){append(i);append(i+1);}
    if(loop&&count>1){append(count-1);append(0);}
    const thick=new LineSegmentsGeometry().setPositions(positions);
    const lines=new LineSegments2(thick,material);lines.userData.framingGeometry=geometry;lines.renderOrder=91;
    return lines;
  }
  async function component(key,solid=false){
    const cacheKey=`${solid?'solid':'line'}:${key}`;
    if(!cache.has(cacheKey))cache.set(cacheKey,new GLTFLoader().loadAsync(`./models/${solid?'information':'information-line'}/component-${key}.${['pipes','drainage'].includes(key)?'glb':'gltf'}`).then(({scene})=>{
      scene.updateMatrixWorld(true);const group=new THREE.Group();
      if(key==='fire-walls'){
        // The revised asset is thousands of short line strips. Preserve every
        // segment while batching the single-color overlay into one draw call.
        const positions=[],point=new THREE.Vector3();
        scene.traverse(source=>{
          if(!source.isLine)return;
          const p=source.geometry.attributes.position,index=source.geometry.index,count=index?index.count:p.count;
          const append=i=>{point.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(source.matrixWorld);positions.push(point.x,point.y,point.z);};
          for(let i=0;i<count-1;i+=source.isLineSegments?2:1){append(i);append(i+1);}
          if(source.isLineLoop&&count>1){append(count-1);append(0);}
        });
        if(!positions.length)throw new Error('No fire-wall line geometry');
        const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        group.add(redLines(geometry,redLineMaterial()));return group;
      }
      if(key==='pipes'||key==='drainage'){
        const material=redLineMaterial();
        scene.traverse(source=>{
          if(!source.isMesh)return;
          const geometry=source.geometry.clone();geometry.applyMatrix4(source.matrixWorld);
          const lines=redLines(new THREE.EdgesGeometry(geometry,30),material);
          geometry.dispose();lines.name=source.name;Object.assign(lines.userData,source.userData);group.add(lines);
        });
        return group;
      }
      if(!solid){
        const material=redLineMaterial();
        scene.traverse(source=>{
          if(!source.isLine)return;
          const geometry=source.geometry.clone();geometry.applyMatrix4(source.matrixWorld);
          const lines=redLines(geometry,material,!!source.isLineSegments,!!source.isLineLoop);
          lines.renderOrder=91;group.add(lines);
        });
        if(!group.children.length)throw new Error(`No line geometry: ${key}`);
        return group;
      }
      scene.traverse(source=>{if(!source.isMesh)return;const geometry=source.geometry.clone();geometry.applyMatrix4(source.matrixWorld);
        const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:key==='doors'?.85:(key==='glass'||key==='frames'||key==='focus-window')?.4:.32,depthWrite:false,depthTest:false,side:THREE.DoubleSide}));mesh.renderOrder=90;group.add(mesh);
        const lines=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial({color:0xff4545,transparent:true,opacity:.85,depthTest:false,depthWrite:false}));lines.renderOrder=91;group.add(lines);
      });return group;
    }).catch(error=>{cache.delete(cacheKey);throw error;}));return cache.get(cacheKey);
  }
  async function selectTopic(topic,button){
    const id=++ticket;stopStory();stopDrift();viewer._fly=null;clearDetection();root.clear();root.visible=true;windowHighlight=null;
    const selectedStory={topic:topic[0],shots:null,onArrive:null,director:null};
    selectedStory.director=createCaptionDirector({topic:topic[0],onEnd:()=>{
      if(story!==selectedStory||id!==ticket||!page.classList.contains('is-active'))return;
      // Keep the director available for replay; only stop the completed camera shot.
      compartmentSmoke?.hide();
      stopDrift();viewer._fly=null;
      if(windowHighlight){windowHighlight.groups.forEach(g=>g.visible=true);windowHighlight.focus.visible=false;}
      const tower=viewer.customModels.tower;
      if(tower)focusTopic(['全景',[]],[tower]);else viewer.releaseShot(1.2);
    },onShot:cue=>{
      if(story!==selectedStory||id!==ticket||!page.classList.contains('is-active')||!selectedStory.shots?.length)return;
      const shot=selectedStory.shots[cue.index%selectedStory.shots.length];
      compartmentSmoke?.hide();
      stopDrift();viewer._fly=null;
      const from={pos:viewer.camera.position.toArray(),target:viewer.controls.target.toArray()};
      const progress=createCaptionProgress(cue.readClock);
      let arrived=false;
      viewer._informationMotion=()=>{
        if(story!==selectedStory||id!==ticket||!page.classList.contains('is-active')){stopDrift();return;}
        const state=progress();
        if(!state.valid){stopDrift();return;}
        if(!state.ready)return;
        const k=reducedMotion.matches?1:state.progress;
        viewer._lerpView(from,shot,k*k*(3-2*k));
        if(k>=1&&!arrived){arrived=true;selectedStory.onArrive?.(cue.index);}
      };
    }});
    story=selectedStory;
    window.dispatchEvent(new CustomEvent('information:selection',{detail:{disaster:disasters.find(d=>d.topics.includes(topic))?.name,topic:topic[0],description:topic[2],action:topic[3]}}));
    window.dispatchEvent(new CustomEvent('narration:topic',{detail:topic[0]}));
    panel.querySelectorAll('.information-topics button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    panel.querySelector('h3').textContent=topic[0];panel.querySelector('.information-description').textContent=topic[2];panel.querySelector('.information-action').textContent=topic[3];
    const status=panel.querySelector('.information-status');
    if(topic[0]==='偵測與初期應變'){
      try{
        const slabs=await component('slabs',true);if(id!==ticket)return;
        detection=createDetectionDiscs(slabs);root.add(detection.group);detectionNote.hidden=false;
        const tower=viewer.customModels.tower;focusTopic(topic,tower?[tower]:[detection.group]);
      }catch{status.textContent='偵測示意載入未完成，請重新選取。';}
      return;
    }
    status.textContent=topic[1].length?'正在載入相關構件…':'此主題以文字說明，不以其他構件代替設備。';
    try{
      const isWindowTopic=topic[1].includes('glass')||topic[1].includes('frames');
      const [groups,focusWindow,smokeWalls]=await Promise.all([Promise.all(topic[1].map(key=>component(key))),isWindowTopic?component('focus-window'):null,topic[0]==='防火區劃'?component('walls'):null]);
      if(id!==ticket)return;
      selectedStory.smokeWalls=smokeWalls;
      // Cached overlays must be recolored on every selection: interior pipes
      // are green beside the structural frame, but remain red when shown alone.
      const hasStructure=topic[1].includes('beams')||topic[1].includes('columns');
      const greenPipes=hasStructure&&topic[1].includes('pipes');
      const greenDrainage=topic[1].includes('slabs')&&topic[1].includes('drainage');
      groups.forEach((g,index)=>{
        const color=(greenPipes&&topic[1][index]==='pipes')||(greenDrainage&&topic[1][index]==='drainage')?0x20c878:0xff4545;
        g.traverse(object=>{
          const materials=Array.isArray(object.material)?object.material:[object.material];
          materials.forEach(material=>material?.color?.setHex(color));
        });
        g.visible=true;g.children.forEach(child=>child.visible=true);root.add(g);
      });
      if(focusWindow){focusWindow.visible=false;root.add(focusWindow);windowHighlight={groups,focus:focusWindow};}
      focusTopic(topic,groups,focusWindow);
      status.textContent=groups.length?(greenPipes?'紅色：梁柱 · 綠色：管線':greenDrainage?'紅色：樓板 · 綠色：排水路徑':'紅色構件：'+topic[0])+' · 可拖曳調整視角':status.textContent;
    }
    catch{if(id===ticket)status.textContent='構件載入未完成，請重新選取主題。';}
  }
  let requestedTopic=0;
  disasters.forEach(disaster=>{const button=document.createElement('button');button.type='button';button.textContent=disaster.name;button.setAttribute('aria-pressed','false');nav.append(button);button.addEventListener('click',()=>{
    panel.hidden=false;page.classList.add('information-open');nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));panel.querySelector('h2').textContent=disaster.name+' · 建築防護';
    const topics=panel.querySelector('.information-topics');topics.replaceChildren();disaster.topics.forEach(topic=>{const b=document.createElement('button');b.type='button';b.textContent=topic[0];b.setAttribute('aria-pressed','false');b.onclick=()=>selectTopic(topic,b);topics.append(b);});topics.children[requestedTopic]?.click();requestedTopic=0;
  });});
  panel.querySelector('header button').onclick=()=>{window.dispatchEvent(new CustomEvent('narration:topic',{detail:null}));++ticket;clearDetection();overview.click();root.clear();root.visible=false;panel.hidden=true;page.classList.remove('information-open');nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));};
  let resizeTimer;
  panel.querySelector('header button').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('information:selection',{detail:null})));
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
    if(!page.classList.contains('is-active'))return;
    sizeStage();
    // Resizing used to click Overview and cancel the subtitle director permanently.
    if(story?.refocus)story.refocus();else if(!story)overview.click();
  },180);});
  return {catalog:disasters.map(d=>({name:d.name,topics:d.topics.map(t=>t[0])})),select(choice){const di=disasters.findIndex(d=>d.name===choice?.disaster);if(di<0)return;const ti=disasters[di].topics.findIndex(t=>t[0]===choice?.topic);if(ti<0)return;requestedTopic=ti;nav.children[di].click();},enter(){sizeStage();if(viewer.customModels.tower)overview.click();}};
}
