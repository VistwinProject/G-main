import test from 'node:test';
import assert from 'node:assert/strict';
import { renderControlFrame } from '../apps/main/js/control-render.js';

function fixture() {
  const canvas = { width: 1280, height: 720, getBoundingClientRect: () => ({ width: 1280, height: 720 }) };
  const context = { isContextLost: () => false };
  const viewer = { scene: {}, camera: {}, resize() {}, renderer: {
    domElement: canvas, getContext: () => context, info: { render: { frame: 7, calls: 99 } },
    render(scene, camera) {
      assert.equal(scene, viewer.scene); assert.equal(camera, viewer.camera);
      this.info.render.frame++; this.info.render.calls = 24;
    }
  }};
  const active = { dataset: { page: 'first' }, contains: el => el === canvas, getBoundingClientRect: canvas.getBoundingClientRect };
  return { viewer, active, context, canvas };
}

test('background rAF pause cannot block control render; background visibility is reported honestly', async () => {
  const frames = [];
  const pausedRaf = callback => frames.push(callback);
  let oldAckReady = false;
  const oldWait = new Promise(resolve => pausedRaf(() => pausedRaf(resolve))).then(() => { oldAckReady = true; });
  const { viewer, active } = fixture();
  const proof = renderControlFrame(viewer, active, 'first', 'hidden');
  assert.equal(oldAckReady, false, 'old double-rAF confirmation still blocked');
  assert.equal(proof.frame, 8); assert.equal(proof.calls, 24);
  assert.equal(proof.method, 'webgl-render'); assert.equal(proof.outputVisible, false);
  frames.shift()(); frames.shift()(); await oldWait;
});
test('foreground proof records the real draw and canvas size', () => {
  const { viewer, active } = fixture();
  const proof = renderControlFrame(viewer, active, 'first', 'visible');
  assert.equal(proof.outputVisible, true); assert.equal(proof.width, 1280); assert.equal(proof.height, 720);
});
test('lost WebGL context fails before rendering', () => {
  const { viewer, active, context } = fixture();
  context.isContextLost = () => true;
  assert.throws(() => renderControlFrame(viewer, active, 'first'), /webgl-context-lost/);
  assert.equal(viewer.renderer.info.render.frame, 7);
});
test('stale frame counts, no draw calls and render exceptions cannot become success', () => {
  const { viewer, active } = fixture();
  viewer.renderer.render = () => {};
  assert.throws(() => renderControlFrame(viewer, active, 'first'), /webgl-frame-not-drawn/);
  viewer.renderer.render = () => { viewer.renderer.info.render.frame++; viewer.renderer.info.render.calls = 0; };
  assert.throws(() => renderControlFrame(viewer, active, 'first'), /webgl-frame-not-drawn/);
  viewer.renderer.render = () => { throw Error('render failed'); };
  assert.throws(() => renderControlFrame(viewer, active, 'first'), /render failed/);
});
test('wrong page, detached canvas and zero layout are rejected', () => {
  const { viewer, active, canvas } = fixture();
  assert.throws(() => renderControlFrame(viewer, active, 'outro'), /page-not-active/);
  active.contains = () => false;
  assert.throws(() => renderControlFrame(viewer, active, 'first'), /canvas-not-mounted/);
  active.contains = () => true; canvas.getBoundingClientRect = () => ({ width: 0, height: 0 });
  assert.throws(() => renderControlFrame(viewer, active, 'first'), /canvas-zero-size/);
});
test('welcome reports DOM layout evidence without claiming a WebGL frame', () => {
  const { viewer, active } = fixture(); active.dataset.page = 'welcome';
  const proof = renderControlFrame(viewer, active, 'welcome', 'hidden');
  assert.equal(proof.method, 'dom-layout'); assert.equal(proof.frame, undefined);
  assert.equal(viewer.renderer.info.render.frame, 7);
});
