const assert=require('node:assert/strict');const {createGame}=require('./harness.cjs');const {run}=createGame();const value=s=>JSON.parse(run(`JSON.stringify(${s})`));
// Independent national-dex lists: do not derive expected coverage from game rarity labels.
const expected=[
[[144,145,146],[150],[151]],
[[243,244,245],[249,250],[251]],
[[377,378,379,380,381],[382,383,384],[385,386]],
[[480,481,482,485,486,488],[483,484,487],[489,490,491,492,493]],
[[638,639,640,641,642,645],[643,644,646],[494,647,648,649]],
[[],[716,717,718],[719,720,721]],
[[772,773,785,786,787,788,793,794,795,796,797,798,799,803,804,805,806],[791,792,800],[801,802,807,808,809]],
[[891,892,894,895,896,897,905],[888,889,890,898],[893]],
[[1001,1002,1003,1004,1014,1015,1016,1017],[1007,1008,1024],[1025]]];
for(let gen=1;gen<=9;gen++){
 run(`adventureGen=${gen};S.battle=null;var html=regionalExplore()`);
 for(const [i,kind] of ['준전설','초전설','환상'].entries()){
  const wanted=expected[gen-1][i];const sites=value(`LOCATIONS.filter(l=>l.gen===${gen}&&l.rareKind==='${kind}')`);
  if(!wanted.length){assert.equal(sites.length,0);continue}assert.ok(sites.length);
  for(const site of sites){
   assert.deepEqual(value(`regionalRarePool(LOCATIONS.find(l=>l.id==='${site.id}'))`),wanted);
   assert.equal(site.required,i===0?55:60);
   assert.ok(run(`svLocationSupported(LOCATIONS.find(l=>l.id==='${site.id}'))`));
  }
  for(const id of wanted)assert.ok(run(`html.includes('data-encounter-species="${id}"')`),`gen ${gen}: ${id} not visible`);
 }
}
// A collected rider must not replace the base Calyrex portrait in the public encounter list.
run(`S.mons.push(enrich({uid:'rider',id:898,lv:60,form:10194}));adventureGen=8;var html=regionalExplore()`);
assert.ok(run(`html.includes('src="assets/898.png" alt="버드렉스"')`));
assert.deepEqual(value(`regionalRareEntries(LOCATIONS.find(l=>l.id==='galar-shrine')).filter(e=>e.id===898).map(e=>e.form)`),[0,10193,10194]);
// Actual mythical entry and completion use the same common exploration/capture flow.
run(`S.xp=5900;S.battle=null;S.pending=null;S.energy=12;S.tickets=5;var ace=enrich({uid:'myth-ace',id:445,lv:60});S.mons.push(ace);S.party=[ace.uid];combatStartLocation('gen-1-mythical')`);
assert.equal(run('S.battle'),null);assert.equal(run('S.tickets'),5);
run(`S.xp=6000;combatStartLocation('gen-1-mythical');var b=S.battle;b.step=4;prepareEnemy(b)`);
assert.equal(run('b.rareSpecies'),151);assert.equal(run('b.foe.id'),151);assert.equal(run('S.energy'),10);assert.equal(run('S.tickets'),4);
run('finishLocation(b)');assert.equal(run('b.rewardPokemon'),151);
console.log('PASS: independent all-generation sublegend/legend/mythical lists, visible full rosters, base/rider portraits, supported stages and mythical 59/60 gate/ticket/capture flow.');
