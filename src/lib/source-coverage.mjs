// Adapted from StackScout fix/partial-failure-visibility, with dated outcomes.
export function makeCoverage(sources) {
 const attempted=sources.length,failed=sources.filter(s=>s.outcome==='failure').length,succeeded=attempted-failed;
 const status=!attempted || failed>=Math.ceil(attempted/2) || sources.some(s=>s.required&&s.outcome==='failure')?'failed':failed?'degraded':'healthy';
 return {status,attempted,succeeded,failed,sources};
}
export function validateCoverage(coverage) {
 if(!coverage||!Array.isArray(coverage.sources))throw Error('Invalid source coverage');
 const ids=new Set();
 for(const source of coverage.sources){
  if(!source||typeof source.id!=='string'||!source.id||ids.has(source.id)||typeof source.name!=='string'||typeof source.required!=='boolean'||!['success','failure'].includes(source.outcome))throw Error('Invalid source outcome');
  ids.add(source.id);
  if(!Number.isFinite(Date.parse(source.attemptedAt)) || source.lastSuccessAt!==null&&!Number.isFinite(Date.parse(source.lastSuccessAt)) || source.lastSuccessAt&&Date.parse(source.lastSuccessAt)>Date.parse(source.attemptedAt) || source.outcome==='success'&&source.lastSuccessAt!==source.attemptedAt)throw Error('Invalid source outcome dates');
 }
 const expected=makeCoverage(coverage.sources);
 for(const key of ['status','attempted','succeeded','failed'])if(coverage[key]!==expected[key])throw Error('Source coverage totals or status do not match outcomes');
 return expected;
}
export function coverageMessage(coverage){
 if(!coverage)return 'Source availability unverified: this snapshot has no per-source coverage record.';
 const c=validateCoverage(coverage);
 return c.status==='healthy'?`Source coverage: ${c.succeeded} of ${c.attempted} sources succeeded.`:`Some sources unavailable: ${c.failed} of ${c.attempted} sources failed. Coverage is reduced.`;
}
