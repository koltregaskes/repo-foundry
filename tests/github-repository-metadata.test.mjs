import assert from 'node:assert/strict';
import test from 'node:test';
import {fetchGithubRepositoryMetadata} from '../src/lib/github-repository-metadata.mjs';
test('GitHub HTTP redirects carry verified rename provenance',async()=>{let request;const result=await fetchGithubRepositoryMetadata('calesthio','OpenMontage',{fetchImpl:async(url,options)=>{request=options;return {ok:true,redirected:true,url:'https://api.github.com/repositories/123',json:async()=>({id:123,full_name:'OpenMontageInc/OpenMontage',html_url:'https://github.com/OpenMontageInc/OpenMontage'})};}});assert.equal(request.redirect,'follow');assert.equal(result.redirectedFrom,'calesthio/OpenMontage');});
test('unexpected redirect hosts are rejected',async()=>{await assert.rejects(fetchGithubRepositoryMetadata('owner','repo',{fetchImpl:async()=>({ok:true,url:'https://example.com/repo',redirected:true})}),/Unexpected repository API redirect host/);});
