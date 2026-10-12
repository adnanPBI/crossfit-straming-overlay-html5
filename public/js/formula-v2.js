/** Extended CrossFit sequence grammar adapted from the comparison workspace.
 * No runtime dependencies; bounded expansion (240 phases / 24 hours).
 *  4*(1m+30), 2m + 30 + 1:00, 20/10*8,
 *  (work 40 + rest 20)*8, 1h2m3s, 2m30, 1:00*12.
 */
const MAX_PHASES=240,MAX_SEC=86400,MAX_REPEAT=99;
const LABELS=Object.freeze({
  work:'work',arbeit:'work',effort:'work',lavoro:'work',trabajo:'work',trabalho:'work',travail:'work',
  rest:'rest',pause:'rest',repos:'rest',repouso:'rest',recupero:'rest',descanso:'rest',
  prep:'prepare',vorlauf:'prepare',ready:'prepare',pret:'prepare',pronto:'prepare',preparado:'prepare'
});
export function parseWorkoutFormula(raw){
  const src=String(raw??'');
  if(!src.trim()||src.length>500)throw new Error('Formula must be 1-500 characters');
  let i=0;
  const peek=()=>src[i]||'';
  const skip=()=>{while(/\s/.test(peek())&&i<src.length)i++;};
  const digit=()=>/^[0-9]$/.test(peek());
  const number=()=>{skip();const start=i;while(digit())i++;if(start===i)throw new Error(`Expected number at ${i+1}`);const n=Number(src.slice(start,i));if(!Number.isSafeInteger(n))throw new Error('Number out of range');return n;};
  const unit=(ch)=>({h:3600,m:60,s:1}[ch.toLowerCase()]||0);
  const check=(list)=>{
    if(list.length<1||list.length>MAX_PHASES)throw new Error('Too many intervals (max 240)');
    if(list.reduce((n,p)=>n+p.seconds,0)>MAX_SEC)throw new Error('Sequence exceeds 24 hours');
    return list;
  };
  function duration(){
    const first=number();skip();
    let seconds=first;
    if(peek()===':'){
      i++;const part=number();if(part>=60)throw new Error('Invalid clock seconds');
      seconds=first*60+part;
      if(peek()===':'){i++;const last=number();if(last>=60)throw new Error('Invalid clock seconds');seconds=first*3600+part*60+last;}
    }else if(unit(peek())){
      let lastUnit=peek().toLowerCase();i++;
      seconds=first*unit(lastUnit);
      while(digit()){
        const n=number();
        if(unit(peek())){lastUnit=peek().toLowerCase();seconds+=n*unit(lastUnit);i++;}
        else if(lastUnit==='m'){seconds+=n;break;}
        else if(lastUnit==='h'){seconds+=n*60;lastUnit='m';}
        else throw new Error('Unexpected digits after seconds');
      }
    }
    if(!Number.isFinite(seconds)||seconds<=0||seconds>MAX_SEC)throw new Error('Duration out of range');
    return seconds;
  }
  function factor(){
    skip();
    if(peek()==='('){i++;const parts=expr();skip();if(peek()!==')')throw new Error('Missing closing parenthesis');i++;return parts;}
    let type='sequence';
    const match=/^[A-Za-zÀ-ÿ]+/.exec(src.slice(i));
    if(match){type=LABELS[match[0].toLowerCase()]||'';if(!type)throw new Error(`Unknown phase label at ${i+1}`);i+=match[0].length;}
    return [{type,seconds:duration()}];
  }
  function term(){
    skip();
    // Preserve the original prefix-repeat notation: 4*(...)
    const prefix=/^(\d+)\s*\*/.exec(src.slice(i));
    if(prefix){i+=prefix[0].length;const count=Number(prefix[1]);if(count<1||count>MAX_REPEAT)throw new Error('Repeat count must be 1-99');const list=factor();return check(Array.from({length:count},()=>list).flat());}
    let list=factor();skip();
    if(peek()==='/'){
      i++;const other=factor();
      if(list.length!==1||other.length!==1)throw new Error('Work/rest pair requires two durations');
      list=[{type:'work',seconds:list[0].seconds},{type:'rest',seconds:other[0].seconds}];
    }
    skip();
    if(peek()==='*'||peek()==='×'||(peek().toLowerCase()==='x'&&!/[A-Za-z]/.test(src[i+1]||''))){
      i++;const count=number();if(count<1||count>MAX_REPEAT)throw new Error('Repeat count must be 1-99');
      list=Array.from({length:count},()=>list).flat();
    }
    return check(list);
  }
  function expr(){
    let list=term();skip();
    while(peek()==='+'){i++;list=check(list.concat(term()));skip();}
    return list;
  }
  const result=expr();skip();if(i!==src.length)throw new Error(`Unexpected input at position ${i+1}`);
  return check(result);
}
