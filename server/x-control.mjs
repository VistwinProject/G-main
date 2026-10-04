// G-only controller boundary. ACK means the display applied a page, never just WS delivery.
import { randomUUID } from 'node:crypto';

export function createXControl({ clients, send, snapshot }) {
  const pending = new Map();
  const completed = new Map();
  const scenes = new Set(['welcome', 'intro', 'golden30', 'aiRoute', 'prevention', 'outro']);
  const displays = () => [...clients].filter(c => c.role === 'display' && c.displayStatus?.ready && Date.now() - c.displayStatus.ts < 10000);
  function status() {
    const live = displays();
    return { type: 'x-status', protocol: 'g-control/1', ready: live.length === 1,
      displays: live.length, pads: [...clients].filter(c => c.role === 'pad').length,
      display: live[0]?.displayStatus ?? null, state: snapshot() };
  }
  function publish() { for (const c of clients) if (c.role === 'x-controller') send(c, status()); }
  setInterval(publish, 2000).unref(); // Expire stale readiness even if a display stops reporting.
  function finish(id, ack) {
    const p = pending.get(id); if (!p) return;
    clearTimeout(p.timer); pending.delete(id);
    const result = { type: 'x-ack', requestId: id, ...ack, ts: Date.now() };
    completed.set(id, result);
    if (completed.size > 128) completed.delete(completed.keys().next().value);
    for (const c of p.waiters) if (clients.has(c)) send(c, result);
  }
  function handle(c, msg) {
    if (msg.type === 'x-display-status') {
      if (c.role === 'display') { c.displayStatus = { ...msg, ts: Date.now() }; publish(); }
      return true;
    }
    if (msg.type === 'x-ack') {
      const p = pending.get(msg.requestId);
      if (p?.display === c) finish(msg.requestId, { ok: msg.ok === true, status: msg.ok ? 'applied' : 'failed',
        scene: msg.scene, page: msg.page, rendered: msg.rendered, muted: msg.muted, error: msg.error });
      return true;
    }
    if (c.role !== 'x-controller') return msg.type?.startsWith('x-') ?? false;
    if (msg.type === 'hello' || msg.type === 'x-status') { send(c, snapshot()); send(c, status()); return true; }
    const id = typeof msg.requestId === 'string' && msg.requestId.length <= 128 ? msg.requestId : randomUUID();
    if (completed.has(id)) { send(c, completed.get(id)); return true; }
    if (pending.has(id)) { pending.get(id).waiters.add(c); return true; }
    const reject = error => send(c, { type: 'x-ack', requestId: id, ok: false, status: 'rejected', error, ts: Date.now() });
    if (!scenes.has(msg.scene) || (msg.cmd && msg.cmd !== 'page-select')) { reject('unsupported-command'); return true; }
    const live = displays();
    if (live.length !== 1) { reject(live.length ? 'multiple-displays' : 'display-not-ready'); return true; }
    if (pending.size) { reject('display-busy'); return true; }
    const p = { display: live[0], waiters: new Set([c]), timer: setTimeout(() => finish(id, { ok: false, status: 'timeout', error: 'display-ack-timeout' }), 5000) };
    pending.set(id, p);
    send(p.display, { type: 'x-command', _sourceRole: 'x-controller', controlId: id, scene: msg.scene, cmd: 'page-select', cmdId: id });
    return true;
  }
  function disconnected(c) {
    for (const [id, p] of pending) if (p.display === c) finish(id, { ok: false, status: 'failed', error: 'display-disconnected' });
    publish();
  }
  return { handle, status, disconnected };
}
