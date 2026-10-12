import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createAppServer} from '../server.mjs';

test('timer finishes automatically and re-starts from zero after end',async()=>{
  const dataDir=await mkdtemp(path.join(os.tmpdir(),'wod-finish-test-'));
  const key='good-control-key-for-tests';
  const app=await createAppServer({host:'127.0.0.1',port:0,dataDir,key});
  const url=`http://127.0.0.1:${app.port}`;
  const mutate=async(path,body,method='POST')=>{
    const res=await fetch(url+path,{method,headers:{'X-Overlay-Key':key,'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal(res.status,200);return res.json();
  };
  try{
    await mutate('/api/settings',{patch:{timerSettings:{mode:'countdown',leadSec:0,durationSec:1,timeCapSec:0}}},'PATCH');
    await mutate('/api/timer',{action:'start'});
    await new Promise(resolve=>setTimeout(resolve,1400));
    let state=await(await fetch(url+'/api/state')).json();
    assert.equal(state.timer.status,'finished');
    await mutate('/api/timer',{action:'start'});
    state=await(await fetch(url+'/api/state')).json();
    assert.equal(state.timer.status,'running');assert.equal(state.timer.elapsedMs,0);
  }finally{await app.close();await rm(dataDir,{recursive:true,force:true});}
});
