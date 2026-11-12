import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
for(const [command,...args] of [['python3','scripts/build.py'],['node','tests/game.cjs'],['node','tests/combat.cjs'],['node','tests/progression.cjs'],['node','tests/modes.cjs'],['node','tests/special-rosters.cjs'],['node','tests/region-conditions.cjs'],['node','tests/worker.mjs']]){
 const result=spawnSync(command,args,{cwd,stdio:'inherit'});
 if(result.error){console.error(result.error.message);process.exit(1)}
 if(result.status!==0)process.exit(result.status||1);
}
