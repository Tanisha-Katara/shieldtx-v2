(() => {
  'use strict';
  const T = window.THREE, views = [], fallbackDraws = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  let enabled = true, frame = 0, progress = 0, tradeOverlay = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const motion = () => enabled && !reduced.matches && !document.documentElement.classList.contains('motion-off');

  function institution(ink) {
    const root = new T.Group();
    root.name = 'ShieldTX institution';
    const stone = new T.MeshBasicMaterial({color: ink, colorWrite: false, depthWrite: true,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
    const edge = new T.LineBasicMaterial({color: ink, transparent: true, opacity: .94});
    const detail = new T.LineBasicMaterial({color: ink, transparent: true, opacity: .42});
    function solid(geometry, x, y, z, outlined = true) {
      const mesh = new T.Mesh(geometry, stone);
      mesh.position.set(x, y, z); root.add(mesh);
      if (outlined) {
        const outline = new T.LineSegments(new T.EdgesGeometry(geometry, 25), edge);
        outline.renderOrder = 2; mesh.add(outline);
      }
      return mesh;
    }
    const box = (w,h,d,x,y,z) => solid(new T.BoxGeometry(w,h,d),x,y,z);
    function line(points, material = detail) {
      const drawing = new T.Line(new T.BufferGeometry().setFromPoints(points.map(p => new T.Vector3(...p))), material);
      drawing.renderOrder = 2; root.add(drawing);
    }
    // Broad steps and ten columns give the institution visible depth.
    for (let i = 0; i < 4; i++) box(7.7-i*.38,.17,5.5-i*.38,0,.085+i*.17,0);
    box(6.2,.13,4,0,.745,0);
    function column(x,z,detailed) {
      box(.66,.13,.66,x,.875,z);
      solid(new T.CylinderGeometry(.27,.30,.14,32),x,1.01,z);
      solid(new T.CylinderGeometry(.205,.25,2.56,48),x,2.34,z,false);
      for (let k = 0; k < 16; k++) {
        if (!detailed && k % 2) continue;
        const a = k/16*Math.PI*2;
        line([[x+Math.cos(a)*.253,1.06,z+Math.sin(a)*.253],
          [x+Math.cos(a)*.208,3.62,z+Math.sin(a)*.208]],k%4===0?edge:detail);
      }
      solid(new T.CylinderGeometry(.28,.205,.16,32),x,3.70,z);
      box(.64,.13,.64,x,3.835,z);
    }
    [-2.42,-.81,.81,2.42].forEach(x => {column(x,1.55,true);column(x,-1.55,false);});
    column(-2.42,0,false); column(2.42,0,true);
    box(6.25,.34,4.05,0,4.07,0);
    box(6.52,.12,4.28,0,4.30,0);
    const roof = new T.Shape();
    roof.moveTo(-3.26,0); roof.lineTo(0,1.13); roof.lineTo(3.26,0); roof.closePath();
    solid(new T.ExtrudeGeometry(roof,{depth:4.25,bevelEnabled:false}),0,4.39,-2.125);
    line([[-2.91,4.51,2.135],[0,5.39,2.135],[2.91,4.51,2.135],[-2.91,4.51,2.135]],edge);
    line([[-2.57,4.61,2.14],[0,5.24,2.14],[2.57,4.61,2.14]]);
    root.userData.inkMaterials = [edge, detail];
    root.userData.inkOpacities = [.94, .42];
    return root;
  }

  function shieldMark(inkTone) {
    const root = new T.Group();
    root.name = 'ShieldTX shield mark';
    const surface = document.createElement('canvas');
    surface.width = surface.height = 256;
    const ctx = surface.getContext('2d');
    window.shieldBrand.draw(ctx,{x:128,y:128,size:192,progress:1,light:inkTone?0:1});
    const texture = new T.CanvasTexture(surface);
    texture.minFilter = texture.magFilter = T.LinearFilter;
    texture.generateMipmaps = false;
    const mark = new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,
      depthWrite:false,depthTest:true,toneMapped:false}));
    // The logo occupies 75% of its texture: .76 * .75 preserves the canonical
    // .57-unit visible height used by the travelling overlay's anchor contract.
    mark.scale.set(.76,.76,1);
    mark.renderOrder = 3;
    root.add(mark);
    root.position.set(.10,2.27,2.47);
    return root;
  }

  // A drawn architectural fallback keeps the story intact without a GPU.
  function fallback(host,hero) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden','true');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    host.replaceChildren(canvas); host.dataset.model = 'canvas';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ink = host.dataset.tone === 'ink' ? '#064295' : '#f4f5e9';
    function draw() {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ratio = Math.min(devicePixelRatio || 1,2);
      canvas.width = Math.round(r.width*ratio); canvas.height = Math.round(r.height*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,r.width,r.height);
      const scale = Math.min(r.width/10.4,r.height/8.3);
      const project = ([x,y,z]) => [r.width/2+(x*.9-z*.44)*scale,
        r.height/2+2.3*scale-(y*.96-x*.14-z*.29)*scale];
      function path(points,close=false,fill=null,alpha=.88) {
        ctx.beginPath();
        points.map(project).forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
        if (close) ctx.closePath();
        ctx.globalAlpha = alpha;
        if (fill) {ctx.fillStyle=fill;ctx.fill();}
        ctx.strokeStyle=ink;ctx.lineWidth=hero?.9:.65;ctx.stroke();
      }
      function box(w,h,d,x,y,z) {
        const a=[x-w/2,y-h/2,z+d/2],b=[x+w/2,y-h/2,z+d/2];
        const c=[x+w/2,y+h/2,z+d/2],e=[x-w/2,y+h/2,z+d/2];
        const f=[x+w/2,y+h/2,z-d/2],g=[x-w/2,y+h/2,z-d/2];
        path([a,b,c,e],true);path([e,c,f,g],true);
        path([b,[x+w/2,y-h/2,z-d/2],f]);
      }
      for(let i=0;i<4;i++)box(7.7-i*.38,.17,5.5-i*.38,0,.085+i*.17,0);
      [-1.55,1.55].forEach(z=>[-2.42,-.81,.81,2.42].forEach(x=>{
        box(.64,.13,.64,x,.875,z);
        path([[x-.25,1.06,z],[x-.205,3.62,z],[x+.205,3.62,z],[x+.25,1.06,z]],true);
        for(let n=-1;n<=1;n++)path([[x+n*.115,1.07,z+.24],[x+n*.09,3.61,z+.20]],false,null,.38);
        box(.64,.13,.64,x,3.835,z);
      }));
      box(6.25,.34,4.05,0,4.07,0);box(6.52,.12,4.28,0,4.30,0);
      path([[-3.26,4.39,2.125],[0,5.52,2.125],[3.26,4.39,2.125]],true);
      path([[0,5.52,2.125],[0,5.52,-2.125],[3.26,4.39,-2.125],[3.26,4.39,2.125]],true);
      path([[-2.91,4.51,2.14],[0,5.39,2.14],[2.91,4.51,2.14]],true);
      if(hero && !(tradeOverlay && motion())){
        const [x,y]=project([.10,2.27,2.47]);
        ctx.globalAlpha=1;
        window.shieldBrand.draw(ctx,{x,y,size:.57*scale,progress:1,light:host.dataset.tone==='ink'?0:1});
      }
      ctx.globalAlpha=1;
    }
    fallbackDraws.set(host,draw);
    new ResizeObserver(draw).observe(host);draw();
  }

  function render(view) {
    if(view.hero){
      const phase=motion()?progress:0;
      const fade=1-clamp(phase/.83);
      view.building.userData.inkMaterials.forEach((material,i)=>{
        material.opacity=view.building.userData.inkOpacities[i]*fade;
      });
      view.building.visible=fade>.001;
      view.group.position.y=-phase*.3;
      view.group.rotation.y=(view.entrance||0)+phase*.11;
      view.trade.visible=!(tradeOverlay && motion()) && phase<.12;
      view.trade.traverse(object=>{
        if(!object.material)return;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        materials.forEach(material=>{material.opacity=1-clamp(phase/.12);});
      });
      view.host.dataset.journey=phase<.08?'inside':phase<.9?'departing':'exposed';
    }
    if(view.visible && !document.hidden && !view.lost) view.renderer.render(view.scene,view.camera);
  }
  function requestFrame() {
    if(!frame && !document.hidden)frame=requestAnimationFrame(animate);
  }
  function animate(time) {
    frame=0;let unsettled=false,roofChanged=false;
    views.forEach(v=>{
      if(!v.visible || v.lost)return;
      const allowed=motion(),elapsed=v.entered?Math.min(1,(time-v.entered)/1100):1;
      const x=allowed?v.pointer.x:0,y=allowed?v.pointer.y:0;
      v.building.rotation.y+=(x-v.building.rotation.y)*.13;
      v.building.rotation.x+=(y-v.building.rotation.x)*.13;
      v.entrance=allowed?Math.pow(1-elapsed,3)*.055:0;
      render(v);
      if(v.hero&&tradeOverlay)roofChanged=true;
      if(allowed && (elapsed<1 || Math.abs(x-v.building.rotation.y)>.0001 ||
        Math.abs(y-v.building.rotation.x)>.0001))unsettled=true;
    });
    // Scroll paints also call render(); only the independent model animation
    // clock announces changes, avoiding a paint -> render -> paint loop.
    if(roofChanged)document.dispatchEvent(new Event('shield-roof-change'));
    if(unsettled)requestFrame();
  }

  function makeView(host,hero) {
    if(!host)return;
    if(!T){fallback(host,hero);return;}
    let renderer;
    try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
    catch(_){fallback(host,hero);return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x004fef,0);
    renderer.domElement.setAttribute('aria-hidden','true');
    renderer.domElement.style.cssText='display:block;width:100%;height:100%';
    host.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.OrthographicCamera(-5,5,4,-4,.1,100);
    camera.position.set(10,8.6,20);camera.lookAt(0,2.55,0);
    const ink=host.dataset.tone==='ink',building=institution(ink?0x064295:0xf4f5e9);
    const group=new T.Group();group.add(building);
    const tradeObject=hero?shieldMark(ink):null;
    if(tradeObject)group.add(tradeObject);
    scene.add(group);
    const view={host,renderer,scene,camera,building,group,hero,trade:tradeObject,visible:true,
      entered:motion()&&hero?performance.now():0,pointer:{x:0,y:0},lost:false};
    views.push(view);host.dataset.model='webgl';
    function resize(){
      if(view.lost)return;
      const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
      renderer.setSize(r.width,r.height,false);
      const aspect=r.width/r.height,height=Math.max(7.25,10.25/aspect);
      camera.left=-height*aspect/2;camera.right=height*aspect/2;
      camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();render(view);
    }
    new ResizeObserver(resize).observe(host);
    new IntersectionObserver(entries=>{
      view.visible=entries[0].isIntersecting;if(view.visible)requestFrame();
    },{rootMargin:'80px'}).observe(host);
    if(hero){
      host.addEventListener('pointermove',event=>{
        if(!motion()||!pointer.matches)return;
        const r=host.getBoundingClientRect();
        view.pointer.x=((event.clientX-r.left)/r.width-.5)*.045;
        view.pointer.y=((event.clientY-r.top)/r.height-.5)*.018;requestFrame();
      });
      host.addEventListener('pointerleave',()=>{
        view.pointer.x=view.pointer.y=0;requestFrame();
      });
    }
    renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();view.lost=true;fallback(host,hero);
    });
    resize();
  }
  function refresh(){
    if(!motion())views.forEach(v=>{
      v.pointer.x=v.pointer.y=0;v.building.rotation.set(0,0,0);v.group.rotation.set(0,0,0);v.entrance=0;
    });
    fallbackDraws.forEach((draw,host)=>{
      if(host.id==='hero-model')host.style.opacity=motion()?String(1-clamp(progress/.83)):'1';
      draw();
    });
    requestFrame();
  }
  makeView(document.getElementById('hero-model'),true);
  window.shieldScene={
    setTradeOverlay(value){
      tradeOverlay=Boolean(value);
      views.filter(view=>view.hero).forEach(render);
      fallbackDraws.forEach(draw=>draw());
    },
    setProgress(value){
      progress=clamp(Number(value)||0);
      views.filter(view=>view.hero).forEach(render);
      const fallbackHost=document.querySelector('#hero-model[data-model="canvas"]');
      if(fallbackHost)fallbackHost.style.opacity=motion()?String(1-clamp(progress/.83)):'1';
    },
    getRoofAnchor({rest=false}={}){
      const host=document.getElementById('hero-model');
      if(!host)return null;
      const rect=host.getBoundingClientRect();
      if(!rect.width||!rect.height)return null;
      const view=views.find(item=>item.hero&&!item.lost);
      // This segment is part of the front roof prism's actual lower edge.
      const edge=[[.65,4.39,2.125],[1.45,4.39,2.125]];
      let points;
      if(view){
        view.scene.updateMatrixWorld(true);
        view.camera.updateMatrixWorld(true);
        let buildingWorld=view.building.matrixWorld;
        if(rest){
          const position=view.group.position.clone();position.y=0;
          const rotation=view.group.rotation.clone();rotation.y=view.entrance||0;
          const groupMatrix=new T.Matrix4().compose(position,
            new T.Quaternion().setFromEuler(rotation),view.group.scale);
          buildingWorld=new T.Matrix4().multiplyMatrices(view.group.parent.matrixWorld,groupMatrix)
            .multiply(view.building.matrix);
        }
        points=edge.map(position=>{
          const point=new T.Vector3(...position).applyMatrix4(buildingWorld).project(view.camera);
          return {x:rect.left+(point.x*.5+.5)*rect.width,
            y:rect.top+(-point.y*.5+.5)*rect.height};
        });
      }else{
        const scale=Math.min(rect.width/10.4,rect.height/8.3);
        points=edge.map(([x,y,z])=>({
          x:rect.left+rect.width/2+(x*.9-z*.44)*scale,
          y:rect.top+rect.height/2+2.3*scale-(y*.96-x*.14-z*.29)*scale
        }));
      }
      const [a,b]=points,dx=b.x-a.x,dy=b.y-a.y;
      return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,
        size:Math.hypot(dx,dy)/.91,angle:Math.atan2(dy,dx)};
    },
    getTradeAnchor(){
      const view=views.find(item=>item.hero&&!item.lost);
      const host=document.getElementById('hero-model');
      if(!host)return null;
      const rect=host.getBoundingClientRect();
      if(!view){
        const scale=Math.min(rect.width/10.4,rect.height/8.3);
        return {x:rect.left+rect.width/2+(.1*.9-2.47*.44)*scale,
          y:rect.top+rect.height/2+2.3*scale-(2.27*.96-.1*.14-2.47*.29)*scale,
          size:.57*scale};
      }
      const point=new T.Vector3(.10,2.27,2.47).project(view.camera);
      return {x:rect.left+(point.x*.5+.5)*rect.width,y:rect.top+(-point.y*.5+.5)*rect.height,
        size:Math.max(15,rect.width*.57/(view.camera.right-view.camera.left))};
    },
    refresh,setMotion(value){enabled=value!==false;refresh();}
  };
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',refresh);
  document.addEventListener('visibilitychange',refresh);
  document.dispatchEvent(new Event('shield-model-ready'));
  requestFrame();
})();
