import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { repositoryClaims } from '../src/assets/repo-claims.mjs';
import { refreshPublicRepoMetadata } from '../src/lib/public-repo-refresh.mjs';
import { buildRepoDetailPage, buildRepoDirectoryPage, buildPublicHome } from '../src/templates/public.mjs';
const now = new Date('2026-11-16T12:00:00Z');
test('archived is always historical, including stale and missing check dates', () => {
  for (const metadataCheckedAt of [null, '2026-01-01', '2026-11-16']) assert.match(repositoryClaims({archived:true,metadataCheckedAt},now).status,/Archived repository/);
  assert.match(repositoryClaims({},now).checked,/unverified/);
  assert.match(repositoryClaims({archived:false,metadataCheckedAt:'2027-01-01'},now).status,/unverified/);
  assert.match(repositoryClaims({editorialReviewedAt:'2027-01-01'},now).editorial,/unverified/);
  assert.match(repositoryClaims({archived:false,metadataCheckedAt:'2026-01-01'},now).status,/stale/);
  assert.match(repositoryClaims({archived:false,metadataCheckedAt:'2026-11-16',pushedAt:'2025-01-01'},now).status,/Inactive snapshot/);
});
test('refresh records only allowlisted upstream evidence and never reviews editorial text', async () => {
 const repo={name:'a/b',slug:'a-b',repoUrl:'https://github.com/a/b',summary:'Old editorial',editorialReviewedAt:'2026-01-01'};
 const {siteData}=await refreshPublicRepoMetadata({repos:[repo]},async()=>({full_name:'a/b',html_url:repo.repoUrl,stargazers_count:7,archived:true,pushed_at:'2026-01-02T00:00:00Z',description:'Raw <text>',license:{spdx_id:'MIT',url:'https://api.github.com/licenses/mit'},secretExtra:'never'}),{now});
 const next=siteData.repos[0]; assert.equal(next.archived,true);assert.equal(next.metadataCheckedAt,now.toISOString());assert.equal(next.editorialReviewedAt,repo.editorialReviewedAt);assert.equal(next.summary,repo.summary);assert.equal(next.upstreamDescription,'Raw <text>');assert.equal(next.licenseSpdx,'MIT');assert.equal(next.secretExtra,undefined);
});
test('static dossier, cards, home and browser cards keep archive and check qualifiers',()=>{
 const data=JSON.parse(fs.readFileSync('content/public/generated/site-data.json','utf8'));
 const repo=data.repos.find(x=>x.name==='daytonaio/daytona'); assert.equal(repo.archived,true);
 assert.match(buildRepoDetailPage(data,repo),/Archived repository/);assert.match(buildRepoDetailPage(data,repo),/Reported licence: unverified/);
 assert.match(buildRepoDirectoryPage({...data,repos:[repo]}),/Metadata checked: unverified/);
 assert.match(buildPublicHome({...data,repos:[repo],featured:[repo]}),/Archived repository/);
 const source=fs.readFileSync('src/assets/public-app.js','utf8').replace(/^import .*;\n/, '');
 const context=vm.createContext({repositoryClaims,document:{getElementById:()=>null,baseURI:'https://example.com/'},URL});vm.runInContext(source,context);
 context.repo=repo; assert.match(vm.runInContext('repoCard(repo)',context),/Archived repository/);
 assert.match(vm.runInContext('repoCard(repo)',context),/Identity and stars checked:/);
});
