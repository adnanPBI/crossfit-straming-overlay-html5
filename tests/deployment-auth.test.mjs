import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ci=readFileSync(new URL('../.github/workflows/deploy-netlify.yml',import.meta.url),'utf8');
test('Production CI generates server-only salted verifier without embedding plaintext',()=>{
  assert.match(ci,/node scripts\/generate-control-verifier.mjs/);
  assert.match(ci,/--skip-functions-cache/);
  assert.doesNotMatch(ci,/env:set OVERLAY_CONTROL_KEY/);
});
test('Production deployment exercises valid and invalid credentials',()=>{
  assert.match(ci,/controllerConfigured!==true/);
  assert.match(ci,/\$SITE_URL\/api\/auth/);
  assert.match(ci,/Invalid key improperly accepted/);
});
