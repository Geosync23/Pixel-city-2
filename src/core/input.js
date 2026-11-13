// Pointer + keyboard input for the game canvas. Tap, hold-to-steer, pinch/wheel zoom, WASD/arrows.
export function setupInput(cv, h) {
  // h: { tap(clientX, clientY), zoom(delta|absolute, isAbs), any() }
  const st = { keys: {}, hold: null, ptrs: new Map() }; let press = null, pinch = null;
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { } st.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); h.any && h.any();
    if (st.ptrs.size === 1) press = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, t: performance.now(), hold: false };
    else if (st.ptrs.size === 2) { press = null; st.hold = null; const [a, b] = [...st.ptrs.values()]; pinch = { d: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), z: h.getZoom() }; }
  });
  cv.addEventListener('pointermove', e => {
    if (!st.ptrs.has(e.pointerId)) return; st.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && st.ptrs.size >= 2) { const [a, b] = [...st.ptrs.values()]; h.zoom(Math.round(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), true); }
    else if (press && press.id === e.pointerId) { press.cx = e.clientX; press.cy = e.clientY; if (press.hold) st.hold = { x: press.cx, y: press.cy }; }
  });
  const up = e => {
    st.ptrs.delete(e.pointerId); if (pinch) { if (st.ptrs.size < 2) { pinch = null; press = null; } return; }
    if (press && press.id === e.pointerId) { if (!press.hold && performance.now() - press.t < 300 && Math.hypot(press.cx - press.x, press.cy - press.y) < 12) h.tap(e.clientX, e.clientY); press = null; st.hold = null; }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); h.zoom(e.deltaY < 0 ? 1 : -1, false); }, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
  addEventListener('keydown', e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase(); if (!st.keys[k] && h.key) h.key(k, e); st.keys[k] = 1; if (e.key.startsWith('Arrow') || k === ' ') e.preventDefault(); h.any && h.any(); });
  addEventListener('keyup', e => { st.keys[e.key.toLowerCase()] = 0; });
  addEventListener('blur', () => { st.keys = {}; });
  st.poll = () => { if (press && !press.hold && performance.now() - press.t >= 300) { press.hold = true; st.hold = { x: press.cx, y: press.cy }; } const k = st.keys; return { kx: (k.arrowright || k.d ? 1 : 0) - (k.arrowleft || k.a ? 1 : 0), ky: (k.arrowdown || k.s ? 1 : 0) - (k.arrowup || k.w ? 1 : 0), hold: st.hold }; };
  return st;
}
