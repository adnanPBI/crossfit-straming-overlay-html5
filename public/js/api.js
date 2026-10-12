export class Api {
  constructor(){this.key=sessionStorage.getItem('wod-control-key')||'';}
  async request(url,options={}){
    const headers={...(options.body?{'Content-Type':'application/json'}:{}),...(this.key?{'X-Overlay-Key':this.key}:{})};
    let response;
    try{response=await fetch(url,{...options,headers,cache:'no-store'});}catch{throw new Error('Cannot reach local overlay server');}
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const err=new Error(data.error||`HTTP ${response.status}`);err.status=response.status;throw err;}
    return data;
  }
  async auth(key){this.key=key;await this.request('/api/auth',{method:'POST'});sessionStorage.setItem('wod-control-key',key);}
  getState(){return this.request('/api/state');}
  getScenes(){return this.request('/api/scenes');}
  patch(patch){return this.request('/api/settings',{method:'PATCH',body:JSON.stringify({patch})});}
  timer(action){return this.request('/api/timer',{method:'POST',body:JSON.stringify({action})});}
  scene(name){return this.request('/api/scenes',{method:'POST',body:JSON.stringify({name})});}
  loadScene(id){return this.request('/api/scenes/load',{method:'POST',body:JSON.stringify({id})});}
  deleteScene(id){return this.request(`/api/scenes/${encodeURIComponent(id)}`,{method:'DELETE'});}
  restore(){return this.request('/api/defaults',{method:'POST'});}
  export(){return this.request('/api/export');}
  import(body){return this.request('/api/import',{method:'POST',body:JSON.stringify(body)});}
}
export function beep(frequency=760,duration=0.12,volume=0.7){
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  try{
    const ctx=new Context(),osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,Math.min(0.16,0.16*volume)),ctx.currentTime+0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+duration);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration+0.01);
    osc.onended=()=>void ctx.close();
  }catch(e){console.warn('Audio beep unavailable',e);}
}
