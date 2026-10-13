/** Generate a non-reversible verifier for the Netlify Function bundle in CI.
 * The plaintext control password must never be written into source or logs.
 */
import {randomBytes,scryptSync} from 'node:crypto';
import {writeFileSync} from 'node:fs';

const key=process.env.CONTROL_KEY;
if(typeof key!=='string'||key.length<12||Buffer.byteLength(key)>256){
  console.error('A control key of 12 to 256 bytes is required.');
  process.exit(1);
}
const salt=randomBytes(16);
const verifier={salt:salt.toString('base64'),hash:scryptSync(key,salt,32).toString('base64')};
const destination=new URL('../netlify/control-verifier.generated.mjs',import.meta.url);
writeFileSync(destination,'// Generated during CI. NEVER commit this file.\nexport const controlVerifier = '+JSON.stringify(verifier)+';\n',{encoding:'utf8',mode:0o600});
console.log('Prepared server-only salted controller verifier.');
