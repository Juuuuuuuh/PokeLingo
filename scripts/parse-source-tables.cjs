// Developer-only source refresh helper. Normal game/build/test usage needs no TS compiler.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=process.argv[2];if(!dir)throw Error('Usage: node scripts/parse-source-tables.cjs SOURCE_DIRECTORY');
for(const name of ['pokedex','learnsets']){const text=fs.readFileSync(path.join(dir,name+'.ts'),'utf8'),body=text.slice(text.indexOf('= {')+2).trim().replace(/;$/,'');const data=vm.runInNewContext('('+body+')',{}, {timeout:10000});fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(data));}
const strip=require('node:module').stripTypeScriptTypes;if(!strip)throw Error('Source refresh requires Node.js 22.13+; ordinary builds/tests work on Node 20+.');
const js=strip(fs.readFileSync(path.join(dir,'moves.ts'),'utf8')).replace(/export const Moves\s*=/,'globalThis.Moves =');const ctx={};vm.runInNewContext(js,ctx,{timeout:10000});fs.writeFileSync(path.join(dir,'moves.json'),JSON.stringify(ctx.Moves,(k,v)=>typeof v==='function'?'__function__':v));
