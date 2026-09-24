(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = $('.hero'), exposure = $('#exposure'), board = $('.flow-board');
  if (!hero || !exposure || !board) return;

  // One actor and one scroll clock for the entire document.
  const overlay = document.createElement('canvas');
  overlay.className = 'trade-journey-canvas';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.append(overlay);
  const ink = overlay.getContext('2d');
  const routes = document.createElement('canvas');
  routes.className = 'flow-route-canvas';
  routes.setAttribute('aria-hidden', 'true');
  $('.flow-nodes').append(routes);
  const routeInk = routes.getContext('2d');
  const track = document.createElement('div');
  track.className = 'motion-flow-track';
  board.before(track); track.append(board);
  const state = {hero: 0, shield: 0, flow: 0};
  let enabled = false, canStick = false, raf = 0, resizeTimer, previousStep = -1;
  let width = 0, height = 0, header = 0, maxScroll = 0, launch = 0;
  let flowStart = 0, flowEnd = 1, publicAt = 1, shieldAt = 2;
  let source, milestones = [], routePoints = [], darkSections = [];
  let routeWidth = 0, routeHeight = 0, lastCube = null, measuredHeight = 0;

  function rect(element) {
    const r = element.getBoundingClientRect();
    return {left: r.left, right: r.right, top: r.top + scrollY,
      bottom: r.bottom + scrollY, width: r.width, height: r.height};
  }
  function fitCanvas(canvas, w, h) {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function add(at, x, y, phase, size) {
    at = clamp(at, launch, maxScroll);
    if (milestones.length && at <= milestones.at(-1).at) return;
    milestones.push({at, x: clamp(x, 25, width - 25),
      y: clamp(y, header + 42, height - 35), phase, size});
  }
  function measure() {
    width = innerWidth; height = innerHeight;
    header = $('.site-header').offsetHeight;
    const mobile = width < 681, size = mobile ? 27 : 32;
    const rail = width - (mobile ? 26 : 36), restingY = height * .53;
    track.classList.remove('is-sticky');
    canStick = enabled && width >= 900 && board.offsetHeight + header + 55 < height;
    track.style.setProperty('--flow-board-height', `${board.offsetHeight}px`);
    track.classList.toggle('is-sticky', canStick);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
    measuredHeight = $('main').offsetHeight;
    fitCanvas(overlay, width, height);
    const anchor = window.shieldScene?.getTradeAnchor();
    if (!anchor) return;
    source = {x: anchor.x, y: anchor.y + scrollY, size: Math.max(size, anchor.size)};
    launch = Math.max(0, source.y - height * .66);
    const publicPosition = rect($('.association-row:not(.association-row--shielded) .association-row-position'));
    const shieldPosition = rect($('.association-row--shielded .association-row-position'));
    const position = r => ({x: r.right - 24, y: r.top + r.height * .48});
    const p = position(publicPosition), s = position(shieldPosition);
    publicAt = p.y - restingY;
    shieldAt = s.y - restingY;
    milestones = [];
    add(launch, source.x, source.y - launch, 'hero', source.size);
    add(mix(launch, publicAt, .42), rail, restingY, 'hero-departure', size);
    add(publicAt, p.x, restingY, 'public-position', size);
    add(shieldAt, s.x, restingY, 'shielded-position', size);

    const boardRect = board.getBoundingClientRect();
    const boardTop = rect(track).top;
    const nodes = Array.from(document.querySelectorAll('.flow-node')).map(node => {
      const r = node.getBoundingClientRect();
      return {x: r.left + r.width / 2, y: r.bottom - boardRect.top - 3, top: r.top - boardRect.top};
    });
    const parent = $('.flow-nodes').getBoundingClientRect();
    routeWidth = parent.width; routeHeight = parent.height + 24;
    fitCanvas(routes, routeWidth, routeHeight);
    routePoints = nodes.map(n => ({x: n.x - parent.left, y: n.y + boardRect.top - parent.top}));
    if (canStick) {
      flowStart = boardTop - header - 20;
      flowEnd = flowStart + height * .85;
    } else {
      flowStart = boardTop + nodes[0].y - height * .66;
      const available = nodes[3].y - nodes[0].y + height * .66 - header - 50;
      flowEnd = flowStart + Math.min(available, Math.max(320, nodes[3].y - nodes[0].y + height * .24));
    }
    flowStart = Math.max(shieldAt + 100, flowStart);
    flowEnd = Math.max(flowStart + 100, flowEnd);
    add(mix(shieldAt, flowStart, .45), rail, restingY, 'walkthrough-approach', size);
    nodes.forEach((n, i) => {
      const at = mix(flowStart, flowEnd, i / 3);
      const y = canStick ? header + 20 + n.y : boardTop + n.y - at;
      add(at, n.x, y, `flow-${i}`, size);
      // Cross the gap between mobile rows, instead of diagonally cutting through their content.
      if (mobile && i === 1) {
        const nextAt = mix(flowStart, flowEnd, 2 / 3);
        const gapY = boardTop + (n.y + nodes[2].top) / 2;
        const a = mix(at, nextAt, .35), b = mix(at, nextAt, .65);
        add(a, n.x, gapY - a, 'flow-row-turn', size);
        add(b, nodes[2].x, gapY - b, 'flow-row-turn', size);
      }
    });

    const api = rect($('.api-route-path li:nth-child(2)'));
    const market = rect($('.api-route-path li:last-child'));
    const apiY = api.top + api.height / 2;
    const apiAt = apiY - restingY;
    add(flowEnd + Math.min(180, (apiAt - flowEnd) * .32), rail, restingY, 'product-approach', size);
    add(apiAt, mobile ? (api.right + market.left) / 2 : api.right - 26, restingY, 'terminal-and-api', size);
    const faq = rect($('#faq'));
    const faqAt = faq.top + Math.min(180, faq.height * .25) - restingY;
    add(mix(apiAt, faqAt, .45), rail, restingY, 'product-trust', size);
    add(faqAt, rail, restingY, 'questions', size);
    const closing = rect($('.closing'));
    const closingAt = Math.min(maxScroll - 160, closing.top - height * .25);
    add(closingAt, rail, restingY, 'closing', size);
    const footer = rect($('.site-footer'));
    add(maxScroll, rail, footer.top + footer.height * .5 - maxScroll, 'footer', size);
    darkSections = Array.from(document.querySelectorAll('.hero,.product-section,.closing,.site-footer')).map(rect);
  }

  function sample(scroll) {
    if (scroll < launch) {
      const y = source.y - scroll, lowerEdge = height - 35;
      const entry = smooth((lowerEdge - y) / Math.min(100, height * .34 - 35));
      return {x: mix(width - (width < 681 ? 26 : 36), source.x, entry),
        y: clamp(y, header + 42, lowerEdge), size: source.size, phase: 'hero'};
    }
    for (let i = 1; i < milestones.length; i++) {
      const a = milestones[i - 1], b = milestones[i];
      if (scroll > b.at) continue;
      const t = smooth((scroll - a.at) / (b.at - a.at));
      return {x: mix(a.x, b.x, t), y: mix(a.y, b.y, t),
        size: mix(a.size, b.size, t), phase: t < .5 ? a.phase : b.phase};
    }
    return {...milestones.at(-1)};
  }
  function color(a, b, t) {
    const channels = [16, 8, 0].map(shift => Math.round(mix((a >> shift) & 255, (b >> shift) & 255, t)));
    return `rgb(${channels.join(',')})`;
  }
  function cube(ctx, x, y, size, light) {
    const s = size * .54;
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 1;
    const face = (points, dark, pale) => {
      ctx.beginPath(); points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.closePath(); ctx.fillStyle = color(dark, pale, light); ctx.fill();
      ctx.strokeStyle = color(0x004fef, 0xf2fff1, light); ctx.stroke();
    };
    face([[-s,-s*.44],[0,-s],[s,-s*.44],[0,s*.1]], 0xb3caff, 0xeff9e9);
    face([[-s,-s*.44],[0,s*.1],[0,s*1.15],[-s,s*.6]], 0x75a1f1, 0xc3dcca);
    face([[0,s*.1],[s,-s*.44],[s,s*.6],[0,s*1.15]], 0x2564dc, 0xdcefd7);
    ctx.restore();
  }
  function paintRoute() {
    if (!routeInk) return;
    routeInk.clearRect(0, 0, routeWidth, routeHeight);
    if (!enabled || width < 681 || routePoints.length !== 4) return;
    const p = routePoints, progress = state.flow * 3;
    routeInk.lineWidth = 1; routeInk.strokeStyle = '#c9d3ce';
    routeInk.beginPath(); routeInk.moveTo(p[0].x, p[0].y);
    p.slice(1).forEach(n => routeInk.lineTo(n.x, n.y)); routeInk.stroke();
    routeInk.strokeStyle = '#004fef'; routeInk.beginPath(); routeInk.moveTo(p[0].x, p[0].y);
    for (let i = 0; i < 3; i++) {
      const t = smooth(progress - i);
      if (!t) break;
      routeInk.lineTo(mix(p[i].x, p[i + 1].x, t), mix(p[i].y, p[i + 1].y, t));
    }
    routeInk.stroke();
  }
  function paint() {
    raf = 0;
    if (!ink || document.hidden) return;
    ink.clearRect(0, 0, width, height);
    if (!enabled || !source) { lastCube = null; paintRoute(); return; }
    const scroll = clamp(scrollY, 0, maxScroll);
    state.hero = clamp((scroll - launch) / Math.max(1, publicAt - launch));
    state.shield = clamp((scroll - publicAt) / Math.max(1, shieldAt - publicAt));
    state.flow = clamp((scroll - flowStart) / (flowEnd - flowStart));
    window.shieldScene?.setProgress(state.hero);
    hero.style.setProperty('--hero-journey', state.hero);
    exposure.style.setProperty('--public-link', clamp(state.hero * 1.7));
    exposure.style.setProperty('--association-break', state.shield);
    board.style.setProperty('--flow-progress', state.flow);
    const step = Math.min(3, Math.floor(state.flow * 4));
    if (step !== previousStep) {
      previousStep = step;
      document.dispatchEvent(new CustomEvent('shield-flow-step', {detail: {step, progress: state.flow}}));
    }
    paintRoute();
    const point = sample(scroll), documentY = point.y + scroll;
    const light = darkSections.reduce((tone, r) => Math.max(tone,
      smooth((documentY - r.top) / 30) * smooth((r.bottom - documentY) / 30)), 0);
    lastCube = {...point, visible: true, alpha: 1};
    // No opacity ramps or per-section replacement: this actor survives every handoff.
    cube(ink, point.x, point.y, point.size, light);
  }
  function requestPaint() { if (!raf && !document.hidden) raf = requestAnimationFrame(paint); }
  function setup() {
    enabled = !preference.matches && !document.documentElement.classList.contains('motion-off') && Boolean(ink);
    document.documentElement.classList.toggle('scroll-story-enabled', enabled);
    window.shieldScene?.setTradeOverlay(enabled);
    if (!enabled) {
      window.shieldScene?.setProgress(0);
      hero.style.setProperty('--hero-journey', '0');
      exposure.style.setProperty('--public-link', '1');
      exposure.style.setProperty('--association-break', '0');
    }
    measure(); previousStep = -1; requestPaint();
  }
  function scheduleMeasure() { clearTimeout(resizeTimer); resizeTimer = setTimeout(setup, 100); }
  window.shieldMotion = {
    navigateToStep(step) {
      if (!enabled) return false;
      const progress = clamp(Number(step) / 3) * .94 + .025;
      window.scrollTo({top: mix(flowStart, flowEnd, progress), behavior: 'smooth'});
      return true;
    },
    refresh: setup,
    getState: () => ({enabled, sticky: canStick, ...state, cube: lastCube, launch, maxScroll,
      milestones: milestones.map(({at,phase}) => ({at,phase}))})
  };
  window.addEventListener('scroll', requestPaint, {passive: true});
  window.addEventListener('resize', scheduleMeasure);
  document.addEventListener('shield-motion-change', setup);
  document.addEventListener('shield-model-ready', setup);
  preference.addEventListener('change', setup);
  document.addEventListener('visibilitychange', requestPaint);
  document.querySelectorAll('.qa details').forEach(detail => detail.addEventListener('toggle', scheduleMeasure));
  new ResizeObserver(() => { if ($('main').offsetHeight !== measuredHeight) scheduleMeasure(); }).observe($('main'));
  document.fonts?.ready.then(setup);
  window.addEventListener('load', setup, {once: true});
  requestAnimationFrame(setup);
})();
