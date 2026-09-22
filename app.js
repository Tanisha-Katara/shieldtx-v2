(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reducedPreference=matchMedia('(prefers-reduced-motion: reduce)');
let motionChoice=null, context, resizeTimer, solutionTrigger, activeStep=-1;
const reduced=()=>motionChoice===null?reducedPreference.matches:motionChoice;
const stepCopy=[
 'Fund your ShieldTX balance with USDC.',
 'ShieldTX separates your funding wallet from the account that trades.',
 'A fresh account keeps your main wallet out of the public trading trail.',
 'Execute on Hyperliquid and return proceeds to your ShieldTX balance.'
];
function step(n){n=Math.max(0,Math.min(3,n));if(activeStep===n)return;activeStep=n;$('.step-count').textContent=`0${n+1} / 04`;$('#step-copy').textContent=stepCopy[n];$$('.flow-step').forEach((b,i)=>{b.classList.toggle('active',i===n);b.setAttribute('aria-pressed',String(i===n));});$$('.flow-node').forEach((el,i)=>el.classList.toggle('is-active',i===n));}
function setRouteProgress(progress){
 const paint=(p,value)=>{p.style.strokeDashoffset=String((1-value)*p.getTotalLength());p.style.opacity=value>0?'1':'0';p.style.markerEnd=value>.98?'url(#flow-arrow)':'none';};
 $$('.flow-route').forEach((p,i)=>paint(p,Math.max(0,Math.min(1,(progress-i*.22)/.22))));
 paint($('.return-route'),Math.max(0,Math.min(1,(progress-.75)/.23)));
}
function setup(){
 if(context)context.revert();solutionTrigger=null;activeStep=-1;
 const desktop=innerWidth>760, enabled=!reduced()&&window.gsap&&window.ScrollTrigger;
 document.documentElement.classList.toggle('motion-off',!enabled);document.body.classList.toggle('has-motion',!!enabled&&desktop);
 $('#motion-toggle').setAttribute('aria-pressed',String(!enabled));$('#motion-toggle').innerHTML=`Motion ${enabled?'on':'off'} <span aria-hidden="true">◎</span>`;
 const hero=$('.hero'),problem=$('.problem'),stage=$('.visual-stage'),institutionStage=$('.institution-stage');
 institutionStage.style.top='';
 stage.style.top='';stage.style.transform='';stage.style.translate='';stage.style.rotate='';stage.style.scale='';stage.style.opacity='';problem.style.minHeight='';
 // Only the orb follows the scroll. The institution remains attached to the hero.
 if(desktop){const track=$('.visual-track');stage.style.top=`${$('.journey').getBoundingClientRect().top+scrollY+track.offsetTop}px`;}
 let heroTop=0,problemTop=0;
 if(!desktop){const artHeight=stage.getBoundingClientRect().height;heroTop=hero.offsetHeight-artHeight-66;stage.style.top=`${heroTop}px`;institutionStage.style.top=`${heroTop}px`;const copy=$('.problem .narrative-copy'),copyHeight=copy.offsetHeight,copyTop=copy.offsetTop;problem.style.minHeight=`${copyTop+copyHeight+artHeight+135}px`;problemTop=problem.offsetTop+copyTop+copyHeight+16;}
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const fr=$('.flow-diagram').getBoundingClientRect();const ar=$$('.diagram-art').slice(0,4).map(el=>el.getBoundingClientRect());
 const centers=ar.map(r=>r.left+r.width/2-fr.left);const fy=ar[0].top+ar[0].height/2-fr.top;
 $('.routes').setAttribute('viewBox',`0 0 ${fr.width} ${fr.height}`);
 const routeEnds=[[centers[0]+60,centers[1]-ar[1].width/2+14],[centers[1]+ar[1].width/2-14,centers[2]-54],[centers[2]+53,centers[3]-75]];
 $$('.flow-route').forEach((p,i)=>p.setAttribute('d',`M${routeEnds[i][0]} ${fy}H${routeEnds[i][1]}`));
 const returnY=$('.return-caption').getBoundingClientRect().top-fr.top-12;
 $('.return-route').setAttribute('d',`M${centers[3]+85} ${fy+72}V${returnY-12}Q${centers[3]+85} ${returnY} ${centers[3]+73} ${returnY}H${centers[1]+12}Q${centers[1]} ${returnY} ${centers[1]} ${returnY-12}V${returnY-22}`);
 $('.fund-particle').setAttribute('cy',fy);
 
 context=gsap.context(()=>{
   const phase={value:0};
   const placeMobileStage=()=>{
     if(desktop)return;
     const p=phase.value;
     stage.style.top=`${p<.35?heroTop+(enabled?scrollY:0):problemTop}px`;
     stage.style.opacity=String(!enabled?1:p<.22?Math.pow(1-p/.22,2):p<.75?0:Math.min(1,(p-.75)/.25));
   };
   const paintScene=()=>{placeMobileStage();window.shieldScene?.setProgress(phase.value);$('.edge-label').classList.toggle('exposed',phase.value>.65);};
   if(enabled){
     gsap.to('.scroll-cue',{autoAlpha:0,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'top -100',scrub:true}});
     const sceneTimeline=gsap.timeline({scrollTrigger:{trigger:problem,start:()=>Math.max(80,problem.getBoundingClientRect().top+scrollY-innerHeight*(desktop?1.03:1.01)),end:desktop?'top 46%':'top 29%',scrub:.55,invalidateOnRefresh:true}});
     sceneTimeline.to(phase,{value:1,duration:1,ease:'none',onUpdate:paintScene},0)
       .to('.institution-stage',{opacity:0,duration:.62,ease:'none'},0);
     if(!desktop){
       // Relocate the orb while hidden on narrow screens, then reveal it below
       // the problem copy. The separate institution layer stays in the hero.
       ScrollTrigger.create({start:0,end:'max',onUpdate:placeMobileStage,onRefresh:placeMobileStage});
       placeMobileStage();
     }
   }else{
     const showPhase=exposed=>{phase.value=exposed?1:0;paintScene();gsap.set('.institution-stage',{opacity:exposed?0:1});if(!desktop)stage.style.top=`${exposed?problemTop:heroTop}px`;};
     ScrollTrigger.create({trigger:problem,start:'top 65%',onEnter:()=>showPhase(true),onLeaveBack:()=>showPhase(false)});
     showPhase(problem.getBoundingClientRect().top<innerHeight*.65);
   }
   $$('.flow-route,.return-route').forEach(p=>{const len=p.getTotalLength();gsap.set(p,{strokeDasharray:len,strokeDashoffset:enabled?len:0});});
   step(0);
   if(enabled&&desktop){
    setRouteProgress(0);
    const flow=gsap.timeline({scrollTrigger:{trigger:'.solution-story',start:()=>`top top+=${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'))}`,end:'bottom bottom',scrub:.55,onUpdate:self=>step(Math.min(3,Math.floor(self.progress*4)))}});
    flow.fromTo('.fund-particle',{attr:{cx:routeEnds[0][0]},opacity:0},{attr:{cx:centers[1]},opacity:1,duration:.2,ease:'none'},0)
     .to('.fund-particle',{opacity:0,duration:.05},.2)
     .fromTo('.fund-point',{scale:0},{scale:1,duration:.15},.2)
     .fromTo('.wallet-art',{opacity:.2,y:10},{opacity:1,y:0,duration:.18},.43)
     .fromTo('.created-light',{scale:0},{scale:1,duration:.12},.49)
     .fromTo('.market-art',{opacity:.2},{opacity:1,duration:.15},.66)
     .fromTo('.return-caption',{opacity:.2},{opacity:1,duration:.18},.8);
    const state={value:0};flow.to(state,{value:1,duration:1,ease:'none',onUpdate:()=>setRouteProgress(state.value)},0);
    solutionTrigger=flow.scrollTrigger;
   }else{gsap.set('.fund-particle',{opacity:0});setRouteProgress(1);step(0);}
   if(enabled){$$('.feature').forEach(el=>gsap.fromTo(el,{opacity:.4,y:22},{opacity:1,y:0,duration:.6,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 93%',toggleActions:'play none none reverse'}}));}
 });
 ScrollTrigger.refresh();
}
$$('.flow-step').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.step);step(n);if(solutionTrigger){const target=solutionTrigger.start+(solutionTrigger.end-solutionTrigger.start)*[.1,.34,.59,.995][n];window.scrollTo({top:Math.max(0,target),behavior:reduced()?'instant':'smooth'});}else{if(!reduced()&&n!==1){gsap.fromTo(`.flow-node[data-node="${n}"] .diagram-art`,{y:7,opacity:.45},{y:0,opacity:1,duration:.4});}}}));
$('.menu-toggle').addEventListener('click',()=>{const open=$('#navigation').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'Close menu':'Open menu');});
$$('#navigation a').forEach(link=>link.addEventListener('click',()=>{$('#navigation').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','Open menu');}));
const dialog=$('#scan-dialog');let scanOpener;
function closeScan(){dialog.close();document.body.classList.remove('no-scroll');scanOpener?.focus();}
$$('.scan-open').forEach(b=>b.addEventListener('click',()=>{scanOpener=b;dialog.showModal();document.body.classList.add('no-scroll');$('#wallet-address').focus();}));
$('.scan-close').addEventListener('click',closeScan);dialog.addEventListener('cancel',e=>{e.preventDefault();closeScan();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeScan();}});
$('#scan-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#wallet-address'),value=input.value.trim(),err=$('#scan-error');if(!/^0x[a-fA-F0-9]{40}$/.test(value)){err.textContent='Enter a valid public wallet address: 0x followed by 40 hexadecimal characters.';err.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return;}err.hidden=true;input.removeAttribute('aria-invalid');window.open(`https://scanner.shieldtx.xyz/#scan/${encodeURIComponent(value.toLowerCase())}`,'_blank','noopener,noreferrer');});
$('#wallet-address').addEventListener('input',()=>{$('#scan-error').hidden=true;$('#wallet-address').removeAttribute('aria-invalid');});
$('#motion-toggle').addEventListener('click',()=>{motionChoice=!reduced();setup();});reducedPreference.addEventListener('change',setup);
let lastWidth=innerWidth,lastHeight=innerHeight;window.addEventListener('resize',()=>{if(Math.abs(lastWidth-innerWidth)<2&&(innerWidth<=760||Math.abs(lastHeight-innerHeight)<2))return;lastWidth=innerWidth;lastHeight=innerHeight;clearTimeout(resizeTimer);resizeTimer=setTimeout(setup,180);});
setup();
document.fonts.ready.then(setup);
document.addEventListener('shield-model-ready',setup);
window.addEventListener('load',()=>window.ScrollTrigger?.refresh(),{once:true});
})();
