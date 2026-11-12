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
[[1001,1002,1003,1004,1014,1015,1017],[1007,1008,1024],[1025]]];
for(let gen=1;gen<=9;gen++){
 run(`adventureGen=${gen};S.battle=null;var html=regionalExplore()`);
 for(const [i,kind] of ['준전설','초전설','환상'].entries()){
  const wanted=expected[gen-1][i];const sites=value(`LOCATIONS.filter(l=>l.gen===${gen}&&(l.rareKind==='${kind}'||l.encounterSpecies?.some(id=>mon(id).rarity==='${kind}')))`);
  if(!wanted.length){assert.equal(sites.length,0);continue}assert.ok(sites.length);
  for(const site of sites){
   assert.deepEqual(value(`regionalRarePool(LOCATIONS.find(l=>l.id==='${site.id}'),true)`),site.encounterSpecies||wanted);
   assert.equal(site.required,['준전설','준전설·일반'].includes(site.rareKind)?55:60);
   assert.ok(run(`svLocationSupported(LOCATIONS.find(l=>l.id==='${site.id}'))`));
  }
  assert.deepEqual([...new Set(sites.flatMap(site=>value(`regionalRarePool(LOCATIONS.find(l=>l.id==='${site.id}'),true)`).filter(id=>wanted.includes(id))))].sort((a,b)=>a-b),[...wanted].sort((a,b)=>a-b));
  for(const id of wanted)assert.ok(run(`html.includes('data-encounter-species="${id}"')`),`gen ${gen}: ${id} not visible`);
 }
}
// A collected rider must not replace the base Calyrex portrait in the public encounter list.
run(`S.mons.push(enrich({uid:'rider',id:898,lv:60,form:10194}));adventureGen=8;var html=regionalExplore()`);
assert.ok(run(`html.includes('src="assets/898.png" alt="버드렉스"')`));
assert.deepEqual(value(`regionalRareEntries(LOCATIONS.find(l=>l.id==='galar-shrine')).filter(e=>e.id===898).map(e=>e.form)`),[0]);
// Actual mythical entry and completion use the same common exploration/capture flow.
run(`S.xp=5800;S.battle=null;S.pending=null;S.energy=12;S.tickets=5;var ace=enrich({uid:'myth-ace',id:445,lv:60});S.mons.push(ace);S.party=[ace.uid];combatStartLocation('gen-1-mythical')`);
assert.equal(run('S.battle'),null);assert.equal(run('S.tickets'),5);
run(`S.xp=5900;combatStartLocation('gen-1-mythical');var b=S.battle;b.step=4;prepareEnemy(b)`);
assert.equal(run('b.rareSpecies'),151);assert.equal(run('b.foe.id'),151);assert.equal(run('S.energy'),10);assert.equal(run('S.tickets'),4);
run('finishLocation(b)');assert.equal(run('b.rewardPokemon'),151);
console.log('PASS: independent all-generation sublegend/legend/mythical lists, visible full rosters, base/rider portraits, supported stages and mythical 59/60 gate/ticket/capture flow.');

// Dedicated extras cannot leak into paired cover-legend maps, and vice versa.
const split={
 'johto-whirl':[249],'johto-bell':[250],
 'hoenn-origin':[382,383],'hoenn-sky':[384],
 'sinnoh-spear':[483,484],'sinnoh-turnback':[487],
 'unova-dragonspiral':[643,644],'unova-chasm':[646],
 'kalos-unknown':[716,717],'kalos-terminus':[718],
 'alola-altar':[791,792],'alola-megalopolis':[800],
 'galar-deep-weald':[888,889],'galar-energy':[890],'galar-shrine':[898],
 'paldea-zero':[1007,1008],'paldea-zero-depths':[1024],
 'gen-4-mythical':[492,490,489],'sinnoh-hall-origin':[493]
};
for(const [key,ids] of Object.entries(split)){
 assert.deepEqual(value(`regionalRarePool(LOCATIONS.find(l=>l.id==='${key}'))`),ids);
 // Exercise the actual sampler at both ends, not only the displayed list.
 for(const random of [0,.999999]){
  run(`S.battle=null;S.pending=null;S.energy=12;S.tickets=10;S.xp=6000;Math.random=()=>${random};combatStartLocation('${key}')`);
  assert.ok(ids.includes(run('S.battle.rareSpecies')),key);
  run('S.battle.step=4;prepareEnemy(S.battle)');
  assert.ok(ids.includes(run('S.battle.foe.id')),key);
 }
}
console.log('PASS: paired cover legends, isolated extras and Arceus-only Hall of Origin in actual encounter selection.');

// Old unfinished cross-pool encounters are refunded once; already-earned rewards survive.
run(`S.battle=null;S.energy=12;S.tickets=10;combatStartLocation('hoenn-sky');S.battle.rareSpecies=382;migrate()`);
assert.equal(run('S.battle'),null);assert.equal(run('S.tickets'),10);assert.equal(run('S.energy'),12);
run('migrate()');assert.equal(run('S.tickets'),10);
run(`combatStartLocation('hoenn-sky');S.battle.rareSpecies=382;S.battle.finished=true;S.battle.rewardPokemon=382;migrate()`);
assert.equal(run('S.battle.rewardPokemon'),382);
console.log('PASS: changed active encounters refunded once while completed rewards and owned Pokemon remain.');

// Exact numbered UI stages and real ordinary/special sampling for the requested routes.
assert.deepEqual(value(`LOCATIONS.filter(l=>l.gen===1).slice(6).map(l=>l.name)`),['석영고원','쌍둥이섬','블루시티동굴','머나먼고도']);
assert.equal(run('LOCATIONS.filter(l=>l.gen===1).length'),10);
assert.deepEqual(value(`svEncounterPool(LOCATIONS.find(l=>l.id==='kanto-victory'))`),[149,147,148]);
assert.equal(run(`regionalRepresentative(LOCATIONS.find(l=>l.id==='kanto-victory'))`),149);
assert.deepEqual(value(`LOCATIONS.filter(l=>l.gen===2).slice(8,10).map(l=>l.name)`),['소용돌이섬','방울탑']);
assert.deepEqual(value(`regionalRarePool(LOCATIONS.find(l=>l.id==='kanto-seafoam'))`),[144,145,146]);
for(const random of [0,.4,.999999]){run(`Math.random=()=>${random};S.battle=null;S.pending=null;S.energy=12;S.tickets=10;S.xp=6000;combatStartLocation('kanto-victory')`);assert.ok([149,147,148].includes(run('S.battle.foe.id')));}
run(`S.battle=null;S.locationClears.push('kanto-power');S.manualClears.push('kanto-power');migrate()`);
assert.ok(run(`S.locationClears.includes('kanto-seafoam')&&S.manualClears.includes('kanto-seafoam')`));
assert.ok(!run(`S.locationClears.includes('kanto-power')`));
console.log('PASS: exact Kanto 7/8/9/10 and Johto 9/10 slots, Dragonite family encounters and merged clear migration.');
