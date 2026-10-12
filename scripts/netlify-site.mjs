/** Idempotently look up/create a dedicated Netlify site, using NETLIFY_TOKEN. */
import {appendFileSync} from 'node:fs';
const token=process.env.NETLIFY_TOKEN;
const name=process.env.NETLIFY_SITE_NAME||'wod-studio-1415661536';
if(!token){console.error('NETLIFY_TOKEN repository secret is missing');process.exit(1);}
const base='https://api.netlify.com/api/v1';
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
async function request(path,opts={}){
  const res=await fetch(base+path,{...opts,headers});
  const body=await res.text();let json={};try{json=JSON.parse(body);}catch{}
  return {status:res.status,ok:res.ok,data:json};
}
let site=await request(`/sites/${name}`);
if(site.status===404){
  site=await request('/sites',{method:'POST',body:JSON.stringify({name,force_ssl:true})});
  if(!site.ok){console.error(`Could not create Netlify site: HTTP ${site.status}, ${site.data?.message||'API error'}`);process.exit(1);}
}else if(!site.ok){console.error(`Could not inspect Netlify site: HTTP ${site.status}`);process.exit(1);}
const id=site.data.id,url=site.data.ssl_url||site.data.url||`https://${site.data.name}.netlify.app`;
if(!id||!url){console.error('Netlify returned an incomplete site record');process.exit(1);}
const outputs=`site_id=${id}\nsite_url=${url}\n`;
if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,outputs);
console.log(`Netlify site configured: ${url} (${id})`);
