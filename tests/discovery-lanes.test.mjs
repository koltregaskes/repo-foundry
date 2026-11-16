import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { discoveryData, canonicalCategory } from '../src/lib/discovery.mjs';
import { buildLaneDetailPage, buildTrendingPage, buildRepoDirectoryPage } from '../src/templates/public.mjs';
const source=JSON.parse(fs.readFileSync('content/public/generated/site-data.json','utf8'));
const data=discoveryData(source);
test('all dossiers belong to exactly one counted, rendered lane; future lanes are honest',()=>{
 assert.equal(data.repos.length,29);assert.equal(data.categories.reduce((n,c)=>n+c.count,0),29);
 for(const repo of data.repos)assert.equal(data.categories.filter(c=>c.name===repo.category).length,1);
 for(const lane of data.categories){const html=buildLaneDetailPage(data,lane);assert.equal((html.match(/class="repo-card(?: |")/g)||[]).length,lane.count);if(!lane.count)assert.match(html,/No public-safe repos are currently pinned/);}
 assert.throws(()=>canonicalCategory('Typo tooling'),/Unknown repository category/);
 assert.equal(canonicalCategory('Video and media tooling'),'Video tooling');
});
test('every listing default actually renders cards after browser initialisation',()=>{
 for(const build of [buildTrendingPage,buildRepoDirectoryPage])for(const archive of [false,true]){
  const html=build(data,archive),pageData=JSON.parse(html.match(/<script id="page-data" type="application\/json">(.*?)<\/script>/s)[1]);
  const root={innerHTML:'',after:()=>{}},document={getElementById:id=>id==='page-data'?{textContent:JSON.stringify(pageData)}:id==='publicList'?root:null,baseURI:'https://example.com/',createElement:()=>({addEventListener:()=>{}})};
  vm.runInNewContext(fs.readFileSync('src/assets/public-app.js','utf8'),{document,URL});
  assert.ok((root.innerHTML.match(/class="repo-card"/g)||[]).length>0,pageData.page+' empty default');
  assert.doesNotMatch(html,/Live signals/);assert.match(html,/class="repo-card/);
 }
 assert.match(buildTrendingPage(data),/Newest addition: 01 Jul 2026/);
 const empty=buildTrendingPage(discoveryData({...source,repos:[]}));assert.match(empty,/No repositories in this view/);
});
