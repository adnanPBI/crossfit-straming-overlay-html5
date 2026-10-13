import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../netlify/api-core.mjs';
import {scryptSync} from 'node:crypto';

function fakeStorage(){
  let current=null;
  return {getStore(){return {async get(){return current},async setJSON(_key,value){current=structuredClone(value)}}}};
}
function req(path,method='GET',body=null,key='1234567890abcdef'){
  return new Request('https://demo.netlify.app/api/'+path,{method,headers:{'x-overlay-key':key,'content-type':'application/json'},body:body===null?undefined:JSON.stringify(body)});
}
test('Netlify health and public display work without control key; writes are protected',async()=>{
  const store=fakeStorage();const handler=createHandler({...store,controlKey:undefined});
  const health=await (await handler(req('health'))).json();assert.equal(health.mode,'netlify');assert.equal(health.controllerConfigured,false);
  assert.equal((await (await handler(req('state'))).json()).timer.status,'idle');
  const denied=await handler(req('timer','POST',{action:'start'}));assert.equal(denied.status,503);
});
test('serverless backend synchronizes timer, settings and scene persistence',async()=>{
  const store=fakeStorage(); const handle=createHandler({...store,controlKey:'1234567890abcdef'});
  const send=(path,method='GET',body)=>handle(req(path,method,body));
  assert.equal((await (await send('health')).json()).controllerConfigured,true);
  assert.equal((await send('auth','POST')).status,200);
  assert.equal((await handle(req('auth','POST',null,'wrong'))).status,401);
  const patch=await send('settings','PATCH',{patch:{left:{title:'LIVE ONLINE'},timerSettings:{mode:'countdown',durationSec:75}}});
  assert.equal(patch.status,200);
  assert.equal((await (await send('state')).json()).settings.left.title,'LIVE ONLINE');
  const started=await (await send('timer','POST',{action:'start'})).json();assert.equal(started.timer.status,'running');
  const saved=await (await send('scenes','POST',{name:'Live Show'})).json();assert.ok(saved.scene.id);
  const again=createHandler({...store,controlKey:'1234567890abcdef'});
  assert.equal((await (await again(req('state'))).json()).scenes.at(-1).name,'Live Show');
  assert.equal((await send('timer','POST',{action:'reset'})).status,200);
  assert.equal((await (await send('state')).json()).timer.status,'idle');
  assert.equal((await send('events')).status,409);
});
test('Netlify rewrite passes route query and rejects bad payloads and deletion of presets',async()=>{
  const handle=createHandler({...fakeStorage(),controlKey:'1234567890abcdef'});
  const response=await handle(new Request('https://demo.netlify.app/.netlify/functions/api?route=health'));
  assert.equal((await response.json()).ok,true);
  assert.equal((await handle(req('scenes/preset-minimal','DELETE'))).status,403);
  assert.equal((await handle(req('import','POST',{format:'invalid'}))).status,400);
});

test('server-only compiled control verifier authenticates without a runtime environment key',async()=>{
  const key='1234567890abcdef';
  const salt=Buffer.alloc(16,7);
  const controlVerifier={salt:salt.toString('base64'),hash:scryptSync(key,salt,32).toString('base64')};
  const handle=createHandler({...fakeStorage(),controlKey:undefined,controlVerifier});
  assert.equal((await (await handle(req('health'))).json()).controllerConfigured,true);
  assert.equal((await handle(req('auth','POST',null,key))).status,200);
  assert.equal((await handle(req('auth','POST',null,'totally-wrong-key'))).status,401);
  assert.equal((await handle(req('timer','POST',{action:'start'},key))).status,200);
});

test('compiled verifier takes precedence over any stale runtime key',async()=>{
  const salt=Buffer.alloc(16,11);
  const valid='1234567890abcdef';
  const verifier={salt:salt.toString('base64'),hash:scryptSync(valid,salt,32).toString('base64')};
  const handler=createHandler({...fakeStorage(),controlKey:'stale-runtime-key-123',controlVerifier:verifier});
  assert.equal((await handler(req('auth','POST',null,valid))).status,200);
  assert.equal((await handler(req('auth','POST',null,'stale-runtime-key-123'))).status,401);
});
