import {createWalkthrough,normaliseWallet} from './flow-controller.mjs';

const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
let motionChoice=null;
const motionDisabled=()=>motionChoice??preference.matches;
const steps=[
  {title:'Fund your ShieldTX balance.',copy:'Fund your balance with USDC. This is the starting point for your shielded trading activity.'},
  {title:'Shield the funding-wallet association.',copy:'ShieldTX separates your funding wallet from the account that will execute your trade. Onchain activity remains public.'},
  {title:'Create a fresh trading account.',copy:'A fresh account is created for the trade. Public position data appears against that account.'},
  {title:'Execute on Hyperliquid.',copy:'The account submits your order to Hyperliquid. After the position closes, proceeds return to your ShieldTX balance.'},
];
let userInteraction=false,wasInView=false,lastRenderedStep=0;
const flow=createWalkthrough({reduced:motionDisabled(),onChange:state=>{
  $('.flow-board').dataset.step=String(state.step);
  $$('.flow-node').forEach((node,index)=>{
    const active=index===state.step;
    node.classList.toggle('is-active',active);
    node.setAttribute('aria-pressed',String(active));
  });
  $('#detail-count').textContent=String(state.step+1).padStart(2,'0');
  $('#detail-title').textContent=steps[state.step].title;
  $('#detail-copy').textContent=steps[state.step].copy;
  if(state.step!==lastRenderedStep&&!motionDisabled()){
    $('.flow-detail>div:nth-child(2)').animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
  }
  lastRenderedStep=state.step;
  $('#play-symbol').textContent=state.playing?'Ⅱ':'▶';
  $('#play-label').textContent=state.playing?'Pause':'Play';
  $('#flow-play').setAttribute('aria-label',state.playing?'Pause trade walkthrough':'Play trade walkthrough');
  $('#flow-play').disabled=state.reduced;
  $('#flow-replay').disabled=state.reduced;
  $('#flow-status').textContent=state.reduced?'Select a step':state.completed?'Complete':state.playing?`Step ${state.step+1} of 4`:userInteraction?'Paused · Select any step':'Ready to explore';
}});

function updateMotion(){
  const disabled=motionDisabled();
  document.documentElement.classList.toggle('motion-off',disabled);
  $('#motion-toggle').setAttribute('aria-pressed',String(disabled));
  $('#motion-toggle').innerHTML=`Motion ${disabled?'off':'on'} <span aria-hidden="true">◎</span>`;
  window.shieldScene?.setMotion(!disabled);
  flow.setReduced(disabled);
}
$('#motion-toggle').addEventListener('click',()=>{motionChoice=!motionDisabled();updateMotion();});
preference.addEventListener('change',updateMotion);
document.addEventListener('shield-model-ready',updateMotion);
updateMotion();

$$('.flow-node').forEach(node=>node.addEventListener('click',()=>{
  userInteraction=true;flow.select(Number(node.dataset.step));
}));
$('#flow-play').addEventListener('click',()=>{
  userInteraction=true;
  if(flow.getState().playing)flow.pause();else flow.play();
});
$('#flow-replay').addEventListener('click',()=>{userInteraction=true;flow.replay();});
// A section entering the viewport starts one optional sequence on larger screens.
// Scrolling is never captured or translated into playback progress.
const flowObserver=new IntersectionObserver(entries=>{
  wasInView=entries[0].isIntersecting;
  flow.setVisible(wasInView&&!document.hidden);
  if(wasInView&&!userInteraction&&window.matchMedia('(min-width: 900px)').matches)flow.autoStart();
},{threshold:.38});
flowObserver.observe($('.flow-board'));
document.addEventListener('visibilitychange',()=>flow.setVisible(wasInView&&!document.hidden));
window.addEventListener('pagehide',()=>flow.pause());

$$('[data-comparison]').forEach(button=>button.addEventListener('click',()=>{
  const shielded=button.dataset.comparison==='shielded';
  $('.comparison').dataset.shielded=String(shielded);
  $$('[data-comparison]').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));});
  $('#bridge-label').textContent=shielded?'Association shielded':'Public association';
  $('#example-account').textContent=shielded?'Fresh trading account':'Your trading account';
  $('#comparison-description').textContent=shielded?'Position data stays visible. ShieldTX shields the public link to your funding wallet.':'An observer can associate trading activity with your wallet.';
}));

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
