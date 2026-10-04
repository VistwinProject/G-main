// Explicit rendering for control ACKs. Never wait for a background tab's rAF.
// This proves a submitted WebGL frame, not visibility on a physical screen.
export function renderControlFrame(viewer, activePage, page, visibility = 'unknown') {
  if (!activePage || activePage.dataset.page !== page) throw Error('page-not-active');
  if (page === 'welcome') {
    const rect = activePage.getBoundingClientRect();
    if (!rect.width || !rect.height) throw Error('page-not-laid-out');
    return { method: 'dom-layout', visibility, outputVisible: visibility === 'visible' };
  }
  const renderer = viewer.renderer;
  const canvas = renderer.domElement;
  if (!activePage.contains(canvas)) throw Error('canvas-not-mounted');
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) throw Error('canvas-zero-size');
  const context = renderer.getContext();
  if (context.isContextLost()) throw Error('webgl-context-lost');
  viewer.resize();
  const before = renderer.info.render.frame;
  renderer.render(viewer.scene, viewer.camera);
  const { frame, calls } = renderer.info.render;
  if (context.isContextLost()) throw Error('webgl-context-lost');
  if (!(frame > before) || !(calls > 0)) throw Error('webgl-frame-not-drawn');
  return { method: 'webgl-render', frame, calls, width: canvas.width, height: canvas.height,
    visibility, outputVisible: visibility === 'visible' };
}
