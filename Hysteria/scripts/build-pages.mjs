import {readFileSync,writeFileSync,readdirSync,mkdirSync,rmSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join,dirname,extname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=join(project,'site'),output=join(project,'_site');
const target=new URL(process.argv[2]||process.env.PAGES_BASE_URL||'http://127.0.0.1:4173');
if(!['http:','https:'].includes(target.protocol)||target.username||target.password||target.search||target.hash)throw Error('Supply a plain http or https website URL.');
const basePath=target.pathname.replace(/\/+$/,''),siteURL=target.origin+basePath;
const previousOrigin='https://hysteria-beyond-the-veil.umesofthenight.chatgpt.site';
if(!existsSync(join(source,'index.html')))throw Error('The site folder is missing.');
// The only recursive removal target is this project's generated output folder.
if(output!==resolve(project,'_site')||dirname(output)!==project)throw Error('Invalid output folder.');
rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
const textTypes=new Set(['.html','.css','.js','.json','.xml','.txt','.svg']);
let count=0;
function copy(directory){
 for(const entry of readdirSync(directory,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlinks are not supported.');
  const input=join(directory,entry.name),destination=join(output,relative(source,input));
  if(entry.isDirectory()){mkdirSync(destination,{recursive:true});copy(input);continue;}
  if(entry.name.endsWith('.md')||entry.name==='.DS_Store')continue;
  if(textTypes.has(extname(entry.name))){
   let text=readFileSync(input,'utf8').replaceAll(previousOrigin,siteURL);
   if(extname(entry.name)==='.html')text=text.replace(/\b(href|src|action)="\/(?!\/)([^"]*)"/g,(_,attribute,path)=>`${attribute}="${basePath}/${path}"`);
   if(extname(entry.name)==='.css')text=text.replace(/url\((['"]?)\/(?!\/)([^)'"\s]+)\1\)/g,(_,quote,path)=>`url(${quote}${basePath}/${path}${quote})`);
   if(extname(entry.name)==='.js')text=text.replace(/(['"`])\/(?!\/)([^'"`\r\n]*)\1/g,(_,quote,path)=>`${quote}${basePath}/${path}${quote}`);
   writeFileSync(destination,text);
  }else copyFileSync(input,destination);
  count++;
 }
}
copy(source);
writeFileSync(join(output,'.nojekyll'),'');
writeFileSync(join(project,'build-info.json'),JSON.stringify({siteURL,basePath},null,2));
console.log(`Built ${count} files for ${siteURL}/ in _site/`);
