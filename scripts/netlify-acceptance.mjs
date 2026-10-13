/** Production-safe E2E acceptance. Uses isolated authenticated QA Blob namespace.
 * Modes: seed before a second deploy; verify after the deploy (and clean up).
 * No real customer 'current' state is ever modified.
 */
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const base=process.env.SITE_URL;
const secret=process.env.CONTROL_KEY;
const qa=process.env.WOD_QA_RUN;
const mode=process.argv[2];
if(!/^https:\/\//.test(base||'')||!secret||!/^ci-[a-z0-9-]{12,40}$/.test(qa||'')||!['seed','verify'].includes(mode))throw Error('Missing acceptance configuration');
const expectedTitle=`WOD-QA-${qa}`;
const image=`data:image/png;base64,${readFileSync(new URL('../public/sample-logo.png',import.meta.url)).toString('base64')}`;
const headers={'X-Overlay-Key':secret,'X-Wod-QA-Run':qa};
async function api(route,method='GET',data){
  const r=await fetch(`${base}/api/${route}`,{method,headers:{...headers,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,cache:'no-store'});
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(`QA endpoint ${route}: HTTP ${r.status}: ${body.error||''}`);
  return body;
}
async function cleanup(){
  const r=await fetch(`${base}/api/qa/cleanup`,{method:'DELETE',headers});
  if(!r.ok)throw Error('Failed to clean up isolated QA state');
}
try{
  if(mode==='seed'){
    // Idempotent test namespace: never touch public 'current'.
    await cleanup();
    const before=await api('state');
    if(before.scenes.length<3)throw Error('Default scene seed missing');
    await api('settings','PATCH',{patch:{
      language:'fr',left:{title:expectedTitle,logoDataUrl:image},right:{showSponsor:true,sponsorDataUrl:image},
      timerSettings:{mode:'countdown',durationSec:75,leadSec:0}
    }});
    const saved=await api('scenes','POST',{name:expectedTitle});
    if(!saved.scene?.id)throw Error('Scene save failed');
    const backup=await api('export');
    if(backup.format!=='crossfit-overlay-v2'||backup.assets?.length!==1)throw Error('Logo deduplication failed');
    await api('import','POST',backup);
    const after=await api('state');
    if(after.settings.left.title!==expectedTitle||after.settings.language!=='fr')throw Error('Backup restoration failed');
    if(!after.scenes.some(x=>x.name===expectedTitle))throw Error('Scene lost on import');
    await api('timer','POST',{action:'start'});
    const started=await api('state');
    if(started.timer.status!=='running')throw Error('Timer start failed');
    await api('timer','POST',{action:'pause'});
    if((await api('state')).timer.status!=='paused')throw Error('Timer pause failed');
    await api('timer','POST',{action:'reset'});
    if((await api('state')).timer.status!=='idle')throw Error('Timer reset failed');
    // Separate fetches simulate independent browsers; next step proves redeploy survival.
    console.log('Isolated production scene, timer, logo and v2 backup seed verified.');
  }else{
    const after=await api('state');
    if(after.settings.left.title!==expectedTitle||after.settings.language!=='fr')throw Error('Lost settings across production redeploy');
    if(!after.scenes.some(x=>x.name===expectedTitle))throw Error('Lost scene across production redeploy');
    const backup=await api('export');
    if(backup.assets.length!==1||backup.settings.left.logoDataUrl!=='asset:0')throw Error('Logo not preserved across redeploy');
    if(backup.settings.right.sponsorDataUrl!=='asset:0')throw Error('Sponsor backup not preserved');
    const scene=after.scenes.find(x=>x.name===expectedTitle);
    await api('scenes/load','POST',{id:scene.id});
    if((await api('state')).settings.left.title!==expectedTitle)throw Error('Scene load failed after redeploy');
    await api(`scenes/${encodeURIComponent(scene.id)}`,'DELETE');
    await cleanup();
    console.log('Production Blob survived redeploy, scene load, logo backup, and cleanup verified.');
  }
}catch(e){
  console.error('Production acceptance failed:',e.message);
  if(mode==='verify')try{await cleanup();}catch{}
  process.exitCode=1;
}
