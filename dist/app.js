import {normaliseWallet} from './wallet-address.mjs';

const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
let motionChoice=null;
const motionDisabled=()=>preference.matches||motionChoice===true;
const steps=[
  {title:'Deposit into your shielded balance.',copy:'Your deposits are shielded as they enter your ShieldTX balance.'},
  {title:'A fresh wallet for every trade.',copy:'Each position gets a new, unlinked wallet. No account or wallet is reused.'},
  {title:'Trade through the terminal.',copy:'Open and close positions and run your strategies in the terminal. No hidden charges.'},
  {title:'Withdraw to a wallet you choose.',copy:'ShieldTX shields the withdrawal again before sending your profits to your chosen wallet. No hidden withdrawal charges.'},
];
let selectedStep=0,lastRenderedStep=0,manualInspection=null,detailAnimation=null;
function selectStep(step){
  if(!Number.isInteger(step)||step<0||step>=steps.length)return;
  selectedStep=step;
  $('.flow-board').dataset.step=String(step);
  $$('.flow-node').forEach((node,index)=>{
    const active=index===step;
    node.classList.toggle('is-active',active);
    node.setAttribute('aria-pressed',String(active));
  });
  $('#detail-count').textContent=String(step+1).padStart(2,'0');
  $('#detail-title').textContent=steps[step].title;
  $('#detail-copy').textContent=steps[step].copy;
  if(step!==lastRenderedStep&&!motionDisabled()){
    detailAnimation?.cancel();
    detailAnimation=$('.flow-detail>div:nth-child(2)').animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
  }
  lastRenderedStep=step;
  $('#flow-status').textContent=motionDisabled()?'Select a step':`Step ${step+1} of 4 · Scroll to follow`;
}

document.addEventListener('shield-flow-step',event=>{
  if(motionDisabled())return;
  const step=event.detail?.step;
  if(manualInspection!==null){
    if(step!==manualInspection)return;
    manualInspection=null;
  }
  selectStep(step);
});

function updateMotion(){
  const disabled=motionDisabled();
  document.documentElement.classList.toggle('motion-off',disabled);
  $('#motion-toggle').setAttribute('aria-pressed',String(disabled));
  $('#motion-toggle').innerHTML=`Motion ${disabled?'off':'on'} <span aria-hidden="true">◎</span>`;
  $('#motion-toggle').disabled=preference.matches;
  manualInspection=null;
  if(disabled)detailAnimation?.cancel();
  window.shieldScene?.setMotion(!disabled);
  selectStep(selectedStep);
  document.dispatchEvent(new CustomEvent('shield-motion-change',{detail:{enabled:!disabled}}));
}
$('#motion-toggle').addEventListener('click',()=>{motionChoice=!motionDisabled();updateMotion();});
preference.addEventListener('change',updateMotion);
document.addEventListener('shield-model-ready',updateMotion);
updateMotion();

$$('.flow-node').forEach(node=>node.addEventListener('click',()=>{
  const step=Number(node.dataset.step);
  selectStep(step);
  manualInspection=!motionDisabled()&&window.shieldMotion?.navigateToStep(step)?step:null;
}));
$('#flow-replay').addEventListener('click',()=>{
  selectStep(0);
  manualInspection=!motionDisabled()&&window.shieldMotion?.navigateToStep(0)?0:null;
});
// Native scrolling is the only playback clock. Manual navigation temporarily
// holds the chosen explanation while the page scrolls to the matching stage.
function releaseInspection(){
  if(manualInspection===null)return;
  manualInspection=null;
  const state=window.shieldMotion?.getState();
  if(state?.enabled&&!motionDisabled())selectStep(Math.min(3,Math.floor(state.flow*4)));
}
window.addEventListener('scrollend',releaseInspection);
window.addEventListener('wheel',releaseInspection,{passive:true});
window.addEventListener('touchstart',releaseInspection,{passive:true});
window.addEventListener('keydown',event=>{
  if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))releaseInspection();
});


function closeMenu(){
  $('#main-nav').classList.remove('is-open');
  $('.menu-toggle').setAttribute('aria-expanded','false');
  $('.menu-toggle').setAttribute('aria-label','Open navigation');
}
$('.menu-toggle').addEventListener('click',()=>{
  const open=$('#main-nav').classList.toggle('is-open');
  $('.menu-toggle').setAttribute('aria-expanded',String(open));
  $('.menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');
});
$$('#main-nav a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
window.matchMedia('(min-width: 681px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

const scanner=$('#scanner-dialog');
let opener=null;
function closeScanner(){scanner.close();}
$$('[data-open-scanner]').forEach(button=>button.addEventListener('click',()=>{
  opener=button;closeMenu();
  scanner.showModal();document.body.classList.add('dialog-open');
  $('#wallet-address').focus();
}));
scanner.querySelector('[data-close-dialog]').addEventListener('click',closeScanner);
scanner.addEventListener('close',()=>{
  document.body.classList.remove('dialog-open');
  if(opener?.closest('#main-nav')&&window.matchMedia('(max-width: 680px)').matches)$('.menu-toggle').focus();
  else opener?.focus();
});
scanner.addEventListener('click',event=>{
  if(event.target!==scanner)return;
  const r=scanner.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeScanner();
});
$('#scanner-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=$('#wallet-address'),error=$('#scanner-error');
  const address=normaliseWallet(input.value);
  if(!address){
    error.textContent='Enter a public address: 0x followed by 40 hexadecimal characters.';
    error.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return;
  }
  error.hidden=true;input.removeAttribute('aria-invalid');
  window.open(`https://scanner.shieldtx.xyz/#scan/${encodeURIComponent(address)}`,'_blank','noopener,noreferrer');
});
$('#wallet-address').addEventListener('input',()=>{
  $('#scanner-error').hidden=true;$('#wallet-address').removeAttribute('aria-invalid');
});
