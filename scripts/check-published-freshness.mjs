import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {compileRoutedNewsFeed} from '../src/lib/routed-news.mjs';import {escapeHtml} from '../src/templates/layout.mjs';
export async function verifyPublishedSite({base,feed,metadata,now=new Date(),fetchImpl=fetch}) {
 const {news,provenance}=compileRoutedNewsFeed(feed,{now,maxAgeDays:1});const expectedMetadata=metadata.sourceProvenance?.repositoryMetadata;
 assert.ok(expectedMetadata?.generatedAt,'metadata source timestamp missing');const age=now-new Date(expectedMetadata.generatedAt);assert.ok(Number.isFinite(age)&&age>=-300000&&age<=2*86400000,'metadata snapshot older than two days or future');
 const checks=[];async function get(relative){const url=new URL(relative,base);assert.equal(url.protocol,'https:');const response=await fetchImpl(url.href,{redirect:'manual',signal:AbortSignal.timeout(15000)});assert.equal(response.status,200,'published destination did not return 200: '+url.pathname);const text=await response.text();checks.push({url:url.href,status:response.status,sha256:createHash('sha256').update(text).digest('hex')});return text;}
 const published=JSON.parse(await get('data/source-provenance.json'));
 for(const key of ['generatedAt','newestItemAt','itemCount','consumedItems'])assert.equal(published.news?.[key],provenance[key],'deployed news provenance differs: '+key);
 for(const key of ['generatedAt','itemCount'])assert.equal(published.repositoryMetadata?.[key],expectedMetadata[key],'deployed metadata differs: '+key);
 const html=await get('news/'),rss=await get('feed.xml');
 assert.ok(html.includes('href="'+new URL('news/',base).href+'"'),'news canonical differs');
 for(const item of news){assert.ok(html.includes(escapeHtml(item.title))&&html.includes(escapeHtml(item.url)),'deployed news item missing');assert.ok(rss.includes(escapeHtml(item.url))&&rss.includes(new Date(item.publishedAt).toUTCString()),'deployed RSS item/date missing');}
 if(!news.length)assert.match(html,/No public release items were returned/i,'empty source is not honestly presented');
 const first=metadata.repos?.[0];assert.ok(first?.slug,'no repository dossier to prove');const dossier=await get('repos/'+first.slug+'/');assert.ok(dossier.includes(escapeHtml(first.name)),'deployed dossier identity missing');
 return {checkedAt:now.toISOString(),sourceGeneratedAt:provenance.generatedAt,newestSourceItemAt:provenance.newestItemAt,metadataGeneratedAt:expectedMetadata.generatedAt,itemCount:news.length,checks};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const config=JSON.parse(await fs.readFile('launch-config.json','utf8'));let report;
 try{report=await verifyPublishedSite({base:config.base,feed:JSON.parse(await fs.readFile('content/public/generated/news-feed-latest.json','utf8')),metadata:JSON.parse(await fs.readFile('content/public/generated/site-data.json','utf8'))});console.log(JSON.stringify(report,null,2));}
 catch(error){report={checkedAt:new Date().toISOString(),status:'failed',reason:error.message};console.error(JSON.stringify(report));process.exitCode=1;}
 if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,'## Published Repo Foundry freshness proof\n\nThis run is one observation, not seven-day acceptance. A red run is the existing failure signal; notification delivery needs owner readback.\n\n'+JSON.stringify(report,null,2)+'\n');
}
