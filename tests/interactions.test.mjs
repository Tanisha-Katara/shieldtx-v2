import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkthrough,normaliseWallet} from '../dist/flow-controller.mjs';

function harness(options={}){
  let next=0;
  const queue=new Map();
  const states=[];
  const flow=createWalkthrough({...options,schedule:fn=>{queue.set(++next,fn);return next;},cancel:id=>queue.delete(id),onChange:state=>states.push(state)});
  return {flow,queue,states,tick(){const item=queue.entries().next().value;assert.ok(item,'A scheduled step exists');queue.delete(item[0]);item[1]();}};
}

test('automatic walkthrough runs once and retains its final explanation',()=>{
  const {flow,tick,queue}=harness();flow.autoStart();
  for(let i=0;i<4;i++)tick();
  assert.deepEqual(flow.getState(),{step:3,playing:false,completed:true,reduced:false,visible:true});
  flow.autoStart();assert.equal(queue.size,0);
});
test('manual selection cancels a running clock and cannot be overwritten by a stale callback',()=>{
  const {flow,queue}=harness();flow.play();const stale=[...queue.values()][0];
  flow.select(2);stale();
  assert.equal(flow.getState().step,2);assert.equal(flow.getState().playing,false);assert.equal(queue.size,0);
  flow.autoStart();assert.equal(queue.size,0);
});
test('pause keeps the inspected step; play resumes from it',()=>{
  const {flow,tick,queue}=harness();flow.play();tick();flow.pause();
  assert.equal(flow.getState().step,1);assert.equal(queue.size,0);
  flow.play();tick();assert.equal(flow.getState().step,2);
});
test('offscreen state stops advancing and resumes only a previously running sequence',()=>{
  const {flow,tick,queue}=harness();flow.play();tick();flow.setVisible(false);
  assert.equal(queue.size,0);assert.equal(flow.getState().playing,false);
  flow.setVisible(true);tick();assert.equal(flow.getState().step,2);
  flow.pause();flow.setVisible(false);flow.setVisible(true);assert.equal(queue.size,0);
});
test('reduced motion stops playback immediately and still permits all manual steps',()=>{
  const {flow,queue}=harness();flow.play();flow.setReduced(true);
  assert.equal(queue.size,0);assert.equal(flow.getState().playing,false);
  for(let i=0;i<4;i++){flow.select(i);assert.equal(flow.getState().step,i);}
  flow.play();flow.autoStart();flow.replay();assert.equal(queue.size,0);
});
test('replay resets one running clock without duplicating timers',()=>{
  const {flow,tick,queue}=harness();flow.play();tick();tick();flow.replay();
  assert.equal(flow.getState().step,0);assert.equal(queue.size,1);
  tick();assert.equal(flow.getState().step,1);
});
test('scanner accepts only full EVM addresses and strips whitespace',()=>{
  const valid='0x0123456789aBcDeF0123456789abcdef01234567';
  assert.equal(normaliseWallet(`  ${valid}  `),valid.toLowerCase());
  for(const value of ['', '0x123',valid+'a','https://example.com',`javascript:${valid}`,valid.replace('a','z')])assert.equal(normaliseWallet(value),null);
});
