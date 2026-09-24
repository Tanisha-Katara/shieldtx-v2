(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const hero = $('.hero'), exposure = $('#exposure'), board = $('.flow-board');
  if (!hero || !exposure || !board) return;

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
  board.before(track);
  track.append(board);
  const state = {hero: 0, shield: 0, flow: 0};
  let enabled = false, context, flowTrigger, raf = 0, resizeTimer, previousStep = -1;
  let sourcePoint, publicPoint, shieldPoint, viewportWidth, viewportHeight, routePoints = [];
  let routeWidth = 0, routeHeight = 0, canStick = false;

  function documentPoint(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {x: Math.min(innerWidth - 31, rect.right - 24), y: rect.top + scrollY + rect.height * .48};
  }
  function fitCanvas(canvas, width, height) {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function measure() {
    viewportWidth = innerWidth; viewportHeight = innerHeight;
    fitCanvas(overlay, viewportWidth, viewportHeight);
    const anchor = window.shieldScene?.getTradeAnchor();
    if (anchor) sourcePoint = {x: anchor.x, y: anchor.y + scrollY, size: anchor.size};
    publicPoint = documentPoint($('.association-row:not(.association-row--shielded) .association-row-position')) ||
      documentPoint($('.trade-card'));
    shieldPoint = documentPoint($('.association-row--shielded .association-row-position')) || publicPoint;
    const parent = $('.flow-nodes').getBoundingClientRect();
    routeWidth = parent.width; routeHeight = parent.height + 16;
    fitCanvas(routes, routeWidth, routeHeight);
    routePoints = Array.from(document.querySelectorAll('.flow-node')).map(node => {
      const rect = node.getBoundingClientRect();
      return {x: rect.left + rect.width / 2 - parent.left, y: rect.bottom - parent.top - 3};
    });
    requestPaint();
  }

  function cube(ctx, x, y, size, alpha, dark = false) {
    const s = size * .54;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha; ctx.lineWidth = .9;
    const face = (points, color) => {
      ctx.beginPath(); points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = dark ? '#004fef' : '#f2fff1'; ctx.stroke();
    };
    face([[-s,-s*.44],[0,-s],[s,-s*.44],[0,s*.1]], dark ? '#b3caff' : '#eff9e9');
    face([[-s,-s*.44],[0,s*.1],[0,s*1.15],[-s,s*.6]], dark ? '#75a1f1' : '#c3dcca');
    face([[0,s*.1],[s,-s*.44],[s,s*.6],[0,s*1.15]], dark ? '#2564dc' : '#dcefd7');
    ctx.restore();
  }

  function paintRoutes() {
    if (!routeInk) return;
    routeInk.clearRect(0, 0, routeWidth, routeHeight);
    if (!enabled || innerWidth < 681 || routePoints.length < 4) return;
    const points = routePoints;
    const progress = state.flow * 3;
    routeInk.strokeStyle = '#c9d3ce'; routeInk.lineWidth = 1;
    routeInk.beginPath(); routeInk.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => routeInk.lineTo(point.x, point.y)); routeInk.stroke();
    routeInk.strokeStyle = '#004fef'; routeInk.beginPath(); routeInk.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < 3; i++) {
      const portion = clamp(progress - i);
      if (portion <= 0) break;
      routeInk.lineTo(mix(points[i].x, points[i + 1].x, portion), mix(points[i].y, points[i + 1].y, portion));
    }
    routeInk.stroke();
    const segment = Math.min(2, Math.floor(progress)), fraction = Math.min(1, progress - segment);
    cube(routeInk, mix(points[segment].x, points[segment + 1].x, fraction),
      mix(points[segment].y, points[segment + 1].y, fraction), 11, 1, true);
  }

  function paint() {
    raf = 0;
    if (!ink || document.hidden) return;
    ink.clearRect(0, 0, viewportWidth, viewportHeight);
    paintRoutes();
    if (!enabled || !sourcePoint || !publicPoint || state.hero <= .012) return;
    const travel = smooth((state.hero - .015) / .985);
    const rail = viewportWidth - (innerWidth < 681 ? 23 : 31);
    const x = travel < .22 ? mix(sourcePoint.x, rail, smooth(travel / .22)) :
      travel > .78 ? mix(rail, publicPoint.x, smooth((travel - .78) / .22)) : rail;
    const y = mix(sourcePoint.y, publicPoint.y, travel);
    const lower = smooth(state.shield);
    const position = {x: mix(x, shieldPoint.x, lower), y: mix(y, shieldPoint.y, lower) - scrollY};
    const fade = clamp(state.hero / .12) * clamp((position.y - 78) / 45) * clamp((viewportHeight + 35 - position.y) / 55);
    if (!fade) return;
    const size = mix(sourcePoint.size || 25, innerWidth < 681 ? 18 : 22, travel);
    // The public trade remains visible. Only its incoming association breaks.
    const observation = smooth((state.hero - .72) / .28) * (1 - lower);
    ink.save(); ink.globalAlpha = fade * observation * .34; ink.strokeStyle = '#004fef'; ink.lineWidth = 1;
    for (const [dx, dy] of [[-42,-27],[8,-43],[-42,27],[8,43]]) {
      ink.beginPath(); ink.moveTo(position.x + dx, position.y + dy);
      ink.lineTo(position.x + dx * .48, position.y + dy * .48); ink.stroke();
    }
    ink.restore();
    cube(ink, position.x, position.y, size, fade, travel > .62);
  }
  function requestPaint() { if (!raf && !document.hidden) raf = requestAnimationFrame(paint); }

  function updateHero() {
    window.shieldScene?.setProgress(state.hero);
    hero.style.setProperty('--hero-journey', state.hero);
    exposure.style.setProperty('--public-link', clamp((state.hero - .40) / .6));
    requestPaint();
  }
  function updateShield() {
    exposure.style.setProperty('--association-break', state.shield);
    requestPaint();
  }
  function updateFlow() {
    const step = Math.min(3, Math.floor(state.flow * 4));
    board.style.setProperty('--flow-progress', state.flow);
    if (step !== previousStep) {
      previousStep = step;
      document.dispatchEvent(new CustomEvent('shield-flow-step', {detail: {step, progress: state.flow}}));
    }
    requestPaint();
  }

  function setup() {
    context?.revert(); context = null; flowTrigger = null;
    enabled = !preference.matches && !document.documentElement.classList.contains('motion-off') &&
      Boolean(window.gsap && window.ScrollTrigger);
    document.documentElement.classList.toggle('scroll-story-enabled', enabled);
    track.classList.remove('is-sticky');
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')) || 86;
    canStick = enabled && innerWidth >= 900 && board.offsetHeight + header + 55 < innerHeight;
    track.style.setProperty('--flow-board-height', `${board.offsetHeight}px`);
    track.classList.toggle('is-sticky', canStick);
    previousStep = -1;
    window.shieldScene?.setProgress(0);
    state.hero = state.shield = state.flow = 0;
    hero.style.setProperty('--hero-journey', '0');
    exposure.style.setProperty('--public-link', '1');
    exposure.style.setProperty('--association-break', '0');
    measure();
    if (!enabled) { window.shieldScene?.refresh(); requestPaint(); return; }
    gsap.registerPlugin(ScrollTrigger);
    context = gsap.context(() => {
      gsap.to(state, {hero: 1, ease: 'none', onUpdate: updateHero, scrollTrigger: {
        trigger: hero, start: () => Math.max(25, $('.hero-art').getBoundingClientRect().top + scrollY - 110),
        end: () => Math.max(200, (publicPoint?.y || exposure.offsetTop + 350) - innerHeight * .52),
        scrub: .45, invalidateOnRefresh: true
      }});
      if ($('.association-row--shielded')) gsap.to(state, {shield: 1, ease: 'none', onUpdate: updateShield,
        scrollTrigger: {trigger: '.association-row--shielded', start: 'top 73%', end: 'center 47%', scrub: .4}});
      const timeline = gsap.to(state, {flow: 1, ease: 'none', onUpdate: updateFlow, scrollTrigger: {
        trigger: canStick ? track : board,
        start: canStick ? `top top+=${header + 20}` : 'top 65%',
        end: canStick ? `bottom bottom-=${Math.max(25, innerHeight - board.offsetHeight - header - 20)}` : 'bottom 48%',
        scrub: .35, invalidateOnRefresh: true
      }});
      flowTrigger = timeline.scrollTrigger;
      if (innerWidth >= 681) gsap.fromTo('.flow-return', {opacity: .42}, {opacity: 1, scrollTrigger: {
        trigger: track, start: 'top 35%', end: 'bottom 85%', scrub: true
      }});
    });
    ScrollTrigger.refresh();
    measure();
    updateFlow();
  }

  window.shieldMotion = {
    navigateToStep(step) {
      if (!enabled || !flowTrigger) return false;
      const target = clamp(Number(step) / 3) * .91 + .035;
      window.scrollTo({top: mix(flowTrigger.start, flowTrigger.end, target), behavior: 'smooth'});
      return true;
    },
    refresh: setup,
    getState: () => ({enabled, sticky: canStick, hero: state.hero, shield: state.shield, flow: state.flow})
  };
  window.addEventListener('scroll', requestPaint, {passive: true});
  window.addEventListener('resize', () => {clearTimeout(resizeTimer); resizeTimer = setTimeout(setup, 180);});
  document.addEventListener('shield-motion-change', setup);
  preference.addEventListener('change', setup);
  document.addEventListener('visibilitychange', requestPaint);
  document.fonts?.ready.then(setup);
  window.addEventListener('load', setup, {once: true});
  requestAnimationFrame(setup);
})();
