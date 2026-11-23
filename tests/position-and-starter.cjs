const assert=require('node:assert/strict');
const {createGame}=require('./harness.cjs');
const g=createGame({location:{search:'?demo=home',pathname:'/'}}),{run,el,c}=g;
const view=el('#view'),dialog=el('#modal'),body=el('#modalbody');
// Simulate the browser clamping a scrolled document while its DOM is replaced.
// This checks the app's restoration behavior; it is not a real browser layout test.
c.window.scrollX=0;c.window.scrollY=900;
c.window.scrollTo=options=>{c.window.scrollY=options.top;c.window.scrollX=options.left||0;};
let viewHTML=view.innerHTML;
Object.defineProperty(view,'innerHTML',{configurable:true,get(){return viewHTML},set(value){viewHTML=value;c.window.scrollY=0;}});
run('render()');assert.equal(c.window.scrollY,900);
run("go('shop')");assert.equal(c.window.scrollY,0);
c.window.scrollY=1000;
run("itemShopTab='기술 도구';render()");assert.equal(c.window.scrollY,1000);
run("go('shop')");assert.equal(c.window.scrollY,1000); // choosing the current section is not navigation
run("go('dex')");assert.equal(c.window.scrollY,0);
c.window.scrollY=650;
let focusOptions;
const search=el('#dexsearch');search.id='dexsearch';search.selectionStart=2;search.selectionEnd=2;
search.focus=options=>{focusOptions=options;if(!options?.preventScroll)c.window.scrollY=0;};
view.contains=node=>node===search;view.querySelector=selector=>selector==='#dexsearch'?search:null;
c.document.activeElement=search;
run("dexQuery='피카';render()");assert.equal(c.window.scrollY,650);
assert.equal(focusOptions.preventScroll,true);
c.document.activeElement=null;
for(const id of ['#dexnext','#dexprev']) el(id).addEventListener=(type,handler)=>{el(id).onclick=handler;};
run("dexQuery='';dexPage=0;render()");c.window.scrollY=800;
el('#dexnext').onclick();assert.equal(c.window.scrollY,800);assert.equal(run('dexPage'),1);
el('#dexprev').onclick();assert.equal(c.window.scrollY,800);assert.equal(run('dexPage'),0);
c.window.scrollY=650;
// Reopening the same editor preserves both the dialog and its independently scrolled list.
let showCount=0,modalHTML=body.innerHTML;
const list={scrollTop:0,scrollLeft:0};
dialog.showModal=()=>{dialog.open=true;showCount++;c.window.scrollY=0;};
dialog.close=()=>{dialog.open=false;c.window.scrollY=0;};
dialog.querySelectorAll=selector=>selector==='.learnset-list'?[list]:[];
Object.defineProperty(body,'innerHTML',{get(){return modalHTML},set(value){modalHTML=value;dialog.scrollTop=0;list.scrollTop=0;}});
run('showMoveEditor(25)');assert.equal(showCount,1);assert.equal(c.window.scrollY,650);
dialog.scrollTop=270;list.scrollTop=1200;
run("moveTab='machine';renderMoveEditor(S.mons[0])");
assert.equal(showCount,1);assert.equal(dialog.scrollTop,270);assert.equal(list.scrollTop,1200);
run("modal('<h2>확인</h2><p>새 선택</p>')");assert.equal(dialog.scrollTop,0);
run('renderMoveEditor(S.mons[0])');assert.equal(dialog.scrollTop,270);assert.equal(list.scrollTop,1200);
run('close()');assert.equal(c.window.scrollY,650);
// Closing with native Escape uses the same restoration without calling the close button.
run('showMoveEditor(25)');dialog.open=false;c.window.scrollY=0;
run('restoreAfterDialogClose()');assert.equal(c.window.scrollY,650);
// Open help sections are kept before restoring scroll, so their height does not disappear.
const help={id:'test-help',open:true};
view.querySelectorAll=selector=>selector==='details[id]'?[help]:[];
view.querySelector=selector=>selector==='[id="test-help"]'?help:null;
let stored=viewHTML;
Object.defineProperty(view,'innerHTML',{configurable:true,get(){return stored},set(value){stored=value;c.window.scrollY=0;help.open=false;}});
run('render()');assert.equal(help.open,true);assert.equal(c.window.scrollY,650);

for(const id of [1,4,7]) {
  const game=createGame();
  assert.equal(game.run(`chooseStarter(${id})`),true);
  assert.equal(game.run('S.mons[0].lv'),5);
  assert.equal(game.run('S.starterUid'),game.run('S.mons[0].uid'));
  const other=[1,4,7].find(x=>x!==id);
  game.run(`receive(${other});close();S.mons[0].lv=1;delete S.starterUid;save()`);
  assert.equal(game.run(`S.mons.find(m=>m.id===${other}).lv`),1);
  const saved=game.storage.get('growth-expedition-v1');
  const loaded=createGame({storage:{'growth-expedition-v1':saved}});
  assert.equal(loaded.run('S.mons[0].lv'),5); // legacy original gift is promoted once, without candy
  assert.equal(loaded.run(`S.mons.find(m=>m.id===${other}).lv`),1);
  assert.equal(loaded.run(`S.items['rare-candy']`),game.run(`S.items['rare-candy']`));
  loaded.run('S.mons[0].lv=30;migrate()');assert.equal(loaded.run('S.mons[0].lv'),30);
  loaded.run(`S.mons[0].id=${id===1?2:id===4?5:8};delete S.starterUid;receive(${id});close();migrate()`);
  assert.equal(loaded.run(`S.mons.find(m=>m.id===${id}).lv`),1); // caught later after the gift evolved
}
console.log('PASS: same-view updates, searches and repeated editor selections preserve page/dialog/list scroll and focus; only the chosen original Kanto starter starts or is corrected to Lv.5, while later recruits stay Lv.1 and higher/evolved partners remain intact.');
