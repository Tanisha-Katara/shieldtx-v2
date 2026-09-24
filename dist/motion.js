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
  let associationEnd = 0, apiStart = 0, apiEnd = 0, closingStart = 0;
  let source, milestones = [], routePoints = [], darkSections = [];
  let routeWidth = 0, routeHeight = 0, lastMark = null, measuredHeight = 0;

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
  function add(at, x, y, phase, size, pose = {}, dock = null, documentY = null) {
    at = clamp(at, launch, maxScroll);
    if (milestones.length && at <= milestones.at(-1).at) return;
    milestones.push({at, x: clamp(x, 25, width - 25),
      y: clamp(y, header + 42, height - 35), phase, size,
      bars:4,slant:0,angle:0,frame:0,weight:1,...pose,dock,documentY});
  }
  function markSlot(selector) {
    const r=rect($(selector)),scale=Math.min(r.width/68,r.height/75);
    return {x:r.left+(r.width-68*scale)/2+33.8825*scale,
      y:r.top+(r.height-75*scale)/2+37*scale,size:74*scale};
  }
  function measure() {
    width = innerWidth; height = innerHeight;
    header = $('.site-header').offsetHeight;
    const mobile = width < 681, size = mobile ? 32 : 38;
    const rail = width - (mobile ? 26 : 36), restingY = height * .53;
    track.classList.remove('is-sticky');
    canStick = enabled && width >= 900 && board.offsetHeight + header + 55 < height;
    track.style.setProperty('--flow-board-height', `${board.offsetHeight}px`);
    track.classList.toggle('is-sticky', canStick);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
    measuredHeight = $('main').offsetHeight;
    fitCanvas(overlay, width, height);
    const anchor = window.shieldScene?.getRoofAnchor({rest:true});
    if (!anchor) return;
    source = {x: anchor.x, y: anchor.y + scrollY, size:anchor.size,angle:anchor.angle};
    launch = Math.max(0, source.y - height * .58);
    const publicPosition = rect($('.association-row:not(.association-row--shielded) .association-row-position'));
    const bridge = rect($('.association-row-break'));
    const s={x:bridge.left+bridge.width/2,y:bridge.top+bridge.height/2};
    publicAt = publicPosition.top + publicPosition.height*.48 - restingY;
    shieldAt = s.y - restingY;
    associationEnd=shieldAt+Math.min(100,height*.1);
    milestones = [];
    add(launch,source.x,source.y-launch,'roof',source.size,{bars:1,angle:source.angle,weight:.18});
    const firstEdge=mix(launch,shieldAt,.38),split=firstEdge+Math.min(85,(shieldAt-firstEdge)*.2);
    add(firstEdge,rail,restingY,'first-edge',size,{bars:1});
    add(split,rail,restingY,'edge-split',size,{bars:2});
    add(shieldAt,s.x,restingY,'association-dock',22,{bars:2,slant:1,angle:mobile?Math.PI/2:0},'association',s.y);
    add(associationEnd,s.x,s.y-associationEnd,'association-hold',22,{bars:2,slant:1,angle:mobile?Math.PI/2:0},'association',s.y);

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
    const secondEdge=mix(associationEnd,flowStart,.4);
    add(secondEdge,rail,restingY,'second-edge',size,{bars:2,slant:1,angle:mobile?Math.PI/2:0});
    add(mix(secondEdge,flowStart,.3),rail,restingY,'third-line',size,{bars:3});
    add(mix(secondEdge,flowStart,.57),rail,restingY,'mark-assembled',size,{bars:4});
    nodes.forEach((n, i) => {
      const at = mix(flowStart, flowEnd, i / 3);
      const y = canStick ? header + 20 + n.y : boardTop + n.y - at;
      const flowPose={frame:smooth(i/3)};
      add(at, n.x, y, `flow-${i}`, size,flowPose);
      // Cross the gap between mobile rows, instead of diagonally cutting through their content.
      if (mobile && i === 1) {
        const nextAt = mix(flowStart, flowEnd, 2 / 3);
        const gapY = boardTop + (n.y + nodes[2].top) / 2;
        const a = mix(at, nextAt, .35), b = mix(at, nextAt, .65);
        add(a, n.x, gapY - a, 'flow-row-turn', size,{frame:smooth(mix(1/3,2/3,.35))});
        add(b, nodes[2].x, gapY - b, 'flow-row-turn', size,{frame:smooth(mix(1/3,2/3,.65))});
      }
    });

    const api=markSlot('.api-mark-slot');
    apiStart=api.y-restingY;
    apiEnd=apiStart+Math.min(height*.28,restingY-header-65);
    add(flowEnd + Math.min(180, (apiStart - flowEnd) * .32), rail, restingY, 'product-approach', size,{frame:1});
    add(apiStart,api.x,restingY,'api-dock',api.size,{},'api',api.y);
    add(apiEnd,api.x,api.y-apiEnd,'api-hold',api.size,{},'api',api.y);
    const faq = rect($('#faq'));
    const faqAt = faq.top + Math.min(180, faq.height * .25) - restingY;
    add(mix(apiEnd, faqAt, .45), rail, restingY, 'product-trust', size);
    add(faqAt, rail, restingY, 'questions', size);
    const closing=markSlot('.closing-mark-slot');
    closingStart=Math.min(maxScroll-1,closing.y-height*.66);
    add(mix(faqAt,closingStart,.45),rail,restingY,'closing-approach',size);
    add(closingStart,closing.x,closing.y-closingStart,'closing-dock',closing.size,{},'closing',closing.y);
    add(maxScroll,closing.x,closing.y-maxScroll,'closing-hold',closing.size,{},'closing',closing.y);
    darkSections = Array.from(document.querySelectorAll('.hero,.product-section,.closing,.site-footer')).map(rect);
  }

  function sample(scroll) {
    if (scroll <= launch) {
      const roof=window.shieldScene.getRoofAnchor();
      // Track the live roof while attached, including its small pointer movement.
      if(milestones[0])Object.assign(milestones[0],{x:roof.x,y:roof.y+scroll-launch,size:roof.size,angle:roof.angle});
      return {...roof,bars:1,slant:0,frame:0,weight:.18,phase:'roof',dock:'roof'};
    }
    for (let i = 1; i < milestones.length; i++) {
      const a = milestones[i - 1], b = milestones[i];
      if (scroll > b.at) continue;
      const t = smooth((scroll - a.at) / (b.at - a.at));
      const point={x:mix(a.x,b.x,t),
        y:mix(a.documentY===null?a.y:a.documentY-scroll,b.documentY===null?b.y:b.documentY-scroll,t),
        phase:t<.5?a.phase:b.phase,dock:a.dock===b.dock?a.dock:t===1?b.dock:null};
      for(const key of ['size','bars','slant','angle','frame','weight'])point[key]=mix(a[key],b[key],t);
      return point;
    }
    const last=milestones.at(-1);
    return {...last,y:last.documentY===null?last.y:last.documentY-scroll};
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
    if (!enabled || !source) {
      lastMark = null;paintRoute();
      exposure.style.setProperty('--association-mark-opacity','1');
      $('.access-api').style.setProperty('--api-mark-opacity','1');
      $('.closing').style.setProperty('--closing-mark-opacity','1');
      $('.closing').style.setProperty('--closing-arrival','1');
      return;
    }
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
    exposure.style.setProperty('--association-mark-opacity',smooth((scroll-associationEnd)/70));
    $('.access-api').style.setProperty('--api-mark-opacity',smooth((scroll-apiEnd)/90));
    $('.closing').style.setProperty('--closing-mark-opacity','0');
    $('.closing').style.setProperty('--closing-arrival',smooth((scroll-closingStart+140)/140));
    const light = darkSections.reduce((tone, r) => Math.max(tone,
      smooth((documentY - r.top) / 30) * smooth((r.bottom - documentY) / 30)), 0);
    const progress = clamp((scroll - launch) / Math.max(1, flowEnd - launch));
    // On arrival the canvas occupies the exact slot; the destination never shifts.
    if(point.dock==='roof'&&(point.y<header||point.y>height)) {
      lastMark={...point,progress,visible:false,alpha:0};return;
    }
    const brand = window.shieldBrand.draw(ink, {...point,progress,light,
      viewport:point.dock==='roof'?null:{width,height,top:header+12}});
    lastMark = {...point, ...brand, visible:true, alpha:1};
  }
  function requestPaint() { if (!raf && !document.hidden) raf = requestAnimationFrame(paint); }
  function setup() {
    enabled = !preference.matches && !document.documentElement.classList.contains('motion-off') && Boolean(ink && window.shieldBrand);
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
    getState: () => ({enabled, sticky: canStick, ...state, mark: lastMark, launch, maxScroll,
      holds:{association:[shieldAt,associationEnd],api:[apiStart,apiEnd],closing:[closingStart,maxScroll]},
      milestones: milestones.map(({at,phase}) => ({at,phase}))})
  };
  window.addEventListener('scroll', requestPaint, {passive: true});
  window.addEventListener('resize', scheduleMeasure);
  document.addEventListener('shield-motion-change', setup);
  document.addEventListener('shield-model-ready', setup);
  document.addEventListener('shield-roof-change', () => {if(scrollY<=launch)requestPaint();});
  preference.addEventListener('change', setup);
  document.addEventListener('visibilitychange', requestPaint);
  document.querySelectorAll('.qa details').forEach(detail => detail.addEventListener('toggle', scheduleMeasure));
  new ResizeObserver(() => { if ($('main').offsetHeight !== measuredHeight) scheduleMeasure(); }).observe($('main'));
  document.fonts?.ready.then(setup);
  window.addEventListener('load', setup, {once: true});
  requestAnimationFrame(setup);
})();
