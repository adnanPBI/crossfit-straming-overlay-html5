import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const publicFile=p=>new URL('../public/'+p,import.meta.url);

test('Netlify publish directory contains homepage with valid controller link',()=>{
  const html=readFileSync(publicFile('index.html'),'utf8');
  assert.match(html,/WOD Stream Studio/);
  assert.match(html,/href="\/control"/);
});
test('all three output/control pages, source assets and original sample logo are shipped',()=>{
  for(const f of ['index.html','control.html','overlay.html','remote.html','css/control.css','css/overlay.css','css/remote.css','js/api.js','js/control.js','js/overlay.js','js/remote.js','js/backup.js','js/defaults.js','js/i18n.js','js/timer-engine.js','sample-logo.png']){
    assert.ok(statSync(publicFile(f)).size>0,'Missing '+f);
  }
  assert.equal(readFileSync(publicFile('sample-logo.png')).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});
