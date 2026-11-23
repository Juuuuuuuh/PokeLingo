const assert = require('node:assert/strict');
const {createGame} = require('./harness.cjs');
const options = {location:{search:'?demo=home',pathname:'/'}};

for (const expected of [
  {location:'hoenn-origin',stage:9,species:382,form:10077,name:'원시 가이오가',orb:'blue-orb',types:['물'],stats:[100,150,90,180,160,90]},
  {location:'hoenn-land',stage:10,species:383,form:10078,name:'원시 그란돈',orb:'red-orb',types:['땅','불꽃'],stats:[100,180,160,150,90,90]},
]) {
  const {run,storage} = createGame(options);
  const value = expression => JSON.parse(run(`JSON.stringify(${expression})`));
  run(`S.xp=6000;S.energy=12;S.tickets=10;S.party=['demo-pikachu'];
    S.items['${expected.orb}']=0;combatStartLocation('${expected.location}');
    var b=S.battle;b.step=4;prepareEnemy(b);var a=activeFighter(b);
    a.hp=a.max=9999;a.moves=[98];a.pp[98]=a.ppMax[98]=30;a.stats[5]=999;a.stages.atk=2;a.stages.spa=2;
    b.foe.hp=1;b.foe.stats[5]=1;
    var before={coins:S.coins,xp:S.xp,candy:S.items['rare-candy']||0,pp:a.pp[98]};`);
  assert.equal(run(`LOCATIONS.find(l=>l.id==='${expected.location}').stage`),expected.stage);
  assert.equal(run('b.bossPhase'),1);
  assert.equal(run('b.foe.id'),expected.species);
  assert.equal(run('b.foe.form||0'),0);
  run('resolveCombatTurn(b,98,null,null,()=>.1)');
  assert.equal(run('b.bossPhase'),2);
  assert.equal(run('b.foe.form'),expected.form);
  assert.equal(run('b.foe.name'),expected.name);
  assert.equal(run('b.foe.hp'),run('b.foe.max'));
  assert.deepEqual(value('b.foe.types'),expected.types);
  const lv=run('b.foe.level');
  assert.deepEqual(value('b.foe.stats'),expected.stats.map((base,i)=>
    Math.floor((2*base+15)*lv/100)+(i===0?lv+10:5)));
  assert.equal(run('b.finished'),false);
  assert.equal(run('b.phase'),'fight');
  assert.equal(run('a.hp'),9999);
  assert.equal(run('a.pp[98]'),run('before.pp')-1);
  assert.equal(run('a.stages.atk'),2);
  assert.equal(run('a.stages.spa'),2);
  assert.equal(run('S.coins'),run('before.coins'));
  assert.equal(run('S.xp'),run('before.xp'));
  assert.equal(run(`S.items['rare-candy']||0`),run('before.candy'));
  assert.equal(run(`S.items['${expected.orb}']`),0);
  assert.equal(run(`S.locationClears.includes('${expected.location}')`),false);
  assert.equal(run('b.rewardPokemon||0'),0);
  assert.equal(run('S.tickets'),9);
  assert.equal(run('S.energy'),10);
  // Calling the reward helper directly cannot bypass the second HP bar.
  assert.equal(run('finishExpeditionWithRewards(b)'),false);
  assert.equal(run('b.rewardGranted||false'),false);
  assert.ok(run(`renderMainlineBattle(b).includes('assets/form-${expected.form}.png')`));
  run('save();S.battle=null;adventureGen=3');
  assert.ok(run(`regionalExplore().includes('2페이즈 · ${expected.name}')`));

  const resumed=createGame({...options,storage:{
    'growth-expedition-demo-v1':storage.get('growth-expedition-demo-v1'),
  }});
  assert.equal(resumed.run('S.battle.bossPhase'),2);
  assert.equal(resumed.run('S.battle.foe.form'),expected.form);
  assert.equal(resumed.run('activeFighter(S.battle).pp[98]'),run('before.pp')-1);
  // Automatic play uses the same second phase and awards only the final victory.
  resumed.run(`var b=S.battle;b.mode='auto';b.foe.hp=1;b.foe.stats[5]=1;
    activeFighter(b).stats[5]=999;runAutoExpedition();`);
  assert.equal(resumed.run('b.finished'),true);
  assert.equal(resumed.run('b.rewardGranted'),true);
  assert.equal(resumed.run('b.rewardPokemon'),expected.species);
  assert.equal(resumed.run('b.rewardForm||0'),0);
  assert.equal(resumed.run(`S.items['${expected.orb}']`),1);
  assert.equal(resumed.run(`S.bossPhaseClears['${expected.location}']`),2);
  assert.equal(resumed.run('S.tickets'),9);
  assert.equal(resumed.run('S.energy'),10);
  resumed.run(`var paid=JSON.stringify([S.coins,S.xp,S.items]);finishExpeditionWithRewards(b);`);
  assert.equal(resumed.run('JSON.stringify([S.coins,S.xp,S.items])'),resumed.run('paid'));
}
console.log('PASS: Kyogre/Groudon actual turns immediately refill into exact primal forms, preserve player condition and costs, persist phase two, and grant first-clear orbs only after the final win.');
