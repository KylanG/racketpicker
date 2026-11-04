(() => {
  const EASE = 'cubic-bezier(.22,1,.36,1)', DUR = 800, STEP = 70, MAX = 8;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SEL = '[data-reveal],[data-reveal-stagger]';
  const nested = el => el.parentElement && el.parentElement.closest(SEL);
  const play = (el, delay = 0) => el.animate(
    [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
    { duration: DUR, easing: EASE, delay, fill: 'backwards' });
  const kids = el => [...el.children].filter(c => c.getClientRects().length);
  const run = el => {
    el.__rv = 2;
    if (el.hasAttribute('data-reveal-stagger')) kids(el).forEach((c, i) => { c.style.opacity = ''; c.__rv = 1; play(c, Math.min(i, MAX) * STEP); });
    else { el.style.opacity = ''; play(el); }
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { io.unobserve(e.target); run(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  const inView = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const register = el => {
    if (el.__rv || nested(el)) return;
    el.__rv = 1;
    if (reduce) { el.__rv = 2; return; }
    if (inView(el)) { run(el); return; }
    if (el.hasAttribute('data-reveal-stagger')) kids(el).forEach(c => c.style.opacity = '0'); else el.style.opacity = '0';
    io.observe(el);
  };
  const scan = root => {
    if (root.nodeType !== 1) return;
    if (root.matches(SEL)) register(root);
    root.querySelectorAll(SEL).forEach(register);
    const p = root.parentElement;
    if (reduce || !p || !p.hasAttribute('data-reveal-stagger') || root.__rv) return;
    if (p.__rv === 1) root.style.opacity = '0';
    else if (p.__rv === 2 && root.getClientRects().length) { root.__rv = 1; play(root); }
  };
  const start = () => {
    scan(document.body);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(scan))).observe(document.body, { childList: true, subtree: true });
  };
  const spin = el => {
    if (reduce || el.__spin) return;
    const p = el.querySelector('svg[data-arrow] path'); if (!p) return;
    el.__spin = true;
    const a = p.animate([
      { transform: 'translate(0,0)', opacity: 1 },
      { transform: 'translate(12px,-12px)', opacity: 1, offset: .42 },
      { transform: 'translate(-12px,12px)', opacity: 1, offset: .43 },
      { transform: 'translate(0,0)', opacity: 1 }
    ], { duration: 650, easing: EASE });
    a.onfinish = a.oncancel = () => { el.__spin = false; };
  };
  const pulse = el => {
    if (reduce || el.__pulse) return; el.__pulse = true;
    const a = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1) rotate(-2deg)', offset: .4 }, { transform: 'scale(.97)', offset: .7 }, { transform: 'scale(1)' }], { duration: 700, easing: EASE });
    a.onfinish = a.oncancel = () => { el.__pulse = false; };
  };
  const FOC = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  let lastTrap = null, opener = null;
  const traps = () => [...document.querySelectorAll('[data-trap]')].filter(t => t.getClientRects().length);
  setInterval(() => { const t = traps().pop() || null; if (t && t !== lastTrap) { opener = document.activeElement; setTimeout(() => { if (!t.contains(document.activeElement)) { const f = t.querySelector('input:not([type=hidden])') || t.querySelector(FOC); f && f.focus(); } }, 80); } if (!t && lastTrap && opener && document.contains(opener)) opener.focus(); lastTrap = t; }, 150);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return; const t = traps().pop(); if (!t) return;
    const els = [...t.querySelectorAll(FOC)].filter(x => x.getClientRects().length); if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || !t.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !t.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('mouseover', e => {
    const lg = e.target.closest && e.target.closest('img[src$="logo.svg"]');
    if (lg && (!e.relatedTarget || !lg.contains(e.relatedTarget))) pulse(lg);
  });
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest('a,button');
    if (el && (!e.relatedTarget || !el.contains(e.relatedTarget))) spin(el);
  });
  document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('a,button'); if (el && el.matches(':focus-visible')) spin(el); });
  const RADIUS = 6;
  const tok = (t, size) => { t = t.trim(); let m;
    if ((m = t.match(/^calc\(100% - ([\d.]+)px\)$/))) return size - +m[1];
    if ((m = t.match(/^([\d.]+)%$/))) return size * +m[1] / 100;
    if ((m = t.match(/^([\d.]+)(px)?$/))) return +m[1];
    return null; };
  const rounded = el => {
    const src = el.__poly; const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    const pts = src.slice(8, -1).split(/,(?![^(]*\))/).map(p => { const [x, y] = p.trim().split(/\s+(?![^(]*\))/); return [tok(x, w), tok(y, h)]; });
    if (pts.some(p => p[0] == null || p[1] == null)) return;
    const n = pts.length, seg = [];
    for (let i = 0; i < n; i++) {
      const V = pts[i], P = pts[(i - 1 + n) % n], N = pts[(i + 1) % n];
      const u = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1, r = Math.min(RADIUS, l / 2); return [b[0] + dx / l * r, b[1] + dy / l * r]; };
      const A = u(P, V), B = u(N, V);
      seg.push((i ? 'L' : 'M') + A[0].toFixed(2) + ' ' + A[1].toFixed(2) + ' Q' + V[0].toFixed(2) + ' ' + V[1].toFixed(2) + ' ' + B[0].toFixed(2) + ' ' + B[1].toFixed(2));
    }
    el.style.clipPath = 'path("' + seg.join(' ') + ' Z")';
  };
  const ro = new ResizeObserver(es => es.forEach(e => rounded(e.target)));
  const roundScan = root => {
    if (!RADIUS || root.nodeType !== 1) return;
    const list = root.matches('[style*="clip-path:polygon"],[style*="clip-path: polygon"]') ? [root] : [];
    root.querySelectorAll('[style*="clip-path"]').forEach(x => list.push(x));
    list.forEach(el => { if (el.__poly || el.hasAttribute('data-no-round')) return; const cp = el.style.clipPath; if (!cp || !cp.startsWith('polygon(')) return; el.__poly = cp; rounded(el); ro.observe(el); });
  };
  new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(roundScan); if (m.type === 'attributes' && m.target.__poly && !String(m.target.style.clipPath).startsWith('path(')) { m.target.__poly = m.target.style.clipPath; if (m.target.__poly.startsWith('polygon(')) rounded(m.target); } })).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  const roundAll = () => roundScan(document.body);
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', roundAll) : roundAll();
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
})();
