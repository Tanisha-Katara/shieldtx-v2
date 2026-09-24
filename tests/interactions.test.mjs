import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseWallet} from '../dist/wallet-address.mjs';

test('scanner accepts full EVM addresses and strips surrounding whitespace',()=>{
  const valid='0x0123456789aBcDeF0123456789abcdef01234567';
  assert.equal(normaliseWallet(`  ${valid}  `),valid.toLowerCase());
});

test('scanner rejects malformed addresses and URL or script input',()=>{
  const valid='0x0123456789aBcDeF0123456789abcdef01234567';
  for(const value of ['', '0x123',valid+'a','https://example.com',`javascript:${valid}`,valid.replace('a','z')]) {
    assert.equal(normaliseWallet(value),null);
  }
});
