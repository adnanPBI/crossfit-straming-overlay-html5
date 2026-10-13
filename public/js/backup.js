/** Portable backup v2: deduplicates embedded logos across up to 20 scenes.
 * v1 import remains supported for existing users. No external dependency. */
const IMAGE_FIELDS=[['left','logoDataUrl'],['right','sponsorDataUrl']];
const MAX_ASSETS=42;

export function createPortableBackup({settings,scenes,activeSceneId}){
  const assets=[];
  const indices=new Map();
  const encode=raw=>{
    const out=structuredClone(raw);
    for(const [zone,field] of IMAGE_FIELDS){
      const value=out?.[zone]?.[field];
      if(typeof value==='string'&&value.startsWith('data:image/')){
        let idx=indices.get(value);
        if(idx===undefined){idx=assets.length;indices.set(value,idx);assets.push(value);}
        out[zone][field]=`asset:${idx}`;
      }
    }
    return out;
  };
  return {
    format:'crossfit-overlay-v2',version:2,
    settings:encode(settings),
    scenes:scenes.map(s=>({...s,settings:encode(s.settings)})),
    activeSceneId,assets
  };
}

export function expandPortableBackup(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid backup payload');
  if(input.format==='crossfit-overlay-v1')return input;
  if(input.format!=='crossfit-overlay-v2'||!Array.isArray(input.assets)||input.assets.length>MAX_ASSETS)throw new Error('Unsupported backup format');
  for(const value of input.assets){
    if(typeof value!=='string'||!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*$/.test(value)||value.length>3_000_000)throw new Error('Invalid backup image asset');
  }
  const decode=raw=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid backup settings');
    const result=structuredClone(raw);
    for(const [zone,field] of IMAGE_FIELDS){
      const value=result?.[zone]?.[field];
      if(typeof value==='string'&&value.startsWith('asset:')){
        if(!/^asset:\d+$/.test(value))throw new Error('Invalid asset reference');
        const num=Number(value.slice(6));
        if(!Number.isSafeInteger(num)||num>=input.assets.length)throw new Error('Unresolved image asset');
        result[zone][field]=input.assets[num];
      }
    }
    return result;
  };
  if(!Array.isArray(input.scenes)||input.scenes.length>20)throw new Error('Invalid backup scenes');
  return {
    format:'crossfit-overlay-v1',settings:decode(input.settings),
    scenes:input.scenes.map(s=>({...s,settings:decode(s.settings)})),
    activeSceneId:input.activeSceneId
  };
}
