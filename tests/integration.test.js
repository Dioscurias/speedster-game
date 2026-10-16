import test from 'node:test';
import assert from 'node:assert/strict';
import {MANTA_ORIGIN,trustedHostOrigin,isHostMessage} from '../src/integration.js';
test('the embedded game trusts the lab host and same-origin standalone controls',()=>{
 const own='https://game.test';assert.equal(trustedHostOrigin(MANTA_ORIGIN+'/projects/speedster/play',own),MANTA_ORIGIN);assert.equal(trustedHostOrigin(own+'/',own),own);
 assert.equal(trustedHostOrigin('https://untrusted.test',own),null);assert.equal(trustedHostOrigin('',own),null);assert.equal(trustedHostOrigin('not a URL',own),null);
});
test('resume messages require both the trusted origin and parent window',()=>{
 const parent={},other={};assert.equal(isHostMessage({origin:MANTA_ORIGIN,source:parent},parent,MANTA_ORIGIN),true);
 assert.equal(isHostMessage({origin:'https://untrusted.test',source:parent},parent,MANTA_ORIGIN),false);assert.equal(isHostMessage({origin:MANTA_ORIGIN,source:other},parent,MANTA_ORIGIN),false);assert.equal(isHostMessage({origin:MANTA_ORIGIN,source:parent},parent,null),false);
});
