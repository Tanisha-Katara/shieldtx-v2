(() => {
  'use strict';
  const segmentData = ["M76.5581 13.207C78.7672 13.207 80.558 14.998 80.5581 17.207V23.7725H13.2065V17.207C13.2067 14.998 14.9975 13.207 17.2065 13.207H76.5581Z", "M80.5581 44.9023H13.2065V34.3369H80.5581V44.9023Z", "M80.5581 66.0322H13.2065V55.4678H80.5581V66.0322Z", "M48.5854 87.0215C47.5068 87.5291 46.2579 87.5291 45.1792 87.0215L23.0278 76.5977H70.7368L48.5854 87.0215Z"];
  const segments = segmentData.map(d => new Path2D(d));
  const outline = new Path2D('M6 4H87.765V44C87.765 68 69 88 46.8825 101C24.765 88 6 68 6 44Z');
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const ramp = (p, a, b) => ease((p - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;
  function draw(ctx, {x, y, size, progress = 1, light = 1, viewport,
    bars = 1 + ramp(progress,.12,.26) + ramp(progress,.28,.42) + ramp(progress,.44,.55),
    slant = 0, angle = 0, frame = ramp(progress,.82,.98), weight = 1}) {
    const p = clamp(progress), scale = size / 74, surround = clamp(frame);
    const inner = mix(1,.74,surround), centres = [18.48975,39.6196,60.75,82];
    const counts = [18.48975,29.0547,39.6196,50];
    const part = Math.max(0,Math.min(3,bars-1)), index = Math.min(2,Math.floor(part));
    const origin = mix(counts[index],counts[index+1],part-index);
    const rgb = [16,8,0].map(shift => Math.round(mix((0x004fef >> shift) & 255, (0xf8fbff >> shift) & 255, light)));
    const paint = `rgb(${rgb.join(',')})`;
    const shapes = segments.map((path,i) => ({path,i,alpha:clamp(bars-i),
      x: i<2 ? mix(0,(i-.5)*33.64,slant) : 0,
      y: mix(centres[i]-origin,0,i<2?slant:0),
      angle:i<2?slant*(-66*Math.PI/180):0,
      weight:weight*mix(1,.637,i<2?slant:0)})).filter(s=>s.alpha>0);
    const points = [];
    const transform = (px,py) => ({x:(px*Math.cos(angle)-py*Math.sin(angle))*scale,
      y:(px*Math.sin(angle)+py*Math.cos(angle))*scale});
    shapes.forEach(s=>{
      const halfWidth=s.i===3?23.86:33.676,halfHeight=s.i===3?6:5.283;
      for(const a of [-1,1])for(const b of [-1,1]) {
        const sx=a*halfWidth,sy=b*halfHeight*s.weight;
        points.push(transform((s.x+sx*Math.cos(s.angle)-sy*Math.sin(s.angle))*inner,
          (s.y+sx*Math.sin(s.angle)+sy*Math.cos(s.angle))*inner));
      }
    });
    if(surround>0)for(const px of [-42.9,43.2])for(const py of [-49,54])points.push(transform(px,py));
    const bounds={left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),
      top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
    if (viewport) {
      x = Math.max(12-bounds.left,Math.min(viewport.width-12-bounds.right,x));
      y = Math.max(viewport.top-bounds.top,Math.min(viewport.height-12-bounds.bottom,y));
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.fillStyle=paint;
    if (surround > 0) {
      ctx.save();ctx.translate(-46.8825,-50);
      ctx.save(); ctx.globalAlpha = surround * .055; ctx.fill(outline); ctx.restore();
      ctx.save(); ctx.strokeStyle = paint; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.setLineDash([340]); ctx.lineDashOffset = 340 * (1 - surround); ctx.stroke(outline); ctx.restore();
      ctx.restore();
    }
    ctx.save();ctx.scale(inner,inner);
    shapes.forEach(s => {
      ctx.save();ctx.globalAlpha=s.alpha;ctx.translate(s.x,s.y);ctx.rotate(s.angle);
      ctx.scale(1,s.weight);ctx.translate(-46.8825,-centres[s.i]);
      ctx.fill(s.path);ctx.restore();
    });
    ctx.restore();ctx.restore();
    return {x,y,progress:p,bars,slant,frame:surround,angle,
      stage:slant>.95?'association':bars<1.1?'first-line':bars<2.1?'second-line':bars<3.1?'third-line':surround>.9?'shield':'mark',
      bounds:{left:x+bounds.left,top:y+bounds.top,right:x+bounds.right,bottom:y+bounds.bottom}};
  }
  window.shieldBrand = {draw};
})();
