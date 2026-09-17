import * as THREE from 'three';

// User-marked plan coordinates (image bounds x:20..732, y:20..330).
// Display placement only, not surveyed equipment or a coverage calculation.
const marks=[[82,61],[133,56],[212,55],[391,58],[437,79],[618,61],
 [80,128],[167,111],[244,113],[305,94],[531,94],[138,175],
 [645,163],[79,221],[246,233],[643,212],[502,258],[686,270]];
export function createDetectionDiscs(slabs,walls){
  const sample=new THREE.Group();
  slabs.children.filter(o=>o.isMesh).forEach(o=>sample.add(new THREE.Mesh(o.geometry,o.material)));
  sample.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3().setFromObject(sample),size=bounds.getSize(new THREE.Vector3());
  const group=new THREE.Group(),radius=Math.max(size.x,size.z)*.009;
  const geometry=new THREE.CylinderGeometry(radius,radius,radius*.45,24);
  const heights=[];
  for(const mesh of sample.children){
    const p=mesh.geometry.attributes.position,idx=mesh.geometry.index;
    for(let i=0;i<(idx?idx.count:p.count);i+=3){
      const ys=[0,1,2].map(j=>p.getY(idx?idx.getX(i+j):i+j));
      if(Math.max(...ys)-Math.min(...ys)<.001)heights.push(ys[0]);
    }
  }
  heights.sort((a,b)=>a-b);
  const levels=[];for(const y of heights)if(!levels.length||y-levels.at(-1)>.5)levels.push(y);
  const spacing=levels.length>1?levels[1]-levels[0]:size.y/2;
  // Three displayed storeys; the cut-away top ceiling is inferred from storey spacing.
  const ceilings=[levels[1],levels[2],levels[3]??levels[2]+spacing];
  const positions=ceilings.map(ceiling=>marks.map(([px,py])=>{
    const u=(px-20)/712,v=(py-20)/310;
    return new THREE.Matrix4().makeTranslation(bounds.min.x+v*size.x,ceiling-radius*.3,bounds.min.z+u*size.z);
  }));
  const litCount=Math.floor(marks.length/3),timers=[];
  const material=new THREE.MeshBasicMaterial({color:0xff4545,transparent:true,opacity:.98,depthTest:false,depthWrite:false});
  const lights=new THREE.InstancedMesh(geometry,material,ceilings.length*litCount);
  lights.instanceMatrix.setUsage(THREE.DynamicDrawUsage);lights.renderOrder=96;lights.frustumCulled=false;group.add(lights);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orders=ceilings.map(()=>Array.from({length:marks.length},(_,i)=>i));
  function choose(floor){
      const order=orders[floor];
      for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      for(let i=0;i<litCount;i++)lights.setMatrixAt(floor*litCount+i,positions[floor][order[i]]);
      lights.instanceMatrix.needsUpdate=true;
  }
  ceilings.forEach((_,floor)=>{
    choose(floor);
    if(!reduced)timers[floor]=setTimeout(function tick(){choose(floor);timers[floor]=setTimeout(tick,500);},500+Math.random()*500);
  });
  return {group,dispose(){timers.forEach(clearTimeout);lights.dispose();geometry.dispose();material.dispose();group.removeFromParent();}};
}
