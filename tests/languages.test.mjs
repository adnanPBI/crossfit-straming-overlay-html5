import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {I18N,t,localeTag} from '../public/js/i18n.js';
import {LANGUAGES} from '../public/js/defaults.js';

test('all 6 locale dictionaries cover 100% of English keys',()=>{
  const baseKeys=Object.keys(I18N.en).sort();
  assert.equal(baseKeys.length,169);
  assert.deepEqual([...LANGUAGES].sort(),Object.keys(I18N).sort());
  for(const language of LANGUAGES){
    assert.deepEqual(Object.keys(I18N[language]).sort(),baseKeys);
    for(const value of Object.values(I18N[language]))assert.equal(typeof value,'string');
    assert.ok(localeTag[language]);
  }
  assert.equal(t('fr','start'),'Démarrer');
  assert.equal(t('de','rest'),'PAUSE');
  assert.equal(t('es','roundLabel'),'RONDA');
});

test('all translatable control page labels have corresponding strings',()=>{
  const control=fs.readFileSync(new URL('../public/control.html',import.meta.url),'utf8');
  const keys=[...control.matchAll(/data-t(?:-title|-placeholder)?="([^"]+)"/g)].map(x=>x[1]);
  assert.ok(keys.length>=100);
  for(const key of keys)assert.ok(Object.hasOwn(I18N.en,key),`Unknown label ${key}`);
});
