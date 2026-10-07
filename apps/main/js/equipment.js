import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Reference-image alignment, in the existing tower's model coordinates.
// These are display annotations, not surveyed equipment coordinates.
export function createEquipment(viewer) {
  const host = document.getElementById('stage-home');
  const layer = document.createElement('div'); layer.className='equipment-labels'; host.append(layer);
  const stairIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h6v-5h5v-5h5V4h3M3 4h7M3 4v7M3 4l8 8"/></svg>';
  const descentIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M5 2v20M5 9h7v7m-4-4 4-3 5 4m-5 3-3 6m3-6 5 5"/></svg>';
  const legend=document.createElement('aside');legend.className='equipment-legend';legend.hidden=true;
  legend.setAttribute('aria-label','逃生設備圖例');
  legend.innerHTML=`<span><i class="equipment-symbol stair-symbol">${stairIcon}</i>逃生梯</span><span><i class="equipment-symbol descent-symbol">${descentIcon}</i>緩降機</span><span><b class="direction-key">➜</b>逃生方向</span>`;
  host.closest('.page').append(legend);
  const locations = [
    {floor:5, point:[-4.8,35.4,.3]},
    {floor:6, point:[-16.1,39.55,-3.9]},
    {floor:7, point:[-5.8,43.7,-38.5]},
  ];
  const labels = locations.map(({floor,point})=>{
    const el=document.createElement('div');el.className='equipment-marker';
    el.innerHTML=`<span class="equipment-box equipment-symbol descent-symbol">${descentIcon}</span><small>${floor}F 緩降機位置</small>`;
    layer.append(el);return {el,p:new THREE.Vector3(...point),floor};
  });
  for(const z of [-23,-16]){
    const el=document.createElement('div');el.className='equipment-marker stair-location';
    el.innerHTML=`<span class="equipment-symbol stair-symbol">${stairIcon}</span><small>緊急出口</small>`;
    layer.append(el);labels.push({el,p:new THREE.Vector3(-12,41.7,z)});
  }
  const floorLabels=[];
  // Upper slab surfaces from component-slabs.gltf POSITION accessors.
  // The standard floors are spaced 3.4 model units, not the route-path spacing.
  const slabTopHeights=[34.9,38.3,41.7];
  [5,6,7].forEach((floor,i)=>{
    const el=document.createElement('div');el.className='equipment-floor';
    el.innerHTML=`<svg viewBox="0 0 30 20" aria-hidden="true"><path d="M2 2H28L15 18Z"/></svg><span>${floor}F</span>`;
    layer.append(el);floorLabels.push({el,y:slabTopHeights[i],floor});
  });
  // Cache a small convex outline from actual floor geometry, not empty box corners.
  function cacheFloorOutlines(tower){
    tower.updateWorldMatrix(true,true);
    const inverse=tower.matrixWorld.clone().invert(),point=new THREE.Vector3();
    const bins=floorLabels.map(()=>new Map());
    tower.traverse(o=>{
      const positions=o.geometry?.attributes?.position;if(!positions)return;
      const matrix=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld);
      for(let i=0;i<positions.count;i++){
        point.fromBufferAttribute(positions,i).applyMatrix4(matrix);
        floorLabels.forEach((floor,k)=>{
          // Include facade/balcony edges too; a thin floor-height slice can
          // miss them and place the elevation symbol inside the facade.
          bins[k].set(`${point.x.toFixed(3)},${point.z.toFixed(3)}`,[point.x,point.z]);
        });
      }
    });
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    floorLabels.forEach((floor,k)=>{
      const points=[...bins[k].values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
      const half=items=>{const out=[];for(const p of items){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
      floor.outline=points.length>2?[...half(points).slice(0,-1),...half([...points].reverse()).slice(0,-1)]:points;
    });
  }
  const projected=new THREE.Vector3();
  let root=null, stairs=null, directions=null, stairColor=null;
  new GLTFLoader().load('./models/information-line/component-stairs.gltf',({scene})=>{
    stairs=scene;stairs.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.color?.set('#19bb70');o.material.transparent=true;o.material.opacity=.95;}});
  });
  function attach(){
    const tower=viewer.customModels.tower;if(!tower)return;
    if(root!==tower){root=tower;cacheFloorOutlines(tower);if(stairs)root.add(stairs);}
    if(stairs&&stairs.parent!==root)root.add(stairs);
  }
  viewer.onEquipmentFrame=(spaceReserved=false)=>{
    const active=document.querySelector('[data-page="home"]')?.classList.contains('is-active');
    legend.hidden=!active||!viewer.routeTopView;
    layer.classList.toggle('is-plan',!!viewer.routeTopView);
    host.closest('.page').classList.toggle('is-route-plan',!!viewer.routeTopView);
    layer.hidden=!active;if(!active)return;attach();
    if(!root)return;
    const color='#19bb70';
    if(stairs&&stairColor!==color){
      stairs.traverse(o=>{if(o.material)o.material.color?.set(color);});
      stairColor=color;
    }
    root.updateWorldMatrix(true,false);viewer.camera.updateMatrixWorld();
    const rect=layer.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const pageRect=host.closest('.page').getBoundingClientRect();
    const visible={left:Math.max(0,rect.left,pageRect.left)+12,
      right:Math.min(innerWidth,rect.right,pageRect.right)-12,
      top:Math.max(0,rect.top,pageRect.top)+12,
      bottom:Math.min(innerHeight,rect.bottom,pageRect.bottom)-12};
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    let floorColumnX=Infinity;
    for(const floor of floorLabels){
      const {el,y,outline=[]}=floor;
      let edgeX=Infinity,edgeY=0;
      for(const [x,z] of outline){
        projected.set(x,y,z).applyMatrix4(root.matrixWorld).project(viewer.camera);
        if(projected.z>=-1&&projected.z<=1&&projected.x<edgeX){
          edgeX=projected.x;edgeY=(1-projected.y)*50;
        }
      }
      el.hidden=!Number.isFinite(edgeX);
      floorColumnX=Math.min(floorColumnX,edgeX);
      floor.screenY=rect.top+edgeY/100*rect.height;
    }
    // All three floors share the leftmost actual floor edge, keeping a vertical column.
    if(Number.isFinite(floorColumnX)&&!viewer.routeTopView){
      const sizes=floorLabels.map(({el})=>el.getBoundingClientRect());
      const width=Math.max(...sizes.map(r=>r.width)),height=Math.max(...sizes.map(r=>r.height));
      const desiredX=rect.left+(floorColumnX+1)*.5*rect.width-16;
      const requiredShift=Math.max(0,visible.left+width-desiredX);
      if(!spaceReserved&&requiredShift>0){
        // Shift the rendered model and every projected marker together, instead
        // of clamping only the label into the building. Viewer restores this
        // lens shift after rendering; no camera path or saved layout is changed.
        viewer.camera.projectionMatrix.elements[8]-=2*requiredShift/rect.width;
        viewer.camera.projectionMatrixInverse.copy(viewer.camera.projectionMatrix).invert();
        viewer.onEquipmentFrame(true);
        return;
      }
      const x=desiredX;
      // The projected slab level anchors the bottom rule, not the label center.
      const top=visible.top+height,bottom=visible.bottom;
      const gap=Math.min(height+8,Math.max(0,(bottom-top)/2));
      // Top to bottom: 7F, 6F, 5F. Keep clipped labels separated as well.
      const ordered=[...floorLabels].reverse();
      let previous=top-gap;
      ordered.forEach((floor,i)=>{
        const y=clamp(floor.screenY,Math.max(top,previous+gap),bottom-(2-i)*gap);
        floor.el.style.left=`${(x-rect.left)/rect.width*100}%`;
        floor.el.style.top=`${(y-rect.top)/rect.height*100}%`;
        previous=y;
      });
    }
    if(viewer.routeTopView){
      let modelLeft=Infinity,modelBottom=-Infinity;
      for(const [x,z] of floorLabels[0].outline??[])for(const y of [34.63,45.1]){
        projected.set(x,y,z).applyMatrix4(root.matrixWorld).project(viewer.camera);
        if(projected.z < -1 || projected.z > 1)continue;
        modelLeft=Math.min(modelLeft,(projected.x+1)*50);
        modelBottom=Math.max(modelBottom,(1-projected.y)*50);
      }
      for(const {el,floor} of floorLabels){
        el.hidden=floor!==(viewer.routeFloor??7);
        el.style.left=Number.isFinite(modelLeft)?`calc(${modelLeft}% - 16px)`:'0%';
        el.style.top=Number.isFinite(modelBottom)?`${modelBottom}%`:'98%';
      }
    }
    for(const {el,p,topOnly,floor} of labels){const v=root.localToWorld(p.clone()).project(viewer.camera);
      el.hidden=(topOnly&&!viewer.routeTopView)||(viewer.routeTopView&&floor&&floor!==(viewer.routeFloor??7))||v.z < -1 || v.z > 1;
      el.style.left=`${(v.x+1)*50}%`;el.style.top=`${(1-v.y)*50}%`;
    }
  };
  return {showDirections(){
    attach();if(!root)return;
    if(!directions){directions=new THREE.Group();
      // Short corridor arrows indicate equipment direction; no walking avatar or exit claim.
      for(const y of [35.4,39.553,43.706])for(const z of [-29,-7]){
        const from=new THREE.Vector3(-7.7,y,z),to=new THREE.Vector3(-7.7,y,z < -20 ? -21 : -16);
        const delta=to.clone().sub(from);directions.add(new THREE.ArrowHelper(delta.clone().normalize(),from,delta.length(),0x71e6cc,1.1,.55));
      }root.add(directions);
    }directions.visible=true;
  }};
}
