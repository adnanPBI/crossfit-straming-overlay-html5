import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/deploy-netlify.yml',import.meta.url),'utf8');

test('Netlify production deployment supplies the control key to functions securely',()=>{
  assert.match(workflow,/--secret-env "OVERLAY_CONTROL_KEY=\$CONTROL_KEY"/);
  assert.match(workflow,/--prod --context production/);
  assert.doesNotMatch(workflow,/netlify env:set OVERLAY_CONTROL_KEY/);
});

test('deployment verifies the configured controller and checks valid and invalid keys',()=>{
  assert.match(workflow,/controllerConfigured!==true/);
  assert.match(workflow,/\$SITE_URL\/api\/auth/);
  assert.match(workflow,/Production control authentication passed/);
  assert.match(workflow,/Invalid credential rejected as expected/);
});
