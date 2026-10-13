import test from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import {createInitialData} from '../public/js/defaults.js';
import {createPortableBackup,expandPortableBackup} from '../public/js/backup.js';
import {createHandler} from '../netlify/api-core.mjs';
import {readFileSync} from 'node:fs';
const originalLogo=`data:image/png;base64,${readFileSync(new URL('../public/sample-logo.png',import.meta.url)).toString('base64')}`;
function storage(){
  const map=new Map();
  return {map,getStore:()=>({
    get:async key=>structuredClone(map.get(key)||null),
    setJSON:async (key,value)=>map.set(key,structuredClone(value)),
    delete:async key=>map.delete(key)
  })};
}
const request=(path,method='GET',body=null,key='1234567890abcdef',qa='')=>new Request('https://test.netlify.app/api/'+path,{
  method,headers:{'x-overlay-key':key,...(qa?{'x-wod-qa-run':qa}:{}),...(body?{'content-type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined
});

test('v2 JSON backup deduplicates duplicate images across multiple scenes',()=>{
  const data=createInitialData();
  data.settings.left.logoDataUrl=originalLogo;
  data.settings.right.sponsorDataUrl=originalLogo;
  data.scenes=Array.from({length:15},(_,i)=>({id:`s-${i}`,name:`Show ${i}`,settings:structuredClone(data.settings)}));
  const compact=createPortableBackup(data);
  assert.equal(compact.assets.length,1);
  assert.equal(compact.scenes[0].settings.left.logoDataUrl,'asset:0');
  assert.equal(compact.scenes[1].settings.right.sponsorDataUrl,'asset:0');
  const restored=expandPortableBackup(compact);
  assert.equal(restored.settings.left.logoDataUrl,originalLogo);
  assert.equal(restored.scenes[13].settings.right.sponsorDataUrl,originalLogo);
  assert.ok(JSON.stringify(compact).length<JSON.stringify(data).length/5);
});

test('v1 legacy backup and malformed v2 references preserve safe import behavior',()=>{
  const legacy={format:'crossfit-overlay-v1',settings:createInitialData().settings,scenes:[],activeSceneId:null};
  assert.equal(expandPortableBackup(legacy),legacy);
  const bad={format:'crossfit-overlay-v2',assets:[],settings:{left:{logoDataUrl:'asset:888'}},scenes:[]};
  assert.throws(()=>expandPortableBackup(bad),/Unresolved image asset/);
});

test('Netlify QA namespace is authenticated, isolated, durable across handler restarts and removable',async()=>{
  const state=storage();const salt=Buffer.alloc(16,8);const key='1234567890abcdef';
  const controlVerifier={salt:salt.toString('base64'),hash:scryptSync(key,salt,32).toString('base64')};
  const handle=()=>createHandler({...state,controlVerifier});
  const send=(handler,path,method='GET',body=null,secret=key,qa='ci-12345678909876-1')=>handler(request(path,method,body,secret,qa));
  const h=handle();
  assert.equal((await send(h,'state','GET',null,'wrong')).status,401);
  assert.equal((await send(h,'state')).status,200);
  let patched=await send(h,'settings','PATCH',{patch:{left:{title:'isolated QA'}}});
  assert.equal(patched.status,200);
  const main=await h(request('state','GET',null,''));
  assert.equal((await main.json()).settings.left.title,'THE DAILY GRIND');
  const scene=await (await send(h,'scenes','POST',{name:'QA Scene'})).json();
  assert.ok(scene.scene.id);
  const afterRestart=await (await send(handle(),'state')).json();
  assert.equal(afterRestart.settings.left.title,'isolated QA');
  assert.ok(afterRestart.scenes.some(x=>x.name==='QA Scene'));
  assert.equal((await send(h,'qa/cleanup','DELETE')).status,200);
  const afterCleanup=await (await send(handle(),'state')).json();
  assert.equal(afterCleanup.settings.left.title,'THE DAILY GRIND');
  assert.equal(state.map.has('current'),false);
});

test('Netlify v2 import and export round-trip with shared logo',async()=>{
  const db=storage(),handle=createHandler({...db,controlKey:'1234567890abcdef'});
  const data=createInitialData();data.settings.left.logoDataUrl=originalLogo;
  data.settings.right.sponsorDataUrl=originalLogo;
  const payload=createPortableBackup(data);
  const response=await handle(request('import','POST',payload));
  assert.equal(response.status,200);
  const backup=await (await handle(request('export'))).json();
  assert.equal(backup.format,'crossfit-overlay-v2');
  assert.equal(backup.assets.length,1);
  const expanded=expandPortableBackup(backup);
  assert.equal(expanded.settings.right.sponsorDataUrl,originalLogo);
});
