/* Replacing a view must not discard the player's reading/selection position. */
function captureControlFocus(root) {
  const active = document.activeElement;
  if (!active || !root?.contains?.(active)) return null;
  let selector = active.id ? '#'+active.id : null;
  if (!selector) for (const name of ['data-party','data-filter','data-dexfilter','data-item-tab','data-shopkind','data-adventuregen','data-action','data-auto-location','data-detail','data-move-editor','data-game-buy','data-scout','data-location','data-movetab','data-equip-held','data-house','data-memory-move','data-page']) {
    const value = active.getAttribute?.(name);
    if (value !== null && value !== undefined) { selector = `[${name}=${JSON.stringify(value)}]`; break; }
  }
  return selector ? {selector,start:active.selectionStart,end:active.selectionEnd} : null;
}
function restoreControlFocus(root, state) {
  if (!state) return;
  const control = root?.querySelector?.(state.selector);
  if (!control) return;
  control.focus?.({preventScroll:true});
  if (Number.isInteger(state.start) && control.setSelectionRange) {
    try { control.setSelectionRange(state.start,state.end); } catch {}
  }
}
function captureOpenDetails(root) {
  return Array.from(root?.querySelectorAll?.('details[id]')||[],node=>({id:node.id,open:node.open}));
}
function restoreOpenDetails(root, sections=[]) {
  for (const section of sections) {
    const node=root?.querySelector?.(`[id=${JSON.stringify(section.id)}]`);
    if (node) node.open=section.open;
  }
}
function capturePagePosition() {
  return {page:document.querySelector('#view')?.dataset.page,
    left:window.scrollX||0, top:window.scrollY||0,
    focus:captureControlFocus(document.querySelector('#view')),
    details:captureOpenDetails(document.querySelector('#view'))};
}
function restorePagePosition(position, focus=true) {
  if (!position || position.page !== document.querySelector('#view')?.dataset.page) return;
  restoreOpenDetails(document.querySelector('#view'),position.details);
  if (focus) restoreControlFocus(document.querySelector('#view'),position.focus);
  window.scrollTo({left:position.left,top:position.top,behavior:'instant'});
}
const MODAL_SCROLL_LISTS = ['.learnset-list','.inventory-list','.housechoices'];
const modalPositions = new Map();
let currentModalKey = null, modalOrigin = null;
function captureModalPosition() {
  const dialog = document.querySelector('#modal');
  return {top:dialog.scrollTop||0,left:dialog.scrollLeft||0,focus:captureControlFocus(dialog),details:captureOpenDetails(dialog),
    lists:MODAL_SCROLL_LISTS.flatMap(selector=>Array.from(dialog.querySelectorAll(selector),
      (node,index)=>({selector,index,top:node.scrollTop||0,left:node.scrollLeft||0})))};
}
function restoreModalPosition(position) {
  const dialog = document.querySelector('#modal');
  if (!position) { dialog.scrollTop=0; dialog.scrollLeft=0; return; }
  restoreOpenDetails(dialog,position.details);
  restoreControlFocus(dialog,position.focus);
  dialog.scrollTop=position.top; dialog.scrollLeft=position.left;
  for (const list of position.lists) {
    const node = dialog.querySelectorAll(list.selector)[list.index];
    if (node) { node.scrollTop=list.top; node.scrollLeft=list.left; }
  }
}
function showGameModal(html, key) {
  const dialog = document.querySelector('#modal');
  if (!dialog.open) {
    modalOrigin = capturePagePosition();
    modalPositions.clear();
    currentModalKey = null;
  } else if (currentModalKey) modalPositions.set(currentModalKey,captureModalPosition());
  const sameKey = key || html.match(/<h2(?:\s[^>]*)?>([\s\S]*?)<\/h2>/i)?.[1] || 'dialog';
  document.querySelector('#modalbody').innerHTML=html;
  if (!dialog.open) dialog.showModal();
  currentModalKey=sameKey;
  restoreModalPosition(modalPositions.get(sameKey));
  restorePagePosition(modalOrigin,false);
}
function restoreAfterDialogClose() {
  if (document.querySelector('#modal').open) return;
  const origin=modalOrigin;
  modalOrigin=null; currentModalKey=null; modalPositions.clear();
  restorePagePosition(origin);
}
function closeGameModal() {
  document.querySelector('#modal').close();
  restoreAfterDialogClose();
}
