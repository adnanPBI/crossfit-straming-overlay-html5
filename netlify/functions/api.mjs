import {getStore} from '@netlify/blobs';
import {createHandler} from '../api-core.mjs';

export default async (request)=>createHandler({
  getStore:()=>getStore({name:'wod-studio-state',consistency:'strong'}),
  controlKey:process.env.OVERLAY_CONTROL_KEY
})(request);
