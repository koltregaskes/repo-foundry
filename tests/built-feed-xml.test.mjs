import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import{spawnSync}from'node:child_process';
test('built RSS from hostile source titles parses as strict XML 1.0',()=>{
 const base=path.resolve('../rf-feed-xml-fixtures');fs.mkdirSync(base,{recursive:true});const fixture=fs.mkdtempSync(path.join(base,'build-'));fs.copyFileSync('site-config.json',path.join(fixture,'site-config.json'));
 // Copy only public inputs and code; never private runtime, environment or installed files.
 for(const dir of ['src','scripts'])fs.cpSync(dir,path.join(fixture,dir),{recursive:true});fs.mkdirSync(path.join(fixture,'content'),{recursive:true});fs.cpSync('content/public',path.join(fixture,'content/public'),{recursive:true});
 const feedPath=path.join(fixture,'content/public/generated/news-feed-latest.json'),feed=JSON.parse(fs.readFileSync(feedPath,'utf8'));feed.articles[0].title='XML scalar fixture '+String.fromCodePoint(0xFFFE,0xFFFF,0xFDD0,0xFDEF,0x1FFFE)+' &#xFFFF; &#x10FFFF;';feed.articles[0].summary=feed.articles[0].title;fs.writeFileSync(feedPath,JSON.stringify(feed));
 const build=spawnSync(process.execPath,['scripts/build-public.mjs','--allow-stale-routed-news-for-boundary-scan'],{cwd:fixture,encoding:'utf8',timeout:60000});assert.equal(build.status,0,build.stderr);
 const output=path.join(fixture,'dist/public/feed.xml');assert.ok(fs.readFileSync(output,'utf8').includes('XML scalar fixture'));
 const parser=spawnSync(process.env.PYTHON || (process.platform==='win32'?'python':'python3'),['-c','import sys, xml.etree.ElementTree as E; E.parse(sys.argv[1])',output],{encoding:'utf8',timeout:10000});assert.equal(parser.status,0,parser.stderr);
 // Retain task-created fixtures for failure diagnosis; no deletion of workspace data.
});
