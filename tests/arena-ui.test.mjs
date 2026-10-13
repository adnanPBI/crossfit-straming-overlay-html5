import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_SETTINGS,createInitialData,normalizeSettings} from '../public/js/defaults.js';
import {I18N} from '../public/js/i18n.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Arena is default; other display styles remain selectable and inputs are normalized',()=>{
  assert.equal(DEFAULT_SETTINGS.appearance.broadcastStyle,'arena');
  for(const broadcastStyle of ['arena','glass','minimal'])assert.equal(normalizeSettings({appearance:{broadcastStyle}}).appearance.broadcastStyle,broadcastStyle);
  assert.equal(normalizeSettings({appearance:{broadcastStyle:'url(evil)'}}).appearance.broadcastStyle,'arena');
  assert.equal(createInitialData().scenes.length,3);
});

test('arena visual controls have semantic HTML, source-backed CSS and responsive fallbacks',()=>{
  const control=file('public/control.html'),overlay=file('public/overlay.html'),styles=file('public/css/overlay.css');
  assert.match(control,/data-path="appearance.broadcastStyle"/);
  assert.match(overlay,/id="timerOrbit"/);
  assert.match(overlay,/id="nextPhaseBadge"/);
  assert.match(styles,/data-broadcast-style="arena"/);
  assert.match(styles,/@media\(max-width:520px\)/);
  assert.match(styles,/background:transparent!important/);
});

test('all six languages provide meaningful arena and hosted-key instructions',()=>{
  for(const locale of ['de','en','fr','es','it','pt']){
    const pack=I18N[locale];
    assert.ok(pack.broadcastLook&&pack.themeArena&&pack.themeGlass&&pack.themeMinimal);
    assert.match(pack.keyInfo,/OVERLAY_CONTROL_KEY/);
  }
});

test('CI has isolated QA storage and physical sign-off is still explicitly pending',()=>{
  const workflow=file('.github/workflows/deploy-netlify.yml');
  assert.match(workflow,/netlify-acceptance.mjs seed/);
  assert.match(workflow,/netlify-acceptance.mjs verify/);
  assert.match(workflow,/Redeploy same release/);
  assert.match(file('netlify/api-core.mjs'),/qa-\$\{qaRun\}/);
  assert.match(file('docs/RELEASE-ACCEPTANCE-V2.md'),/PENDING/);
});
