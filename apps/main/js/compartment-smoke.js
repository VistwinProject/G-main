import * as THREE from 'three';
import { enclosedRegion } from './smoke-region.js';

// The user's three camera stops select rooms; actual wall geometry bounds them.
// This is a clipped educational effect, not a physical smoke simulation.
const seeds=[[.16,.52],[.52,.28],[.89,.65]];

export function createCompartmentSmoke(){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  mesh.name='compartment-smoke';mesh.renderOrder=92;mesh.visible=false;
  let active=-1,last=-Infinity,start=0;
  let regions=[];
  function draw(now){
    if(active<0||now-last<50)return;last=now;
    const region=regions[active];if(!region)return;
    const {minX,maxX,minY,maxY}=region;
    ctx.clearRect(0,0,1024,512);ctx.save();
    const t=matchMedia('(prefers-reduced-motion: reduce)').matches?0:(now-start)/1000;
    ctx.fillStyle='rgba(210,35,35,.2)';ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
    for(let i=0;i<22;i++){
      const x=minX+(maxX-minX)*((i*.618+t*.025)%1),y=minY+(maxY-minY)*(.5+.5*Math.sin(i*2.4+t*.65));
      const radius=22+12*Math.sin(i+t*.45),gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
      gradient.addColorStop(0,'rgba(255,55,55,.44)');gradient.addColorStop(1,'rgba(255,100,100,0)');
      ctx.fillStyle=gradient;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
    }
    ctx.globalCompositeOperation='destination-in';ctx.drawImage(region.mask,0,0);
    ctx.restore();texture.needsUpdate=true;
  }
  mesh.onBeforeRender=()=>draw(performance.now());
  return {mesh,
    fit(bounds,right,height,walls){
      const r=new THREE.Vector3(...right);r.y=0;r.normalize();const u=new THREE.Vector3(...bounds.up);
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r,u,new THREE.Vector3().crossVectors(r,u)));
      mesh.position.fromArray(bounds.origin).addScaledVector(r,(bounds.minX+bounds.maxX)/2).addScaledVector(u,(bounds.minY+bounds.maxY)/2);mesh.position.y=height+.03;
      mesh.scale.set(bounds.maxX-bounds.minX,bounds.maxY-bounds.minY,1);
      const barrier=document.createElement('canvas');barrier.width=1024;barrier.height=512;
      const b=barrier.getContext('2d');b.strokeStyle='#fff';b.lineWidth=3;b.lineCap='square';
      const origin=new THREE.Vector3(...bounds.origin),point=new THREE.Vector3();
      for(const group of walls){
        if(!group)continue;group.updateWorldMatrix(true,true);
        group.traverse(object=>{
          const geometry=object.userData.framingGeometry;if(!geometry)return;
          const p=geometry.attributes.position,index=geometry.index,count=index?index.count:p.count;
          b.beginPath();
          for(let i=0;i<count;i++){
            point.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(object.matrixWorld).sub(origin);
            const x=(point.dot(r)-bounds.minX)/(bounds.maxX-bounds.minX)*1024;
            const y=(bounds.maxY-point.dot(u))/(bounds.maxY-bounds.minY)*512;
            if(i%2===0)b.moveTo(x,y);else b.lineTo(x,y);
          }b.stroke();
        });
      }
      const pixels=b.getImageData(0,0,1024,512).data,blocked=new Uint8Array(1024*512);
      for(let i=0;i<blocked.length;i++)blocked[i]=pixels[i*4+3]>16?1:0;
      regions=seeds.map(([x,y])=>{
        const area=enclosedRegion(blocked,1024,512,[x*1024,y*512]);if(!area)return null;
        const mask=document.createElement('canvas');mask.width=1024;mask.height=512;
        const m=mask.getContext('2d'),data=m.createImageData(1024,512);
        let minX=1024,minY=512,maxX=0,maxY=0;
        area.forEach((inside,i)=>{if(!inside)return;data.data[i*4+3]=255;const px=i%1024,py=Math.floor(i/1024);minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);});
        m.putImageData(data,0,0);return {mask,minX,maxX,minY,maxY};
      });
    },
    show(index){active=index%3;start=performance.now();last=-Infinity;draw(start);mesh.visible=!!regions[active];},
    hide(){active=-1;mesh.visible=false;},
  };
}
