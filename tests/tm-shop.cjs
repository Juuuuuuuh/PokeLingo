const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {createGame}=require('./harness.cjs');const {run,root}=createGame();const value=s=>JSON.parse(run(`JSON.stringify(${s})`));
const source=JSON.parse(fs.readFileSync(path.join(root,'data/sv-tm-lp-costs.json'))),catalog=value('TM_CATALOG');
assert.equal(source.tms.length,229);assert.deepEqual(catalog.map(t=>t.number),Array.from({length:229},(_,i)=>i+1));
for(const t of catalog){const fact=source.tms.find(row=>row.number===t.number);assert.equal(run(`MOVES[${t.move}].key`),fact.key);assert.equal(t.lpCost,fact.lp);assert.equal(t.price,20+5*Math.ceil(fact.lp/500));}
const byLP=[...catalog].sort((a,b)=>a.lpCost-b.lpCost);assert.ok(byLP.every((t,i)=>!i||t.price>=byLP[i-1].price));assert.equal(Math.min(...catalog.map(t=>t.price)),25);assert.equal(Math.max(...catalog.map(t=>t.price)),170);
run(`S.battle=null;S.pending=null;S.coins=10000;itemShopTab='기술 도구';itemShopSearch='';var html=renderItemShop()`);
assert.ok(run(`html.includes('data-item-art="heart-scale"')`));assert.equal(run(`(html.match(/data-tm-number=/g)||[]).length`),229);
for(const t of catalog){assert.ok(run(`html.includes('data-tm-number="${t.number}"')`));assert.ok(run(`html.includes('TM${String(t.number).padStart(3,'0')}')`));}
assert.ok(!run(`html.includes('data-item-tab="기술머신"')`));assert.ok(run(`html.includes('비전머신(HM)이 없어요')`));
for(const q of ['TM097','tm97','097','97']){run(`itemShopSearch=${JSON.stringify(q)};var html=renderItemShop()`);assert.equal(run(`(html.match(/data-tm-number=/g)||[]).length`),1);assert.ok(run(`html.includes('data-tm-number="97"')`));}
run(`itemShopSearch='파도타기';var html=renderItemShop()`);assert.ok(run(`html.includes('TM123')&&html.includes('10,000 LP → 120코인')`));
run(`itemShopSearch='불꽃';var html=renderItemShop()`);assert.equal(run(`(html.match(/data-tm-number=/g)||[]).length`),run(`TM_CATALOG.filter(t=>MOVES[t.move].type==='불꽃').length`));
run(`itemShopTab='기술머신';itemShopSearch='';var html=renderItemShop()`);assert.equal(run(`(html.match(/data-tm-number=/g)||[]).length`),229); // old category aliases remain compatible
for(const [move,number] of [[19,97],[57,123],[127,77],[250,208]])assert.equal(catalog.find(t=>t.move===move).number,number);
for(const move of [15,70,148,249,291,431])assert.ok(!catalog.some(t=>t.move===move)); // absent HMs are not invented
run(`S.items={};S.coins=119;S.tickets=4`);assert.equal(run(`buyGameItem('tm-57').ok`),false);assert.equal(run('S.coins'),119);
run('S.coins=120');assert.equal(run(`buyGameItem('tm-57').ok`),true);assert.equal(run('S.coins'),0);assert.equal(run(`S.items['tm-57']`),1);assert.equal(run('S.tickets'),4);
run(`var pupil=enrich({uid:'tm-pupil',id:7,lv:1});S.mons.push(pupil);pupil.moves=[];pupil.moveOffers=[]`);assert.equal(run(`commitMoveLearning(pupil,57,0,'tm').ok`),true);assert.equal(run(`S.items['tm-57']`),0);assert.ok(run('pupil.learnedMoves.includes(57)'));
run(`S.coins=1000;var before=S.coins`);assert.equal(run(`buyGameItem('tm-19').ok`),false);assert.equal(run('S.coins'),1000);assert.equal(run(`S.items['tm-19']`),undefined);
assert.equal(catalog.filter(t=>run(`MOVES[${t.move}].supported`)).length,149);
console.log('PASS: TM001–229 exact SV identity/LP pricing, all TMs in technical tools, numerical/name/type searches, DLC coverage, no invented HMs, real purchase/teach consumption and explicit unsupported-move locks.');
