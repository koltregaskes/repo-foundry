import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectReferences,inspectPrivacyHosts,referencedHosts} from '../scripts/check-privacy-hosts.mjs';
import {validateHtmlHelperOutput,sourceReferences,jsReferences,cssReferences} from '../scripts/privacy-source-references.mjs';
import {backstopHosts,validateMentions} from '../scripts/privacy-backstop.mjs';
import {decodeDataURL,MAX_DOCUMENT_DEPTH} from '../scripts/privacy-data-resources.mjs';
const footer='<footer><a href="privacy/">Privacy notice</a></footer>';
const attr=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
async function fixture(source,file='page.html',mentions){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'rf-privacy-'));
 await fs.mkdir(path.join(root,'privacy'));
 await fs.writeFile(path.join(root,'privacy/index.html'),'<code data-privacy-host="fonts.gstatic.com">fonts.gstatic.com</code><code data-privacy-navigation-host="github.com">github.com</code>'+footer);
 await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await fs.writeFile(path.join(root,file),source+(file.endsWith('.html')?footer:''));
 if(mentions)await fs.writeFile(path.join(root,'privacy-non-request-mentions.json'),JSON.stringify({version:1,mentions}));
 return root;
}
test('real built output has declared hosts and privacy links',async()=>{
 // CI runs npm test before any build, and dist/ is ignored: build the public output here when it is missing.
 try{await fs.access('dist/public/privacy/index.html');}catch{
  const built=spawnSync(process.execPath,['scripts/build-public.mjs','--allow-stale-routed-news-for-boundary-scan'],{encoding:'utf8'});
  assert.equal(built.status,0,built.stderr||built.stdout);
 }
 const result=await inspectPrivacyHosts('dist/public');assert.deepEqual(result.errors,[]);assert.equal(result.resourceHosts,2);
 const notice=await fs.readFile('dist/public/privacy/index.html','utf8');
 for(const word of ['GitHub Pages','Cloudflare','proposal only','fonts.googleapis.com','fonts.gstatic.com','GitHub avatars','foundry.skin','foundry.accent','no service worker','not active','UK GDPR','ICO','2026-11-16','hello@koltregaskes.com'])assert.ok(notice.includes(word),word);
 for(const file of ['sitemap.xml','llms.txt'])assert.match(await fs.readFile('dist/public/'+file,'utf8'),/\/privacy\//);
 assert.match(await fs.readFile('dist/public/sitemap.xml','utf8'),/<loc>https:\/\/koltregaskes.github.io\/repo-foundry\/privacy\/<\/loc><lastmod>2026-11-16<\/lastmod>/);
 for(const file of ['shell.js','public-app.js'])assert.doesNotMatch(await fs.readFile('dist/public/assets/'+file,'utf8'),/serviceWorker|caches\.(?:keys|delete)|sendBeacon|\bfetch\s*\(/);
});
for(const [label,render] of [
 ['img',u=>`<img src="${attr(u)}">`],['SVG image',u=>`<svg><image href="${attr(u)}"/></svg>`],
 ['icon',u=>`<link rel="icon" href="${attr(u)}">`],['preload',u=>`<link rel="preload" href="${attr(u)}">`],
 ['modulepreload',u=>`<link rel="modulepreload" href="${attr(u)}">`],['manifest',u=>`<link rel="manifest" href="${attr(u)}">`],
 ['ping',u=>`<a href="https://github.com/" ping="${attr(u)}">Link</a>`],
 ['srcset',u=>`<img srcset="${attr(u)} 1x">`],['style',u=>`<style>a{background:url("${u}")}</style>`],
 ])test('navigation host cannot authorise resource: '+label,async()=>{
 const root=await fixture(render('https://github.com/pixel'));
 assert.ok((await inspectPrivacyHosts(root)).errors.some(e=>e.includes('unlisted resource host github.com')));
});
test('ordinary permitted navigation and declared resource loads pass',async()=>{
 assert.deepEqual((await inspectPrivacyHosts(await fixture('<a href="https://github.com/a/b">Repo</a><img src="https://fonts.gstatic.com/f">'))).errors,[]);
});
for(const value of ['https://fonts.gstatic.com;@evil.invalid/a','https://fonts.gstatic.com,@evil.invalid/a','HTTPS://reader@EVIL.INVALID:443?x=1','//evil.invalid#x','https://%65vil.invalid/x','https:\\\\evil.invalid/a','\u0000 \tht\ntps://evil.invalid/x','https://bücher.invalid/a'])test('WHATWG complete reference rejects authority disguise '+JSON.stringify(value),()=>{
 const expected=new URL(value,'https://local.invalid/').hostname;
 assert.ok(referencedHosts(value).has(expected));
});
for(const separator of [';',','])for(const marker of ['url=','URL = ',''])test('complete meta refresh with '+separator+' '+marker,async()=>{
 const root=await fixture(`<meta http-equiv="refresh" content="0${separator} ${marker}https://github.com/pixel">`);
 assert.ok((await inspectPrivacyHosts(root)).errors.some(e=>e.includes('unlisted resource host github.com')));
});
test('unsupported refresh syntax fails closed before mention exceptions',async()=>{
 const mention={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Synthetic prose'};
 const root=await fixture('<meta http-equiv="refresh" content="0;;https://evil.invalid/x">','page.html',[mention]);
 assert.ok((await inspectPrivacyHosts(root)).errors.some(e=>e.includes('cannot parse')));
});
for(const source of [
 '<iframe srcdoc="&lt;img src=&quot;https://github.com/pixel&quot;&gt;"></iframe>',
 '<iframe src="data:text/html,%3Cimg%20src%3D%22https%3A%2F%2Fgithub.com%2Fpixel%22%3E"></iframe>',
 '<object data="data:image/svg+xml,%3Csvg%3E%3Cimage%20href%3D%22https%3A%2F%2Fgithub.com%2Fpixel%22%2F%3E%3C%2Fsvg%3E"></object>',
 '<iframe src="data:text/html;base64,'+Buffer.from('<img src="https://github.com/pixel">').toString('base64')+'"></iframe>',
 '<style>a{background:image-set("https://github.com/pixel" 1x,url(/local) 2x)}</style>',
 '<script>const x=`ok ${fetch("https://github.com/pixel")}`;</script>',
 '<script>const x="<img src=\\"https://github.com/pixel\\">";</script>',
 '<script src="data:text/javascript,fetch(%22https%3A%2F%2Fgithub.com%2Fpixel%22)"></script>',
 ])test('nested or encoded active resource keeps resource permission '+source.slice(0,38),async()=>{
 const result=await inspectPrivacyHosts(await fixture(source));
 // Script data URLs now fail at the loading boundary, before MIME decoding.
 if(source.startsWith('<script src="data:'))assert.ok(result.errors.some(e=>e.includes('cannot parse complete public references')));
 else assert.ok(result.errors.some(e=>e.includes('unlisted resource host github.com')));
});
test('JSON-LD links do not allow JSON image resource fields',async()=>{
 const source='<script type="application/ld+json">{"url":"https://github.com/a","image":"https://github.com/pixel"}</script>';
 assert.ok((await inspectPrivacyHosts(await fixture(source))).errors.some(e=>e.includes('unlisted resource host github.com')));
});
test('an import-map module named url still needs resource permission',async()=>{
 const source='<script type="importmap">{"imports":{"url":"https://github.com/module.js"}}</script>';
 assert.ok((await inspectPrivacyHosts(await fixture(source))).errors.some(e=>e.includes('unlisted resource host github.com')));
});
test('backstop catches schemes after punctuation and preserves original scheme views',()=>{
 assert.ok(backstopHosts('/* marker:https://evil.invalid/a */').has('evil.invalid'));
 assert.ok(backstopHosts('/* +https://evil.invalid/a */').size===0);
 assert.ok(backstopHosts(String.raw`/* https:\/\/evil.invalid/x */`).has('evil.invalid'));
});
test('HTML5 entities, srcset comma userinfo, image-set and template expressions extract fully',()=>{
 assert.ok(referencedHosts('<img src="https&colon;&sol;&sol;evil.invalid/a">',{kind:'html'}).has('evil.invalid'));
 assert.ok(referencedHosts('<img srcset="https://fonts.gstatic.com,@evil.invalid/a 1x">',{kind:'html'}).has('evil.invalid'));
 assert.deepEqual(cssReferences('a{background:image-set("https://evil.invalid/a" 1x)}'),['https://evil.invalid/a']);
 assert.ok(jsReferences('const s=`${fetch("https://evil.invalid/a")}`').includes('https://evil.invalid/a'));
});
test('a mention exception can cover prose only, never an active resource or redirect',async()=>{
 const mention={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Synthetic prose in a comment'};
 assert.deepEqual((await inspectPrivacyHosts(await fixture('<!-- https://evil.invalid/prose -->','page.html',[mention]))).errors,[]);
 for(const active of ['<img src="https://evil.invalid/pixel">','<meta http-equiv="refresh" content="0, https://evil.invalid/">'])assert.ok((await inspectPrivacyHosts(await fixture(active,'page.html',[mention]))).errors.length>0);
});
test('invalid and unused mention declarations fail',async()=>{
 assert.throws(()=>validateMentions({version:1,mentions:[{host:'evil.invalid'}]}));
 const entry={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Test'};
 assert.throws(()=>validateMentions({version:1,mentions:[entry,entry]}));
 assert.ok((await inspectPrivacyHosts(await fixture('<p>Nothing</p>','page.html',[entry]))).errors.length>0);
});
for(const helper of [null,{}, {base:null,references:[],decodedText:'' ,extra:1},{base:null,references:[{kind:'url',value:3}],decodedText:'x'},{base:null,references:[{kind:'unknown',value:'x'}],decodedText:'x'}])test('helper output shape fails closed '+JSON.stringify(helper),()=>assert.throws(()=>validateHtmlHelperOutput(helper)));
test('malformed data documents and reference parsing fail closed',()=>{
 for(const source of ['<iframe src="data:text/html;base64,!!!">','<img src="https://evil.invalid:wrong/">','<iframe src="data:text/html,%FF">','<script>fetch("https://github.com/pixel")'])assert.throws(()=>inspectReferences(source));
});
test('CLI rejects an undeclared host without disclosing full URL or userinfo',async()=>{
 const root=await fixture('<img src="https://fixture-user:fixture-value@evil.invalid/pixel">');
 const checker=fileURLToPath(new URL('../scripts/check-privacy-hosts.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[checker,root],{encoding:'utf8'});assert.equal(result.status,1);assert.doesNotMatch(result.stdout+result.stderr,/fixture-user|fixture-value|https:\/\//);
});

// Exact HTML examples from Ghost's GUARD-PARITY.md, including the later MIME,
// script-element and XML namespace additions. Preserve RF's original cases.
const parity=JSON.parse(await fs.readFile(new URL('./fixtures/privacy-guard-parity.json',import.meta.url),'utf8'));
for(const row of parity)test('portable guard parity '+row.id,async()=>{
 if(row.expected==='rejected')assert.throws(()=>inspectReferences(row.source));
 else {
  let refs;
  try{refs=inspectReferences(row.source);}catch(error){if(row.expected!=='reject-or-resource')throw error;}
  if(refs)assert.ok(refs.resourceHosts.has('github.com'));
 }
 assert.ok((await inspectPrivacyHosts(await fixture(row.source))).errors.length>0,'the real checker must reject the undisclosed load or unsupported input');
 const hostile=row.source.replaceAll('github.com','evil.invalid').replaceAll('x.com','evil.invalid');
 const mention={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Regression: cannot exempt an active reference.'};
 assert.ok((await inspectPrivacyHosts(await fixture(hostile,'page.html',[mention]))).errors.length>0);
});
const data=(mime,body,b64=false)=>`data:${mime}${b64?';base64':''},${b64?Buffer.from(body).toString('base64'):encodeURIComponent(body)}`;
const aliases=['application/ecmascript','application/javascript','application/x-ecmascript','application/x-javascript','text/ecmascript','text/javascript','text/javascript1.0','text/javascript1.1','text/javascript1.2','text/javascript1.3','text/javascript1.4','text/javascript1.5','text/jscript','text/livescript','text/x-ecmascript','text/x-javascript'];
for(const mime of aliases)test('browser JS MIME alias '+mime,async()=>{
 for(const b64 of [false,true]){
  const url=data(' '+mime.toUpperCase()+' ;charset=utf-8',"fetch('https://github.com/pixel')",b64);
  const source=`<script type="module">import(${JSON.stringify(url)})</script>`;
  assert.ok(inspectReferences(source).resourceHosts.has('github.com'));
  assert.ok((await inspectPrivacyHosts(await fixture(source))).errors.some(e=>e.includes('unlisted resource host github.com')));
 }
});
for(const mime of ['text/css','TEXT/CSS',' text/css ;charset=utf-8','text/css\t;charset="UTF-8"'])test('browser CSS MIME syntax '+JSON.stringify(mime),async()=>{
 for(const b64 of [false,true]){
  const source=`<link rel="stylesheet" href="${attr(data(mime,'@import url(https://github.com/a.css);',b64))}">`;
  assert.ok(inspectReferences(source).resourceHosts.has('github.com'));
  assert.ok((await inspectPrivacyHosts(await fixture(source))).errors.some(e=>e.includes('unlisted resource host github.com')));
 }
});
for(const tag of ['script','style','title','desc','foreignObject','mi','mo','mn','ms','mtext','annotation-xml','noscript','template','textarea','xmp','iframe','noembed','noframes','plaintext'])test('foreign-content parser context '+tag,()=>{
 for(const root of ['svg','math','s:svg'])assert.throws(()=>inspectReferences(`<${root}><${tag}><img src="https://github.com/pixel"></${tag}></${root}>`));
});
for(const target of ['href','HREF','xlink:href','XLINK:HREF','custom:HrEf'])for(const tag of ['set','animate','animateColor','animateTransform','animateMotion'])test('SMIL rejects '+tag+' '+target,()=>{
 for(const attribute of ['to','from','by','values'])assert.throws(()=>inspectReferences(`<svg><image href="/local"><${tag} attributeName="${target}" ${attribute}="https://github.com/pixel"/></image></svg>`));
});
for(const mime of [...aliases,'text/css','text/plain','application/unknown',''])test('script data loading boundary '+(mime||'omitted MIME'),()=>{
 for(const tag of ['script','SCRIPT','svg:script'])for(const attribute of ['src','href','xlink:href','x:href']){
  const source=`<${tag} ${attribute}="${data(mime,"fetch('https://github.com/pixel')",true)}"></${tag}>`;
  assert.throws(()=>inspectReferences(source));
  assert.throws(()=>inspectReferences(`<iframe srcdoc="${attr(source)}"></iframe>`));
 }
});
test('script data rejection covers SVG XML aliases and URL whitespace',()=>{
 const xml='<s:svg xmlns:s="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/1999/xlink"><s:script x:href="'+data('text/plain',"fetch('https://github.com/pixel')",true)+'"/></s:svg>';
 assert.throws(()=>inspectReferences(`<iframe src="${data('image/svg+xml',xml,true)}"></iframe>`));
 assert.throws(()=>inspectReferences('<script src=" &#9;d&#97;ta&colon;text/plain,fetch(1)"></script>'));
 assert.throws(()=>inspectReferences('<script href="da&#10;ta:,fetch(1)"></script>'));
});
for(const [mime,body] of [['text/css','/* x_https://evil.invalid/a */'],['text/javascript','// x_https://evil.invalid/a'],['text/html','<!-- x_https://evil.invalid/a -->']])test('decoded '+mime+' backstop cannot inherit a mention',async()=>{
 const source=`<iframe src="${data(mime,body,true)}"></iframe>`;
 const refs=inspectReferences(source);assert.ok(refs.decodedHosts.has('evil.invalid'));
 if(mime!=='text/html')assert.ok(refs.resourceHosts.has('evil.invalid'));
 const mention={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Regression: decoded backstop is not an inert exemption.'};
 assert.ok((await inspectPrivacyHosts(await fixture(source,'page.html',[mention]))).errors.some(e=>e.includes('active non-request mention')));
});
test('data bodies retain provenance even outside recognised references',async()=>{
 const source='<!-- '+data('text/plain','x_https://evil.invalid/a',true)+' -->';
 assert.ok(inspectReferences(source).decodedHosts.has('evil.invalid'));
 const mention={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Regression data body.'};
 assert.ok((await inspectPrivacyHosts(await fixture(source,'page.html',[mention]))).errors.some(e=>e.includes('active non-request mention')));
});
test('backstop MIME whitespace and quoted charsets cannot hide data provenance',async()=>{
 const mention={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Regression: padded data header is not an exemption.'};
 for(const mime of [' text/css ;charset=utf-8','TEXT/ECMASCRIPT ;charset="UTF-8"',' text/css\t;charset="us-ascii"']){
  const source='<!-- https://evil.invalid/prose '+data(mime,'/* x_https://evil.invalid/pixel */',true)+' -->';
  assert.ok(inspectReferences(source).decodedHosts.has('evil.invalid'));
  assert.ok((await inspectPrivacyHosts(await fixture(source,'page.html',[mention]))).errors.some(e=>e.includes('active non-request mention')));
 }
});
test('nested data CSS/JS and import forms preserve resource roles',()=>{
 const css=data(' text/css ;charset=utf-8','@import "'+data('text/css','a{background:url(https://github.com/pixel)}',true)+'";',true);
 assert.ok(inspectReferences(`<iframe src="${data('text/html','<link rel="stylesheet" href="'+css+'">',true)}"></iframe>`).resourceHosts.has('github.com'));
 const js=data('text/x-ecmascript',"fetch('https://github.com/pixel')",true);
 for(const source of [`import(/* comment */ ${JSON.stringify(js)})`,`import ${JSON.stringify(js)}`,`import * as item from ${JSON.stringify(js)}`,`export * from ${JSON.stringify(js)}`])assert.ok(inspectReferences(source,{kind:'js'}).resourceHosts.has('github.com'));
 const leading=' \t'+data('text/css','/* <b> */ @import "https://github.com/pixel";');
 assert.ok(inspectReferences(`<link rel="stylesheet" href="${attr(leading)}">`).resourceHosts.has('github.com'));
});
for(const [kind,url] of [
 ['js',"data:text/javascript,1?fetch('https://github.com/pixel'):0"],
 ['css','data:text/css,/*?*/a{background:url(https://github.com/pixel)}'],
 ['html','data:text/html,?<img src="https://github.com/pixel">'],
])test('data '+kind+' query is payload, not a discarded URL component',async()=>{
 const source=kind==='js'?`<script type="module">import(${JSON.stringify(url)})</script>`:kind==='css'?`<link rel="stylesheet" href="${attr(url)}">`:`<iframe src="${attr(url)}"></iframe>`;
 assert.ok(decodeDataURL(url,{resource:true}).source.includes('?'));
 assert.ok(inspectReferences(source).resourceHosts.has('github.com'));
 assert.ok((await inspectPrivacyHosts(await fixture(source))).errors.some(e=>e.includes('unlisted resource host github.com')));
 const hostile=source.replaceAll('github.com','evil.invalid');
 const mention={kind:'non-request mention',file:'page.html',host:'evil.invalid',reason:'Regression: data query bytes are active.'};
 assert.ok(inspectReferences(hostile).resourceHosts.has('evil.invalid'));
 assert.ok((await inspectPrivacyHosts(await fixture(hostile,'page.html',[mention]))).errors.some(e=>e.includes('active non-request mention')));
});
test('data query decode errors fail closed while fragments remain excluded',()=>{
 assert.throws(()=>inspectReferences('data:text/css,a?%GG',{kind:'url'}));
 assert.equal(decodeDataURL('data:text/css,a%7Bcolor:red%7D#%GG').source,'a{color:red}');
});
for(const url of ['data:text/css,%GG','data:text/css,%ff','data:text/javascript;base64,@@@','data:text/jscript,%00','data:text/css;charset=iso-8859-1,a{}','data:text/css,@charset%20%22utf-16%22;','data:application/xhtml+xml,<html/>','data:application/xml,<x/>','data:text/plain,fetch(1)','data:application/unknown,anything','data:,fetch(1)'])test('unsupported data resource fails closed '+url,()=>assert.throws(()=>inspectReferences(url,{kind:'url'})));
test('Unicode MIME whitespace cannot create an opaque MIME allowance',()=>{
 for(const type of ['image/png\u00a0','font/woff2\u2028','\u00a0text/javascript'])assert.throws(()=>inspectReferences(data(type,"fetch('https://github.com/pixel')"),{kind:'url'}));
});
test('recursive data resources enforce the shared depth limit',()=>{
 let url=data('text/css','a{color:red}');
 for(let depth=0;depth<=MAX_DOCUMENT_DEPTH;depth++)url=data('text/css',`@import "${url}";`,true);
 assert.throws(()=>inspectReferences(url,{kind:'url'}));
});
test('ordinary SVG, non-URL animation, JSON data and fragments remain supported',()=>{
 assert.ok(inspectReferences('<s:svg xmlns:s="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/1999/xlink"><s:image x:href="https://fonts.gstatic.com/a"/></s:svg>').resourceHosts.has('fonts.gstatic.com'));
 assert.doesNotThrow(()=>inspectReferences('<svg><animate attributeName="fill" to="red"/></svg>'));
 const json=inspectReferences(data('application/json',JSON.stringify({url:'https://github.com/a',image:'https://fonts.gstatic.com/a'})),{kind:'url'});
 assert.ok(json.navigationHosts.has('github.com'));assert.ok(json.resourceHosts.has('fonts.gstatic.com'));
 assert.equal(decodeDataURL('data:text/css,a%7Bcolor:red%7D#ignored').source,'a{color:red}');
 assert.doesNotThrow(()=>inspectReferences('data:image/png;base64,iVBORw0KGgo=',{kind:'url'}));
});
