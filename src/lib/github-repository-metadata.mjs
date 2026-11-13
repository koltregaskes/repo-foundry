export async function fetchGithubRepositoryMetadata(owner, repo, {fetchImpl=fetch, token}={}) {
 const requested=owner+'/'+repo;
 const headers={Accept:'application/vnd.github+json','User-Agent':'Repo-Foundry-Public-Metadata-Refresh','X-GitHub-Api-Version':'2022-11-28'};
 if(token)headers.Authorization='Bearer '+token;
 const response=await fetchImpl('https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo),{headers,redirect:'follow',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('GitHub HTTP '+response.status);
 const endpoint=new URL(response.url);
 if(endpoint.origin!=='https://api.github.com')throw new Error('Unexpected repository API redirect host');
 const metadata=await response.json();
 return {...metadata, redirectedFrom:response.redirected?requested:null};
}
