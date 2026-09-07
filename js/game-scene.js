import * as THREE from 'three';

// 兩關在第三條 A 動線與第四條 B 動線之間切換，共用走廊連接封鎖分支。
// 所有標記與煙霧放在動線的同一個座標系，避免鏡頭移動後漂移。
export class GameScene {
  constructor(viewer) {
    this.viewer = viewer;
    this.phase = null;
    this.routeIndex = 3;
    this.safeExit = 'B';
    this.blockedExit = 'A';
    viewer.onGameFrame = (time) => this.update(time);
  }
  ensure() {
    if (this.root) return true;
    const set = this.viewer._routeSets?.tower;
    if (!set?.entries[3] || !set.entries[2]) return false;
    this.set = set;
    this.b = set.entries[this.routeIndex].pts.map(p => p.clone());
    const other = set.entries[this.safeExit === 'B' ? 2 : 3].pts;
    // 同一上層走廊的分岔，危險預覽只畫到另一座樓梯入口。
    this.a = this.safeExit === 'B'
      ? [this.b[6], ...other.slice(1,7)].map(p=>p.clone())
      : [this.b[1], ...other.slice(6,9)].map(p=>p.clone());
    this.start = this.b[0];
    this.block = this.a.at(-1).clone();
    this.exit = this.b.at(-1);
    this.root = new THREE.Group();
    set.root.add(this.root);
    this.root.visible = false;
    this.player = this.label('你在這裡', '#66dcff', this.start, 3);
    this.playerDot = new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshBasicMaterial({color:'#66dcff',depthTest:false}));
    this.playerDot.position.copy(this.start);this.playerDot.renderOrder=20;this.root.add(this.playerDot);
    this.aLabel = this.label(`${this.blockedExit} 方向 × 封鎖`, '#ff7569', this.block, 4);
    this.bLabel = this.label(`${this.safeExit} 出口`, '#65efb0', this.exit, 2);
    this.aPath = this.path(this.a, '#ff6659');
    this.bPath = this.path(this.b, '#41e5a0');
    this.fire = new THREE.Group();
    this.fire.position.copy(this.block);
    this.root.add(this.fire);
    this.smoke = this.viewer._makeSmoke({count:12,rise:6,spread:1.3,opacity:.85});
    for (const p of this.smoke.parts) this.fire.add(p.sprite);
    const barrier = new THREE.Group();
    for (const angle of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.22, 2.6, .22), new THREE.MeshBasicMaterial({color:'#ff6659',depthTest:false}));
      bar.rotation.z = angle; barrier.add(bar);
    }
    barrier.position.copy(this.block).add(new THREE.Vector3(0,1.4,0));
    this.root.add(barrier);
    return true;
  }
  label(text, color, point, lift) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#071827'; ctx.fillRect(0,0,512,128);
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(3,3,506,122);
    ctx.font = 'bold 44px "Noto Sans TC", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(text,256,64);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false,depthWrite:false}));
    sprite.position.copy(point).add(new THREE.Vector3(0,lift,0)); sprite.scale.set(7,1.75,1); sprite.renderOrder = 30;
    this.root.add(sprite); return sprite;
  }
  path(points, color) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthTest:false});
    for (let i=1;i<points.length;i++) {
      const a=points[i-1], b=points[i], direction=b.clone().sub(a);
      if (direction.length()<.01) continue;
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,direction.length(),6),material);
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()); mesh.renderOrder=10;group.add(mesh);
    }
    this.root.add(group);return group;
  }
  world(point) { this.set.root.updateWorldMatrix(true,false); return this.set.root.localToWorld(point.clone()); }
  focus(point, offset, duration=1.1) {
    const v=this.viewer, target=this.world(point);
    v._override=true;v._hold=true;
    v._flyTo({target:target.toArray(),pos:target.clone().add(new THREE.Vector3(...offset)).toArray()},duration);
  }
  stage(phase) {
    this.phase=phase;
    if (!this.ensure()) return;
    this.root.visible=true;
    this.fire.visible=phase!=='cleared';
    this.viewer.hideIdleFire('tower');
    this.viewer.controls.enabled=false;
    this.player.visible=!['playing','cleared','blocked'].includes(phase);
    this.playerDot.visible=this.player.visible;
    this.aPath.visible=['route','blocked','preview-danger'].includes(phase);
    this.bPath.visible=['route','playing','cleared','preview-safe'].includes(phase);
    this.aLabel.visible=!['playing','cleared','preview-safe'].includes(phase);this.bLabel.visible=!['blocked','preview-danger'].includes(phase);
    if(phase==='preview-danger') this.focus(this.block,[18,22,23],.65);
    else if(phase==='preview-safe') this.focus(this.b[6],[22,31,25],.65);
    else if(phase==='blocked') this.focus(this.block,[12,13,14]);
    else if(phase==='cleared') this.focus(this.exit,[24,24,26],1.8);
    else if(phase==='observe') this.focus(this.start,[18,22,20]);
    else if(phase==='route') this.focus(this.b[6],[22,31,25]);
    else if(phase==='intro') this.focus(this.b[4],[27,35,31]);
  }
  play(done) {
    if(!this.ensure()) return;
    this.stage('playing');
    const v=this.viewer;
    v.playRoute('tower',{index:this.routeIndex,avoidCurrent:false,duration:12,whole:true,onDone:()=>{
      this.stage('cleared'); done();
    }});
    this.set.startDots[this.routeIndex].group.visible=false;
    // 由玩家沿路的位置驅動跟隨鏡頭，停用展示模式的分鏡。
    v._fly=null;v._hold=true;v._override=true;
  }
  update(time) {
    if(!this.phase) return;
    if(!this.root) { if(this.ensure()) this.stage(this.phase);else return; }
    this.viewer.hideIdleFire('tower');
    this.viewer._updateSmoke(this.smoke,time);
    if(this.phase==='playing') {
      const target=this.world(this.set.entries[this.routeIndex].tip);
      const pos=target.clone().add(new THREE.Vector3(16,19,20));
      this.viewer.camera.position.lerp(pos,.045);
      this.viewer.controls.target.lerp(target,.045);
      this.viewer.camera.lookAt(this.viewer.controls.target);
    }
  }
  stop() {
    this.phase=null;
    if(this.root) this.root.visible=false;
    this.viewer.stopRoute('tower');
    if(this.set) this.set.startDots[this.routeIndex].group.visible=true;
    this.viewer.controls.enabled=true;
    this.viewer.releaseShot(.7);
  }
  configure(level) {
    this.stop();
    if (this.root) {
      this.root.removeFromParent();
      const geometries=new Set(), materials=new Set();
      this.root.traverse(object=>{
        if(object.geometry) geometries.add(object.geometry);
        for(const material of (Array.isArray(object.material)?object.material:[object.material])) {
          if(!material) continue; materials.add(material);
        }
      });
      geometries.forEach(item=>item.dispose()); materials.forEach(item=>item.dispose());
      // Smoke textures are shared by the viewer; only labels own their textures.
      for(const sprite of [this.player,this.aLabel,this.bLabel]) sprite.material.map.dispose();
      this.root=null;
    }
    this.routeIndex=level.route;this.safeExit=level.safe;this.blockedExit=level.blocked;
  }
}
