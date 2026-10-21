// Deployment check: only an isolated, newly generated health record is created and removed.
import { randomUUID } from 'node:crypto';
import { put, get, del } from '@vercel/blob';
const privateToken=process.env.SHOWCASE_LETTERS_BLOB_READ_WRITE_TOKEN;
const token=privateToken||process.env.BLOB_READ_WRITE_TOKEN;
if(!token)throw new Error('Letter wall storage is not configured');
const access=privateToken?'private':'public';
const id=randomUUID(),path=`showcase/2026/health-check/${id}.json`;
let created=false;
try{
 await put(path,JSON.stringify({check:id}),{access,token,contentType:'application/json',addRandomSuffix:false,allowOverwrite:false});created=true;
 const result=await get(path,{access,token,useCache:false});
 if(result?.statusCode!==200||!result.stream)throw new Error('Letter storage read failed');
 if((await new Response(result.stream).json()).check!==id)throw new Error('Letter storage verification failed');
 console.log('Letter storage write/read verified.');
}finally{if(created){await del(path,{token});console.log('Isolated health record removed.');}}
