import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {sourceReferences} from './privacy-source-references.mjs';
import {backstopHosts,validateMentions} from './privacy-backstop.mjs';
import {decodeDataURL,MAX_DOCUMENT_DEPTH} from './privacy-data-resources.mjs';

// Parse every context before applying any allowlist. Navigation and mentions can
// never remove a host from resourceHosts, including inside nested documents.
export function inspectReferences(source,{kind='html',baseURL='https://koltregaskes.github.io/repo-foundry/',decodedData=false}={},depth=0) {
  if(depth>MAX_DOCUMENT_DEPTH)throw Error('Nested documents exceed inspection limit');
  const refs=sourceReferences(source,kind);
  const base=new URL(refs.base??baseURL,baseURL);
  const resourceHosts=new Set(),navigationHosts=new Set(),sweptHosts=new Set(),decodedHosts=new Set();
  function merge(nested){for(const key of ['resourceHosts','navigationHosts','sweptHosts','decodedHosts'])for(const host of nested[key])({resourceHosts,navigationHosts,sweptHosts,decodedHosts})[key].add(host);}
  function reference(value,navigation=false){
    if(typeof value!=='string')throw Error('Invalid reference');
    const clean=value.replace(/[\t\r\n]/g,'').trim();
    if(/^https?:$/i.test(clean))throw Error('Missing network authority');
    const url=new URL(value,base);
    if(url.hostname){
      if(/\$\{|[{}]/.test(url.hostname))throw Error('Dynamic host requires source review');
      (navigation?navigationHosts:resourceHosts).add(url.hostname);
    }
    if(url.protocol==='data:'){
      const document=decodeDataURL(url.href,{resource:true});
      if(document.kind)merge(inspectReferences(document.source,{kind:document.kind,baseURL:base.href,decodedData:true},depth+1));
    }
    if(url.protocol==='javascript:')merge(inspectReferences(decodeURIComponent(url.pathname),{kind:'js',baseURL:base.href,decodedData},depth+1));
    // Browser code can insert literal HTML/CSS fragments via innerHTML/srcdoc.
    if(url.protocol!=='data:'&&/<[a-z][\s\S]*>/i.test(value))merge(inspectReferences(value,{kind:'html',baseURL:base.href,decodedData},depth+1));
  }
  for(const value of refs.values)reference(value);
  for(const value of refs.navigation||[])reference(value,true);
  for(const document of refs.documents||[])merge(inspectReferences(document,{kind:'html',baseURL:base.href,decodedData},depth+1));
  for(const host of backstopHosts(source,{baseURL:base.href,decodedText:refs.decodedText,decodedHosts})){
    sweptHosts.add(host);
    if(decodedData){decodedHosts.add(host);if(['css','js','mjs'].includes(kind))resourceHosts.add(host);}
  }
  return {resourceHosts,navigationHosts,sweptHosts,decodedHosts};
}

export function referencedHosts(source,options={}) {
  const refs=inspectReferences(source,{kind:'url',...options});
  return new Set([...refs.resourceHosts,...refs.navigationHosts]);
}

export async function inspectPrivacyHosts(root) {
  const notice=await fs.readFile(path.join(root,'privacy/index.html'),'utf8');
  const declared=attribute=>new Set([...notice.matchAll(new RegExp('<code\\b[^>]*'+attribute+'="([a-z0-9.-]+)"[^>]*>\\s*\\1\\s*</code>','g'))].map(match=>match[1]));
  const resources=declared('data-privacy-host'),navigation=declared('data-privacy-navigation-host');
  if(!resources.size)throw Error('Notice must visibly list resource hosts');
  const baseURL='https://koltregaskes.github.io/repo-foundry/',own=new URL(baseURL).hostname;
  let mentions=[];
  try{mentions=validateMentions(JSON.parse(await fs.readFile(path.join(root,'privacy-non-request-mentions.json'),'utf8')));}catch(error){if(error.code!=='ENOENT')throw Error('Invalid non-request mention allowlist');}
  const files=[],errors=[],usedMentions=new Set();
  async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){
    if(item.name.startsWith('.'))continue;
    const file=path.join(dir,item.name);
    if(item.isSymbolicLink())throw Error('Unexpected symlink in public output');
    if(item.isDirectory())await walk(file);
    else if(/\.(?:html|css|js|mjs|svg|json|webmanifest)$/i.test(item.name)&&item.name!=='privacy-non-request-mentions.json')files.push(file);
  }}
  await walk(root);
  for(const file of files){
    const relative=path.relative(root,file).split(path.sep).join('/');
    const source=await fs.readFile(file,'utf8');
    try{
      const extension=path.extname(file).slice(1).toLowerCase(),kind=extension==='svg'?'html':extension==='webmanifest'?'json':extension;
      const refs=inspectReferences(source,{kind,baseURL:new URL(relative,baseURL).href});
      for(const host of refs.resourceHosts)if(host!==own&&!resources.has(host))errors.push(relative+': unlisted resource host '+host);
      for(const host of refs.navigationHosts)if(host!==own&&!navigation.has(host)&&!resources.has(host))errors.push(relative+': unlisted navigation host '+host);
      for(const host of refs.sweptHosts){
        if(host===own||resources.has(host)||navigation.has(host))continue;
        const mention=mentions.find(entry=>entry.file===relative&&entry.host===host);
        if(mention&&!refs.resourceHosts.has(host)&&!refs.navigationHosts.has(host)&&!refs.decodedHosts.has(host))usedMentions.add(mention);
        else if(!refs.resourceHosts.has(host)&&!refs.navigationHosts.has(host))errors.push(relative+': backstop found unlisted host '+host);
      }
      for(const mention of mentions.filter(entry=>entry.file===relative))if(refs.resourceHosts.has(mention.host)||refs.navigationHosts.has(mention.host)||refs.decodedHosts.has(mention.host))errors.push(relative+': active non-request mention entry');
    }catch{errors.push(relative+': cannot parse complete public references');}
    if(file.endsWith('.html')&&!/<footer\b[\s\S]*?<a\b[^>]*href="privacy\/"[^>]*>Privacy notice<\/a>[\s\S]*?<\/footer>/i.test(source))errors.push(relative+': missing privacy footer link');
  }
  for(const mention of mentions)if(!usedMentions.has(mention))errors.push(mention.file+': unused or active non-request mention entry');
  return {files:files.length,resourceHosts:resources.size,navigationHosts:navigation.size,errors};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{const result=await inspectPrivacyHosts(path.resolve(process.argv[2]||'dist/public'));console.log(`Privacy host check: ${result.files} files, ${result.resourceHosts} resource hosts, ${result.navigationHosts} navigation hosts, ${result.errors.length} failures`);if(result.errors.length){console.error(result.errors.join('\n'));process.exitCode=1;}}
  catch{console.error('Privacy host check failed: cannot inspect complete references');process.exitCode=1;}
}
