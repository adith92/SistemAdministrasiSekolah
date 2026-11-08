import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Public *demo* for SaSappSekolah. Intentionally no login/password and NO write API.
// This is NOT suitable for real student records or real school payments.
const staticRoot = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
function json(res, status, data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
const handler=async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'This public demo is read-only on the server. Changes stay in your browser.'});
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return json(res,400,{error:'Invalid URL.'});}
  if(pathname==='/health'||pathname==='/api/health')return json(res,200,{ok:true,name:'SaSappSekolah'});
  if(pathname==='/api/status')return json(res,200,{name:'SaSappSekolah',mode:'public-demo',hosting:'render',databaseConnected:false,persistence:'browser-local',loginRequired:false,realSchoolRecords:false});
  if(pathname.startsWith('/api/'))return json(res,404,{error:'Endpoint not available in public demo.'});
  if(pathname==='/')pathname='/index.html';
  if(pathname.includes('..')||pathname.includes('\\')||pathname.includes('\0'))return json(res,404,{error:'Not found.'});
  const file=resolve(staticRoot, `.${pathname}`);
  if(!file.startsWith(staticRoot+sep))return json(res,404,{error:'Not found.'});
  try{
    const info=await stat(file);
    if(!info.isFile())return json(res,404,{error:'Not found.'});
    const ext=extname(file);
    res.setHeader('Content-Type',mime[ext]||'application/octet-stream');
    // Branding-only substitutions. Deliberately do not inject the remote-persistence flag.
    if(['index.html','app.mjs','core.mjs'].some(n=>pathname==='/'+n)){
      const content=(await readFile(file,'utf8')).replaceAll('SASapps','SaSappSekolah');
      return res.end(req.method==='HEAD'?'':content);
    }
    res.setHeader('Content-Length',info.size);
    if(req.method==='HEAD')return res.end();
    createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch{return json(res,404,{error:'Not found.'});}
};
const port=Number(process.env.PORT||10000);
const server=createServer((req,res)=>{Promise.resolve(handler(req,res)).catch(()=>{if(!res.headersSent)json(res,500,{error:'Internal server error.'});else res.destroy();});});
server.listen(port,'0.0.0.0',()=>console.log('SaSappSekolah public demo listening on '+port));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
