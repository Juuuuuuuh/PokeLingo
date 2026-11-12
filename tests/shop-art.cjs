const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {createGame}=require('./harness.cjs');const {run,root,el}=createGame();const value=s=>JSON.parse(run(`JSON.stringify(${s})`));
const items=value('shopItemsAll()'),tms=value('TM_CATALOG'),art=value('ITEM_ART'),tmArt=value('TM_ART');
assert.equal(items.length,116);assert.equal(tms.length,229);assert.equal(Object.keys(art).length,items.length);
const paths=new Set();
for(const i of items){assert.ok(art[i.id]?.sprites.length,i.id);for(const p of art[i.id].sprites)paths.add(p)}
for(const tm of tms){const type=run(`MOVES[${tm.move}].type`);assert.ok(tmArt[type]?.sprites.length);for(const p of tmArt[type].sprites)paths.add(p);assert.ok(run(`itemArtwork('tm-${tm.move}','기술머신').includes('tm-')`));}
for(const p of paths){assert.ok(p.startsWith('assets/items/'));const b=fs.readFileSync(path.join(root,'web',p));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',p);assert.ok(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0,p)}
for(const kind of [...new Set(items.map(i=>i.kind)),'기술머신']){
 run(`itemShopTab=${JSON.stringify(kind)};itemShopSearch='';var html=renderItemShop()`);
 assert.ok(!run(`html.includes('class="itemicon"')`));
 const ids=kind==='기술머신'?tms.map(t=>'tm-'+t.move):items.filter(i=>i.kind===kind).map(i=>i.id);
 for(const id of ids)assert.ok(run(`html.includes('data-item-art="${id}"')`),id);
}
const expensive=['meteorite','adamant','lustrous','griseous','gracidea','splicers','bottle','prism','reins','plates','drives'];const fusion=['splicers','prism','reins','plates'];
for(const i of items.filter(i=>i.kind==='폼 변경'))assert.equal(i.price,expensive.includes(i.id)?fusion.includes(i.id)?400:250:25,i.id);
assert.deepEqual(value(`ITEMS.filter(i=>FORMS.some(f=>f.item===i.id&&['초전설','환상'].includes(mon(f.species).rarity))).map(i=>i.id).sort()`),[...expensive].sort());
run(`S.battle=null;S.pending=null;S.items={};S.coins=249;S.tickets=3`);assert.equal(run(`buyGameItem('adamant').ok`),false);assert.equal(run('S.coins'),249);assert.equal(run('S.items.adamant'),undefined);
run('S.coins=1000');assert.equal(run(`buyGameItem('adamant').ok`),true);assert.equal(run('S.coins'),750);assert.equal(run('S.items.adamant'),1);assert.equal(run('S.tickets'),3);assert.equal(run(`buyGameItem('adamant').ok`),false);assert.equal(run('S.coins'),750);
assert.equal(run(`buyGameItem('reins').ok`),true);assert.equal(run('S.coins'),350);assert.equal(run(`buyGameItem('plates').ok`),false);assert.equal(run('S.coins'),350);assert.equal(run('S.items.plates'),undefined);
run(`S.items.catalog=0`);assert.equal(run(`buyGameItem('catalog').ok`),true);assert.equal(run('S.coins'),325);
// Existing permanent tools survive the price update and are never charged again.
run(`S.items.meteorite=1;var oldCoins=S.coins;migrate()`);assert.equal(run('S.items.meteorite'),1);assert.equal(run('S.coins'),run('oldCoins'));assert.equal(run(`buyGameItem('meteorite').ok`),false);assert.equal(run('S.coins'),run('oldCoins'));
run(`itemShopTab='폼 변경';itemShopSearch='운석';var html=renderItemShop()`);assert.ok(run(`html.includes('✓ 영구 보유')&&html.includes('data-item-art="meteorite"')`));
run(`S.items.potion=1;openInventory()`);assert.ok(el('#modalbody').innerHTML.includes('data-item-art="potion"'));
assert.equal(art.plates.sprites.length,17);assert.equal(art.memories.sprites.length,17);assert.equal(art.drives.sprites.length,4);
console.log(`PASS: all 116 item products and 229 TMs render local art (${paths.size} PNGs), bundles have complete image sets, premium 250/400 prices debit atomically, duplicate/permanent purchases and old saves preserve balances.`);
