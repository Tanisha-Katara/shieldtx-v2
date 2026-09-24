(() => {
  'use strict';
  const segmentData = ["M76.5581 13.207C78.7672 13.207 80.558 14.998 80.5581 17.207V23.7725H13.2065V17.207C13.2067 14.998 14.9975 13.207 17.2065 13.207H76.5581Z", "M80.5581 44.9023H13.2065V34.3369H80.5581V44.9023Z", "M80.5581 66.0322H13.2065V55.4678H80.5581V66.0322Z", "M48.5854 87.0215C47.5068 87.5291 46.2579 87.5291 45.1792 87.0215L23.0278 76.5977H70.7368L48.5854 87.0215Z"];
  const segments = segmentData.map(d => new Path2D(d));
  const outline = new Path2D('M6 4H87.765V44C87.765 68 69 88 46.8825 101C24.765 88 6 68 6 44Z');
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const ramp = (p, a, b) => ease((p - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;
  function draw(ctx, {x, y, size, progress = 1, light = 1, viewport}) {
    const p = clamp(progress), scale = size / 74;
    const arrivals = [1, ramp(p,.12,.26), ramp(p,.28,.42), ramp(p,.44,.55)];
    const surround = ramp(p,.82,.98), inner = mix(1,.74,surround);
    const rgb = [16,8,0].map(shift => Math.round(mix((0x004fef >> shift) & 255, (0xf8fbff >> shift) & 255, light)));
    const paint = `rgb(${rgb.join(',')})`;
    let ox = x - 46.8825 * scale, oy = y - 50 * scale;
    const left = 4, right = 90, top = 2, bottom = 104;
    if (viewport) {
      ox = Math.max(16 - left * scale, Math.min(viewport.width - 12 - right * scale, ox));
      oy = Math.max(viewport.top - top * scale, Math.min(viewport.height - 16 - bottom * scale, oy));
    }
    ctx.save(); ctx.translate(ox,oy); ctx.scale(scale,scale); ctx.fillStyle = paint;
    if (surround > 0) {
      ctx.save(); ctx.globalAlpha = surround * .055; ctx.fill(outline); ctx.restore();
      ctx.save(); ctx.strokeStyle = paint; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.setLineDash([340]); ctx.lineDashOffset = 340 * (1 - surround); ctx.stroke(outline); ctx.restore();
    }
    ctx.save(); ctx.translate(46.8825,50); ctx.scale(inner,inner); ctx.translate(-46.8825,-50);
    segments.forEach((shape,i) => {
      const t = arrivals[i]; if (!t) return;
      ctx.save(); ctx.globalAlpha = i ? clamp(t * 3) : 1;
      // Short movements stay inside the mark's travelling footprint.
      ctx.translate(i === 1 ? 4 * (1 - t) : i === 2 ? -4 * (1 - t) : 0, i === 3 ? 8 * (1 - t) : 0);
      ctx.fill(shape); ctx.restore();
    });
    ctx.restore();
    ctx.restore();
    return {progress:p,stage:p<.12?'first-line':p<.28?'second-line':p<.44?'third-line':p<.82?'mark':'shield',
      bounds:{left:ox+left*scale,top:oy+top*scale,right:ox+right*scale,bottom:oy+bottom*scale}};
  }
  window.shieldBrand = {draw};
})();
