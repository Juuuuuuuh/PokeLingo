const assert = require("node:assert/strict");
const { createGame } = require("./harness.cjs");
const { run, el } = createGame();
run(
  `S.pending=null;S.battle=null;S.xp=6000;S.energy=12;S.mons=[];S.party=[];S.locationClears=[];S.manualClears=[];var m=enrich({uid:'ace',id:445,lv:100,candy:0,ivs:Array(6).fill(31),evs:[252,252,0,0,0,4]});S.mons=[m];S.party=[m.uid];m.moves=[89,337,242,33];m.learnedMoves=[...m.moves];m.moveArchive=[...m.moves];m.moveOffers=[];m.moveSeen=[...new Set([...currentNaturalMoves(m),...m.moves])];`,
);
run(`combatStartLocation('kanto-forest','auto')`);
assert.equal(run("S.battle"), null);
assert.equal(run("S.energy"), 12);
run(
  `combatStartLocation('kanto-forest');var b=S.battle;finishLocation(b);var coins=S.coins;finishLocation(b)`,
);
assert.equal(run("S.coins"), run("coins"));
assert.equal(run("S.energy"), 11);
assert.ok(run(`S.manualClears.includes('kanto-forest')`));
run(`S.battle=null;S.pending=null;combatStartLocation('kanto-forest','auto')`);
assert.equal(run("S.energy"), 10);
assert.equal(run("S.battle.mode"), "auto");
assert.ok(run("S.battle.finished"));
assert.ok(run("S.battle.autoReport.turns>0&&S.battle.autoReport.turns<=400"));
assert.ok(run("S.battle.autoReport.won"));
assert.ok(
  run(
    "Object.values(S.battle.fighters.ace.pp).some((v,i)=>v<Object.values(S.battle.fighters.ace.ppMax)[i])",
  ),
);
run(`S.battle=null;S.energy=0;combatStartLocation('kanto-forest')`);
assert.equal(run("S.battle"), null);
run(`S.energy=12;S.gym.type='불꽃';startArena('gym')`);
assert.equal(run("S.battle"), null);
assert.equal(run("S.energy"), 12);
run(`S.gym.type='드래곤';startArena('gym')`);
assert.equal(run("S.energy"), 11);
assert.equal(run("S.battle.kind"), "arena");
assert.ok(run('arenaBattleView().includes("체육관")'));
// Play genuine damage/PP turns through all three opposing Pokemon.
run(
  `var guard=0;while(!S.battle.finished&&guard++<200){var b=S.battle;if(b.phase==='fight')combatAction('move:'+enemyMove(activeFighter(b),b.foe).id);else if(b.phase==='arena-next')combatAction('arena-next');else break}`,
);
assert.ok(run("S.battle.won"));
assert.equal(run("S.gym.wins"), 1);
run(
  `S.battle=null;S.gym.streak=4;for(var i=0;i<3;i++){S.energy=12;startArena('gym');finishArena(S.battle,false);S.battle=null}`,
);
assert.equal(run("S.gym.streak"), 0);
assert.equal(run("S.gym.strikes"), 0);
assert.equal(run("S.gym.rank"), 1);
assert.equal(run("S.mons.length"), 1);
// Full 9-foe cup routing, normalization and no duplicate first-win rewards.
run(
  `S.gym.wins=3;S.registered=DB.slice(0,10).map(m=>m.id);S.energy=12;m.heldItem='focus-sash';var ownedLevel=m.lv;var memory=JSON.stringify(m.learnedMoves);startArena('pwt','kanto-cup')`,
);
assert.equal(run("activeFighter(S.battle).level"), 50);
assert.equal(run("m.lv"), 100);
assert.equal(run("JSON.stringify(m.learnedMoves)"), run("memory"));
assert.equal(run(`useInventoryItem('potion',m.uid).ok`), false);
run(
  `var rounds=0;while(!S.battle.finished&&rounds++<15){S.battle.foe.hp=0;evaluateBattleOutcome(S.battle,[]);if(!S.battle.finished)combatAction('arena-next')}var tickets=S.tickets;finishArena(S.battle,true)`,
);
assert.equal(run("S.battle.trainerIndex"), 2);
assert.equal(run("S.battle.foeIndex"), 2);
assert.equal(run("S.trophies.length"), 1);
assert.equal(run("S.tickets"), run("tickets"));
assert.equal(run("m.heldItem"), "focus-sash");
run(
  `S.battle=null;S.energy=12;startArena('pwt','kanto-cup');finishArena(S.battle,true)`,
);
assert.equal(run("S.tickets"), run("tickets"));
// Every roster is SV compatible and every configured move obeys that species' level/TM list.
assert.ok(
  run(
    `PWT_CUPS.flatMap(c=>c.trainers).concat(GYM_CHALLENGERS).every(t=>t.team.every(id=>LEARNSETS[id]?.available&&challengeFighter(id,50).moves.every(mid=>MOVES[mid].supported&&[...LEARNSETS[id].level.filter(([lv])=>lv<=50).map(([,mid])=>mid),...LEARNSETS[id].machine,...LEARNSETS[id].form].includes(mid))))`,
  ),
);
run(
  `S.battle=null;S.energy=1;S.tasks=[{id:'energy',name:'에너지 테스트',done:false,size:1,minutes:20,difficulty:2,importance:2}];complete('energy')`,
);
el("#confirmdone").onclick();
const energy = run("S.energy");
assert.ok(energy > 1 && energy <= 4);
el("#confirmdone").onclick();
assert.equal(run("S.energy"), energy);
run(`var before=S.energy;initializeModes();initializeModes()`);
assert.equal(run("S.energy"), run("before"));
run(`go('arena');go('explore')`);
console.log(
  "PASS: manual-clear auto gates, real automatic damage/PP battles, finite goal energy, idempotent rewards, gym type restrictions/3-foe combat/three losses, full PWT routing/normalization/bag lock/trophies, SV roster legality and save-compatible menus.",
);
