const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {createGame}=require('./harness.cjs');const {run,root}=createGame({location:{search:'?demo=explore',pathname:'/'}});const value=s=>JSON.parse(run(`JSON.stringify(${s})`));
assert.ok(run(`combatView().includes('싸운다')&&combatView().includes('포켓몬')&&combatView().includes('도망간다')`));assert.ok(!run(`combatView().includes('class="move-button"')`));
run(`var b=S.battle;var before=JSON.stringify({hp:b.hp,ehp:b.ehp,pp:activeFighter(b).pp});combatAction('ui:fight')`);assert.equal(run('battlePane(b)'),'fight');assert.equal(run(`(combatView().match(/data-action="move:/g)||[]).length`),4);assert.equal(run('JSON.stringify({hp:b.hp,ehp:b.ehp,pp:activeFighter(b).pp})'),run('before'));
run(`combatAction('ui:back');combatAction('ui:party')`);assert.equal(run('battlePane(b)'),'party');assert.equal(run(`(combatView().match(/class="duel-party-choice/g)||[]).length`),3);run(`combatAction('ui:back')`);assert.equal(run('battlePane(b)'),'command');assert.equal(run('JSON.stringify({hp:b.hp,ehp:b.ehp,pp:activeFighter(b).pp})'),run('before'));
// Real dual-type labels, status labels, low PP restrictions and Struggle fallback.
run(`var a=activeFighter(b);var rock=makeEnemy(74,12);var grass=makeEnemy(1,12);var water=makeEnemy(130,12)`);
assert.equal(run('battleMoveHint(MOVES[84],a,rock).kind'),'immune');assert.equal(run('battleMoveHint(MOVES[84],a,water).kind'),'strong');assert.equal(run('battleMoveHint(MOVES[84],a,grass).kind'),'weak');assert.equal(run('battleMoveHint(MOVES[86],a,rock).kind'),'status');
run(`combatAction('ui:fight');a.pp[84]=0;var html=combatView()`);assert.ok(run(`html.includes('PP가 없어요')`));run(`for(const id of a.moves)a.pp[id]=0`);assert.ok(run(`combatView().includes('data-action="move:165"')`));
run(`for(const id of a.moves)a.pp[id]=a.ppMax[id];combatAction('ui:fight');var oldPP=a.pp[84];combatAction('move:84')`);assert.equal(run('a.pp[84]'),run('oldPP')-1);assert.equal(run('b.uiPane'),'command');
// A forced switch cannot be cancelled and is free (no opponent response).
run(`b.finished=false;b.phase='forced-switch';a.hp=0;var foeHP=b.foe.hp;combatAction('ui:back')`);assert.equal(run('battlePane(b)'),'party');assert.ok(!run(`combatView().includes('data-action="ui:back"')`));run(`combatAction('switch:demo-bulbasaur')`);assert.equal(run('b.phase'),'fight');assert.equal(run('b.foe.hp'),run('foeHP'));assert.equal(run('activeFighter(b).id'),1);
// Arena shares the renderer but retains its rules; UI locks do not replace engine enforcement.
run(`S.battle=null;S.xp=6000;S.energy=12;S.registered=DB.slice(0,10).map(m=>m.id);S.gym.wins=3;startArena('pwt','kanto-cup');var arenaHTML=arenaBattleView()`);
assert.ok(run(`arenaHTML.includes('mainline-battle')&&arenaHTML.includes('PWT 사용 금지')&&arenaHTML.includes('id="arena-forfeit"')`));assert.ok(!run(`arenaHTML.includes('id="retreatnew"')`));assert.equal(run(`useInventoryItem('potion',S.party[0]).ok`),false);
// Every national species has a real local rear sprite. Forms without one use their existing front.
const ids=value('BACK_SPRITES');for(let id=1;id<=1025;id++)assert.ok(ids.includes(id),id);
for(const id of ids){const png=fs.readFileSync(path.join(root,'web/assets/back',id+'.png'));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a')}
assert.ok(run(`battleSprite(makeEnemy(25,12),'player').includes('assets/back/25.png')`));assert.ok(run(`battleSprite(makeEnemy(25,12),'opponent').includes('assets/25.png')`));
console.log('PASS: mainline commands/move/party panes consume no turns, move PP/effectiveness/Struggle, forced switch, shared PWT restrictions and 1,025 rear sprite coverage.');
