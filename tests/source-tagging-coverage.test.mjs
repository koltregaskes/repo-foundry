import {spawnSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {classifyArticle,tagEntries} from '../src/lib/article-relevance.mjs';
import {makeCoverage,validateCoverage,coverageMessage} from '../src/lib/source-coverage.mjs';
import {refreshRoutedFeed,applySiteFilter} from '../scripts/refresh-routed-feed.mjs';
import {compileRoutedNewsFeed,assertRoutedNewsFeed} from '../src/lib/routed-news.mjs';
import {buildNewsPage} from '../src/templates/public.mjs';
import {assessRoutedFeedFreshness} from '../scripts/check-routed-feed-freshness.mjs';
const date='2026-11-16T01:00:00.000Z',now=new Date(date);
const filter={name:'Repo Foundry',include_tags:['open_source','github_release'],min_importance_score:0.35};
for(const title of ['AI advertising SDK launch','Open-source API court-ruling story','Open-source software office-opening story','OpenAI hires a new CEO','An open-source library without any update','A chat model release']) {
 test('reject irrelevant article despite broad source tags: '+title,()=>{
  const tagged=tagEntries([{title,url:'https://example.com/story',date}],{name:'Broad publisher',tags:['open_source','github_release']},1);
  assert.deepEqual(tagged[0].tags,[]);assert.equal(tagged[0].importance,0);assert.equal(applySiteFilter(tagged,filter,now).length,0);
 });
}
test('real repository release retains source/date; score is independent of acceptance threshold',()=>{
 const [entry]=tagEntries([{title:'Tool v1.2 release',url:'https://github.com/owner/tool/releases/tag/v1.2',date,summary:'Original summary'}],{name:'Original publisher',tags:['crypto']});
 assert.deepEqual(entry.tags,['open_source','repo_update','github_release']);assert.equal(entry.date,date);assert.equal(entry.source,'Original publisher');
 assert.equal(applySiteFilter([entry],{...filter,min_importance_score:0.95},now).length,0);
 assert.equal(classifyArticle({title:'Open-source library adds a security fix'}).importance,0.7);
});
function sources(){return ['a','b','c'].map(id=>({id,name:id,adapter:'rss',url:'https://example.com/'+id,tags:['open_source']}));}
function setup(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rf-coverage-'));fs.mkdirSync(path.join(dir,'config'));fs.writeFileSync(path.join(dir,'site-filters.json'),JSON.stringify({sites:{'repo-foundry':filter}}));fs.writeFileSync(path.join(dir,'config/sources.json'),JSON.stringify({sources:sources()}));return {pipelineDir:dir,outputPath:path.join(dir,'feed.json'),now,retries:1};}
function fetcher(failed=[]){return async url=>({ok:!failed.includes(url.at(-1)),status:failed.includes(url.at(-1))?404:200,text:async()=>'<rss><channel></channel></rss>'});}
test('one item works through acquisition, compilation and rendering before a multi-source run',async()=>{
 const args=setup();fs.writeFileSync(path.join(args.pipelineDir,'config/sources.json'),JSON.stringify({sources:[sources()[0]]}));
 const rss=`<rss><channel><item><title>Open-source library release</title><link>https://github.com/owner/tool/releases/tag/v1</link><pubDate>Mon, 16 Nov 2026 00:00:00 GMT</pubDate><description>Actual source summary</description></item></channel></rss>`;
 const result=await refreshRoutedFeed({...args,fetchImpl:async()=>({ok:true,text:async()=>rss})});
 const compiled=compileRoutedNewsFeed(result.feed,{now});assert.equal(compiled.news.length,1);assert.equal(compiled.news[0].source,'a');assert.equal(compiled.news[0].publishedAt,'2026-11-16T00:00:00.000Z');
 const data=JSON.parse(fs.readFileSync('content/public/generated/site-data.json','utf8'));
 const html=buildNewsPage({...data,news:compiled.news,sourceProvenance:{news:compiled.provenance}});assert.match(html,/href="https:\/\/github.com\/owner\/tool\/releases\/tag\/v1"/);
});
test('partial failure persists counts, per-source last success and visible degraded notice',async()=>{
 const args=setup();await refreshRoutedFeed({...args,fetchImpl:fetcher()});
 const later=new Date(now.getTime()+60000),result=await refreshRoutedFeed({...args,now:later,fetchImpl:fetcher(['c'])});
 assert.equal(result.coverage.status,'degraded');assert.equal(result.coverage.succeeded,2);assert.equal(result.coverage.failed,1);assert.equal(result.coverage.sources[2].lastSuccessAt,date);
 const saved=JSON.parse(fs.readFileSync(args.outputPath,'utf8'));assert.deepEqual(saved.acquisition,result.coverage);
 const compiled=compileRoutedNewsFeed(saved,{now:later});assert.match(coverageMessage(compiled.provenance.acquisition),/Some sources unavailable/);
 const data=JSON.parse(fs.readFileSync('content/public/generated/site-data.json','utf8'));
 const html=buildNewsPage({...data,news:[],sourceProvenance:{news:compiled.provenance}});assert.match(html,/Some sources unavailable/);assert.match(html,/c: failure; last success: 2026-11-16/);
 assert.equal(assessRoutedFeedFreshness(saved,later).hardFail,true);
});
test('majority failure preserves feed bytes but writes failed attempt status',async()=>{
 const args=setup();await refreshRoutedFeed({...args,fetchImpl:fetcher()});const before=fs.readFileSync(args.outputPath);
 const result=await refreshRoutedFeed({...args,fetchImpl:fetcher(['a','b'])});assert.equal(result.wrote,false);assert.equal(result.feed,null);assert.deepEqual(fs.readFileSync(args.outputPath),before);
 assert.equal(JSON.parse(fs.readFileSync(args.outputPath+'.status.json','utf8')).coverage.status,'failed');
});
test('empty feed requires coverage; forged totals, duplicate IDs and dates fail closed',()=>{
 const feed={site:'Repo Foundry',generated:date,article_count:0,articles:[]};assert.throws(()=>assertRoutedNewsFeed(feed,{now}),/requires successful source coverage/);
 const coverage=makeCoverage([{id:'a',name:'a',required:false,outcome:'success',attemptedAt:date,lastSuccessAt:date}]);
 assert.equal(assertRoutedNewsFeed({...feed,acquisition:coverage},{now}).itemCount,0);
 assert.throws(()=>validateCoverage({...coverage,succeeded:3}));assert.throws(()=>validateCoverage({...coverage,sources:[...coverage.sources,...coverage.sources]}));
 assert.throws(()=>validateCoverage({...coverage,sources:[{...coverage.sources[0],lastSuccessAt:null}]}));
 const failed=makeCoverage([{...coverage.sources[0],outcome:'failure',lastSuccessAt:null}]);assert.throws(()=>assertRoutedNewsFeed({...feed,acquisition:failed},{now}),/coverage failed/);
});

test('degraded status reporting permits publication with a warning; failed or missing status fails',()=>{
 const args=setup(),file=path.join(args.pipelineDir,'status.json');
 const entries=['a','b','c'].map((id,index)=>({id,name:id,required:false,outcome:index===2?'failure':'success',attemptedAt:date,lastSuccessAt:index===2?null:date}));
 fs.writeFileSync(file,JSON.stringify({coverage:makeCoverage(entries)}));
 const run=()=>spawnSync(process.execPath,['scripts/report-source-status.mjs',file],{encoding:'utf8'});
 let result=run();assert.equal(result.status,0);assert.match(result.stdout,/::warning/);assert.match(result.stdout,/Some sources unavailable/);
 entries[1]={...entries[1],outcome:'failure',lastSuccessAt:null};fs.writeFileSync(file,JSON.stringify({coverage:makeCoverage(entries)}));
 result=run();assert.equal(result.status,1);assert.match(result.stdout,/::error/);
 result=spawnSync(process.execPath,['scripts/report-source-status.mjs',file+'.missing'],{encoding:'utf8'});assert.equal(result.status,1);assert.match(result.stderr,/missing or invalid/);
});
