import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import{spawnSync}from'node:child_process';
function buildFixture(url='https://example.com/xml-safe'){
 const root=fs.realpathSync(process.cwd()),fixture=fs.mkdtempSync(path.join(root,'.xml-fixture-'));
 try{
  fs.copyFileSync('site-config.json',path.join(fixture,'site-config.json'));for(const dir of ['src','scripts'])fs.cpSync(dir,path.join(fixture,dir),{recursive:true});fs.mkdirSync(path.join(fixture,'content'),{recursive:true});fs.cpSync('content/public',path.join(fixture,'content/public'),{recursive:true});
  const p=path.join(fixture,'content/public/generated/news-feed-latest.json'),feed=JSON.parse(fs.readFileSync(p,'utf8'));feed.articles[0].url=url;feed.articles[0].title='XML scalar fixture '+String.fromCodePoint(0xFFFE,0xFFFF,0xFDD0,0xFDEF,0x1FFFE)+' &#xFFFF; &#x10FFFF;';feed.articles[0].summary=feed.articles[0].title;fs.writeFileSync(p,JSON.stringify(feed));
  const build=spawnSync(process.execPath,['scripts/build-public.mjs','--allow-stale-routed-news-for-boundary-scan'],{cwd:fixture,encoding:'utf8',timeout:60000});assert.equal(build.status,0,build.stderr);const output=path.join(fixture,'dist/public/feed.xml'),xml=fs.readFileSync(output,'utf8');assert.ok(xml.includes('XML scalar fixture'));assert.ok(xml.includes(new URL(url).href));
  const parser=spawnSync(process.env.PYTHON||(process.platform==='win32'?'python':'python3'),['-c','import sys, xml.etree.ElementTree as E; E.parse(sys.argv[1])',output],{encoding:'utf8',timeout:10000});assert.equal(parser.status,0,parser.stderr);
  assert.doesNotMatch(fs.readFileSync(path.join(fixture,'dist/public/news/index.html'),'utf8'),/[\u0001\uFFFF]/u);
 }finally{
  // Only remove this test's newly created, resolved fixture inside the checkout.
  const resolved=fs.realpathSync(fixture);assert.equal(path.dirname(resolved),root);assert.ok(path.basename(resolved).startsWith('.xml-fixture-'));fs.rmSync(resolved,{recursive:true});
 }
}
test('built RSS from hostile source titles parses as strict XML 1.0',()=>buildFixture());
for(const url of ['https://example.com/a\u0001b','https://example.com/a\uFFFFb','\u0001https://example.com/lead'])test('hostile URL produces valid built RSS and news href '+JSON.stringify(url),()=>buildFixture(url));
