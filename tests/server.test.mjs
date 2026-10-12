import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createAppServer} from '../server.mjs';

const key='server-integration-test-key-901';
async function request(base,pathname,body,secret=key,method='POST'){
  const reply=await fetch(`${base}${pathname}`,{method,headers:{...(secret?{'X-Overlay-Key':secret}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  return {status:reply.status,data:await reply.json()};
}

test('HTTP routes, authentication, realtime state, scenes and persistence',async()=>{
  const dataDir=await mkdtemp(path.join(os.tmpdir(),'wod-overlay-test-'));
  let app=await createAppServer({host:'127.0.0.1',port:0,dataDir,key});
  let base=`http://127.0.0.1:${app.port}`;
  try{
    const landing=await fetch(`${base}/control`);
    assert.equal(landing.status,200);assert.match(await landing.text(),/panel-timer/);
    assert.equal((await fetch(`${base}/js/overlay.js`)).status,200);
    assert.equal((await fetch(`${base}/server.mjs`)).status,404);
    let publicState=await (await fetch(`${base}/api/state`)).json();
    assert.equal(publicState.settings.language,'de');
    assert.equal(publicState.timer.status,'idle');
    assert.equal(JSON.stringify(publicState).includes(key),false);
    assert.equal((await request(base,'/api/timer',{action:'start'},'')).status,401);
    assert.equal((await request(base,'/api/auth',null,'bad-key')).status,401);
    assert.equal((await request(base,'/api/auth',null,key)).status,200);
    const patched=await request(base,'/api/settings',{patch:{language:'fr',left:{title:'Nouveau WOD'}}},key,'PATCH');
    assert.equal(patched.status,200);assert.equal(patched.data.settings.left.title,'Nouveau WOD');
    assert.equal(patched.data.settings.language,'fr');
    assert.equal((await request(base,'/api/timer',{action:'start'})).data.timer.status,'running');
    assert.equal((await request(base,'/api/timer',{action:'pause'})).data.timer.status,'paused');
    assert.equal((await request(base,'/api/timer',{action:'reset'})).data.timer.status,'idle');
    const saved=await request(base,'/api/scenes',{name:'Show 1'});
    assert.equal(saved.status,201);assert.ok(saved.data.scene.id);
    const changed=await request(base,'/api/settings',{patch:{left:{title:'Second title'}}},key,'PATCH');
    assert.equal(changed.status,200);
    const loaded=await request(base,'/api/scenes/load',{id:saved.data.scene.id});
    assert.equal(loaded.data.settings.left.title,'Nouveau WOD');
    const exportData=await fetch(`${base}/api/export`,{headers:{'X-Overlay-Key':key}}).then(r=>r.json());
    assert.equal(exportData.format,'crossfit-overlay-v1');
    assert.equal(exportData.scenes.length,3);
    const malicious=await request(base,'/api/settings',{patch:{'__proto__':null,left:{logoDataUrl:'javascript:alert(1)'}}},key,'PATCH');
    assert.equal(malicious.status,400);
    const badFormula=await request(base,'/api/settings',{patch:{timerSettings:{mode:'sequence',formula:'4*(abc)'}}},key,'PATCH');
    assert.equal(badFormula.status,400);
    assert.equal((await request(base,'/api/defaults',{})).data.settings.language,'de');
    assert.equal((await request(base,'/api/import',exportData)).status,200);
    assert.equal((await request(base,`/api/scenes/${saved.data.scene.id}`,null,key,'DELETE')).status,200);
    const persisted=JSON.parse(await readFile(path.join(dataDir,'state.json'),'utf8'));
    assert.equal(persisted.scenes.length,2);
    await app.close();app=null;
    app=await createAppServer({host:'127.0.0.1',port:0,dataDir,key});
    base=`http://127.0.0.1:${app.port}`;
    const after=await (await fetch(`${base}/api/state`)).json();
    assert.equal(after.settings.language,'fr');
    assert.equal(after.scenes.length,2);
    assert.equal((await fetch(`${base}/api/health`)).status,200);
  }finally{if(app)await app.close();await rm(dataDir,{recursive:true,force:true});}
});

test('server events send initial snapshot and changes',async()=>{
  const dataDir=await mkdtemp(path.join(os.tmpdir(),'wod-sse-test-'));
  const app=await createAppServer({host:'127.0.0.1',port:0,dataDir,key});
  const base=`http://127.0.0.1:${app.port}`;
  try{
    const controller=new AbortController();
    const result=await fetch(`${base}/api/events`,{signal:controller.signal});
    assert.equal(result.status,200);
    const reader=result.body.getReader();
    const first=await reader.read();
    assert.match(new TextDecoder().decode(first.value),/event: snapshot/);
    await request(base,'/api/settings',{patch:{right:{coach:'François'}}},key,'PATCH');
    const next=await reader.read();
    assert.match(new TextDecoder().decode(next.value),/François/);
    controller.abort();
  }finally{await app.close();await rm(dataDir,{recursive:true,force:true});}
});
