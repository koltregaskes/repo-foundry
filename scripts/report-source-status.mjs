import fs from 'node:fs';
import {validateCoverage,coverageMessage} from '../src/lib/source-coverage.mjs';
try {
 const status=JSON.parse(fs.readFileSync(process.argv[2]||'.local/routed-feed-status.json','utf8'));
 const c=validateCoverage(status.coverage);
 const level=c.status==='healthy'?'notice':c.status==='degraded'?'warning':'error';
 console.log(`::${level} title=Routed feed source coverage::${coverageMessage(c)}`);
 // A healthy majority can publish the degraded notice. The scheduled freshness
 // and launch-acceptance checks still reject reduced coverage.
 if(c.status==='failed')process.exitCode=1;
}catch{console.error('Source status missing or invalid; coverage cannot be confirmed.');process.exitCode=1;}
