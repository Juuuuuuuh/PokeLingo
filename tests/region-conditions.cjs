const assert=require('node:assert/strict');const {createGame}=require('./harness.cjs');const {run}=createGame();const value=s=>JSON.parse(run(`JSON.stringify(${s})`));
run(`S.battle=null;S.pending=null;S.xp=6000;S.energy=12;S.tickets=10;S.registered=[];S.mons=[];var ace=enrich({uid:'ace',id:445,lv:60});S.mons.push(ace);S.party=[ace.uid]`);
const expected=[['예지호수',[480,481,482]],['하드마운틴',[485]],['고대 신전',[486]],['창기둥',[483,484]],['귀혼동굴',[487]],['꽃의 낙원',[492,490,489]],['만월섬',[488,491]],['시작의방',[493]]];
assert.deepEqual(value(`LOCATIONS.filter(l=>l.gen===4).slice(6).map(l=>[l.name,regionalRarePool(l)])`),expected);
run(`combatStartLocation('sinnoh-ancient-temple')`);assert.equal(run('S.battle'),null);assert.equal(run('S.energy'),12);assert.equal(run('S.tickets'),10);
run(`for(var id of [378,379,377])S.mons.push(enrich({uid:'regi-'+id,id,lv:60}));S.registered.push(378,379,377);S.locationClears.push('sinnoh-ancient-temple');S.manualClears.push('sinnoh-ancient-temple');combatStartLocation('sinnoh-ancient-temple','auto')`);
assert.equal(run('S.battle'),null);assert.equal(run('S.energy'),12);assert.equal(run('redeemSpecial(486)'),false);assert.equal(run('receive(486)'),false);assert.equal(run('S.tickets'),10);
run(`S.party=['regi-378','regi-379','ace'];combatStartLocation('sinnoh-ancient-temple')`);assert.equal(run('S.battle'),null);
run(`S.party=['regi-378','regi-379','regi-377'];combatStartLocation('sinnoh-ancient-temple')`);assert.equal(run('S.battle.rareSpecies'),486);assert.equal(run('S.energy'),10);assert.equal(run('S.tickets'),9);
run(`S.battle.step=4;prepareEnemy(S.battle)`);assert.equal(run('S.battle.foe.id'),486);
// Correct party permits auto; it still runs the ordinary battle engine.
run(`S.battle=null;S.energy=12;combatStartLocation('sinnoh-ancient-temple','auto')`);assert.equal(run('S.battle.mode'),'auto');assert.ok(run('S.battle.finished'));assert.equal(run('S.energy'),10);
// Mixed Moon Island remains behind Lv60; both species are eligible and can actually spawn.
for(const [xp,allowed] of [[5800,false],[5900,true]]){run(`S.battle=null;S.xp=${xp};S.energy=12;S.tickets=10;combatStartLocation('sinnoh-fullmoon')`);assert.equal(run('!!S.battle'),allowed);}
for(const random of [0,.99999]){run(`S.battle=null;Math.random=()=>${random};S.energy=12;S.tickets=10;combatStartLocation('sinnoh-fullmoon');S.battle.step=4;prepareEnemy(S.battle)`);assert.equal(run('S.battle.foe.id'),random===0?488:491);}
assert.deepEqual(value(`LOCATIONS.filter(l=>l.gen===5).slice(7,9).map(l=>l.name)`),['궐수의동굴','풍요의사당']);
assert.deepEqual(value(`regionalRarePool(LOCATIONS.find(l=>l.id==='unova-mistralton'))`),[638,639,640]);
run(`S.battle=null;S.xp=6000;S.party=['ace'];S.registered=[];var shrine=LOCATIONS.find(l=>l.id==='unova-shrine')`);
assert.deepEqual(value('regionalRarePool(shrine)'),[641,642]);assert.equal(run('redeemSpecial(645)'),false);assert.equal(run('receive(645)'),false);
run('receive(641)');assert.deepEqual(value('regionalRarePool(shrine)'),[641,642]);
run('receive(642)');assert.deepEqual(value('regionalRarePool(shrine)'),[641,642,645]);
run(`S.battle=null;S.energy=12;S.tickets=10;Math.random=()=>.99999;combatStartLocation('unova-shrine')`);assert.equal(run('S.battle.rareSpecies'),645);
run(`S.battle=null;S.registered=[];S.mons=S.mons.filter(m=>![641,642].includes(m.id));S.party=['ace'];S.energy=12;S.tickets=10;combatStartLocation('unova-shrine')`);assert.equal(run('S.battle.rareSpecies'),642);
run(`S.battle=null;adventureGen=5;var html=regionalExplore()`);assert.ok(run(`html.includes('랜드로스')`));assert.ok(run(`html.includes('포획 조건 미충족')&&html.includes('2종/폼 현재 출현')`));
assert.equal(run(`LOCATIONS.filter(l=>l.gen===7)[8].name`),'울트라홀');
console.log('PASS: Sinnoh 7–14 exact pools, party-only Regigigas requirements for manual/auto/direct capture, mixed Moon Island Lv60, Unova 8/9, capture-gated Landorus sampling and Alola 9 rename.');
// Galar's exact slots partition all sublegends; riders can only be produced by fusion.
assert.deepEqual(value(`LOCATIONS.filter(l=>l.gen===8).slice(7,10).map(l=>[l.name,regionalRarePool(l)])`),[
 ['갈림길의 유적',[894,895]],['수련의 폭포',[891,892]],['설중계곡',[896,897,905]]]);
assert.equal(run(`LOCATIONS.filter(l=>l.gen===8)[12].name`),'왕관신전');
assert.deepEqual(value(`regionalRareEntries(LOCATIONS.find(l=>l.id==='galar-shrine'))`),[{id:898,form:0,name:'버드렉스'}]);
for(const [location,ids] of [['galar-decision',[894,895]],['galar-snowslide',[891,892]],['galar-cemetery',[896,897,905]],['galar-shrine',[898]]]){
 for(const [i,id] of ids.entries()){
  run(`S.battle=null;S.pending=null;S.party=['ace'];S.energy=12;S.tickets=10;Math.random=()=>${(i+.1)/ids.length};combatStartLocation('${location}');S.battle.step=4;prepareEnemy(S.battle)`);
  assert.equal(run('S.battle.foe.id'),id);assert.equal(run('S.battle.foe.form'),0);
 }
}
run(`S.battle=null;var cal=enrich({uid:'cal',id:898,lv:60});S.mons.push(cal);S.items.reins=0;S.discoveredForms.push(10193,10194)`);
assert.equal(run('applyOwnedForm(cal,10193).ok'),false);assert.equal(run('cal.form'),0);
run('S.items.reins=1');assert.equal(run('applyOwnedForm(cal,10193).ok'),false); // old discovery cannot bypass horse ownership
run(`S.mons.push(enrich({uid:'ice',id:896,lv:55}))`);assert.equal(run('applyOwnedForm(cal,10193).ok'),true);
assert.deepEqual(value('effectiveStats(cal)'),value(`(()=>{const f=FORMS.find(f=>f.key===10193);return f.stats.map((base,i)=>i===0?Math.floor((2*base+15)*60/100)+60+10:Math.floor((2*base+15)*60/100)+5)})()`));
assert.equal(run('S.items.reins'),1);assert.equal(run('applyOwnedForm(cal,10194).ok'),false);assert.equal(run('cal.form'),10193);
run(`S.mons.push(enrich({uid:'shadow',id:897,lv:55}))`);assert.equal(run('applyOwnedForm(cal,10194).ok'),true);assert.equal(run('cal.form'),10194);
assert.equal(run('applyOwnedForm(cal,0).ok'),true);assert.equal(run('cal.form'),0);assert.equal(run('S.items.reins'),1);
run(`S.pending=null;receive(898,10194)`);assert.equal(run('S.pending.form'),0);
run(`S.pending=null;adventureGen=8;var galarHtml=regionalExplore()`);assert.ok(!run(`galarHtml.includes('data-encounter-form="10193"')||galarHtml.includes('data-encounter-form="10194"')`));
console.log('PASS: Galar 8/9/10/13 exact pools, no wild riders, fusion requires permanent reins plus captured horse even with legacy discoveries, and free separation preserves inventory.');
// Paldea's requested 16-stage layout, complete DLC paradox partitions and actual encounter draws.
const paldea=[
 ['에리어 제로 고대구역',[984,985,986,987,988,989,1005,1009,1020,1021]],
 ['에리어 제로 연구구역',[990,991,992,993,994,995,1006,1010,1022,1023]],
 ['후목의 사당',[1001,1014,1015]],['진토의 사당',[1003,1014,1015]],
 ['화마의 사당',[1004,1014,1015]],['동파의 사당',[1002,1014,1015]],
 ['테라스탈동굴',[1017,970]],['에리어 제로 깊은곳',[1007,1008]],
 ['에리어 제로 최심부',[1024]],['악독한사슬',[1025]]
];
assert.deepEqual(value(`LOCATIONS.filter(l=>l.gen===9).slice(6).map(l=>[l.name,l.paradox?svEncounterPool(l):regionalRarePool(l)])`),paldea);
assert.equal(paldea[0][1].filter(id=>paldea[1][1].includes(id)).length,0);
const paldeaIds=value('LOCATIONS.filter(l=>l.gen===9).slice(6).map(l=>l.id)');
run(`S.battle=null;S.pending=null;S.party=['ace'];S.xp=6000;S.energy=12;S.tickets=10`);
for(const [stage,[name,ids]] of paldea.entries()){
 const key=paldeaIds[stage];
 for(const [i,id] of ids.entries()){
  run(`S.battle=null;S.energy=12;S.tickets=10;Math.random=()=>${(i+.1)/ids.length};combatStartLocation('${key}')`);
  assert.equal(run('S.energy'),stage<2?11:10);assert.equal(run('S.tickets'),stage<2?10:9);
  if(stage<2){for(const step of [0,2,4]){run(`S.battle.step=${step};prepareEnemy(S.battle)`);assert.equal(run('S.battle.foe.id'),id,name);}}
  else{assert.equal(run('S.battle.rareSpecies'),id,name);run('S.battle.step=4;prepareEnemy(S.battle)');assert.equal(run('S.battle.foe.id'),id,name);run('finishLocation(S.battle)');assert.equal(run('S.battle.rewardPokemon'),id,name);}
 }
}
for(const [key,xp] of [['paldea-zero-ancient',4300],['paldea-zero-research',4300],['paldea-terastal-cave',5300],['paldea-zero',5800]]){
 run(`S.battle=null;S.energy=12;S.tickets=10;S.xp=${xp};combatStartLocation('${key}')`);assert.equal(run('S.battle'),null);assert.equal(run('S.energy'),12);assert.equal(run('S.tickets'),10);
}
run(`S.xp=6000;S.battle=null;adventureGen=9;var paldeaHtml=regionalExplore()`);
for(const [i,[name]] of paldea.entries())assert.ok(run(`paldeaHtml.includes('${i+7}. ${name}')`));
console.log('PASS: Paldea 7–16 exact order/pools, 20 disjoint paradox species through every combat stage, mixed Ogerpon/Glimmora capture rewards and level/ticket/energy gates.');
