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
 assert.ok((await inspectPrivacyHosts(await fixture(source))).errors.some(e=>e.includes('unlisted resource host github.com')));
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
