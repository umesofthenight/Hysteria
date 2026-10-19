import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,dirname,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(project,'_site');
const {basePath}=JSON.parse(readFileSync(resolve(project,'build-info.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.ttf':'font/ttf','.xml':'application/xml','.txt':'text/plain'};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(basePath&&pathname===basePath){res.writeHead(302,{Location:basePath+'/'});return res.end();}
  if(basePath&&!pathname.startsWith(basePath+'/'))throw Error('Outside site');
  let file=resolve(root,'.'+(pathname.slice(basePath.length)||'/'));
  if(file!==root&&!file.startsWith(root+sep))throw Error('Outside site');
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content);
 }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(resolve(root,'404.html')));}
}).listen(4173,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:4173${basePath}/`));
