/* Keep the Lv.55/60 rare gates and existing 100 EXP trainer curve intact. */
const FIRST_QUEST_XP = 100;
const ATTENDANCE_XP = 10;
const STARTER_LEVEL = 5;
for (let gen = 1; gen <= 9; gen++) {
  const first = LOCATIONS.find(l => l.gen === gen && !l.rareKind && !l.paradox);
  if (first) { first.required = 1; first.firstTrail = true; }
}
function initializeJourneyBalance() {
  if (S.journeyWelcomeVersion !== 1) {
    S.items['rare-candy'] = (S.items['rare-candy'] || 0) + 4;
    S.items.potion = (S.items.potion || 0) + 3;
    S.journeyWelcomeVersion = 1;
    addLog('출발 지원 선물: 이상한사탕 4개와 상처약 3개를 받았어요.');
  }
  S.firstQuestBonusClaimed = S.firstQuestBonusClaimed === true;
}
function awardFirstQuestBonus() {
  if (S.firstQuestBonusClaimed) return 0;
  S.firstQuestBonusClaimed = true;
  S.xp += FIRST_QUEST_XP;
  addLog(`첫 목표 완료! 출발 보너스 +${FIRST_QUEST_XP} EXP`);
  return FIRST_QUEST_XP;
}
const prepareEnemyBeforeJourney = prepareEnemy;
prepareEnemy = function(b) {
  prepareEnemyBeforeJourney(b);
  const location = LOCATIONS.find(l => l.id === b.location);
  if (b.kind === 'arena' || !location?.firstTrail || S.locationClears.includes(location.id)) return;
  const average = Math.round(b.party.reduce((sum,uid) => sum+b.fighters[uid].level,0)/b.party.length);
  if (average > 10) return;
  b.foe = makeEnemy(b.foe.id, Math.max(1, average-2+(b.step===4?1:0)));
  syncBattle(b);
};
function chooseStarter(id) {
  if (S.starter || ![1,4,7].includes(id)) return false;
  const m = enrich({uid:crypto.randomUUID(), id, lv:STARTER_LEVEL, candy:0, shiny:false});
  S.starter = id;
  S.mons.push(m);
  S.party.push(m.uid);
  S.house.push(id);
  if (!S.registered.includes(id)) S.registered.push(id);
  addLog(`${mon(id).name}와 첫 모험을 시작했어요.`);
  save(); close(); render();
  toast('첫 탐험은 Lv.1부터! 목표를 완료하면 보너스 100 EXP를 받아요.');
  return true;
}
function claimDailyAttendance() {
  if (S.attendance.includes(day())) return false;
  S.attendance.push(day());
  S.coins += 10;
  S.xp += ATTENDANCE_XP;
  addLog('오늘의 출석 선물: +10코인 · +10 EXP');
  save(); render();
  toast('오늘도 반가워요! +10코인 · +10 EXP');
  return true;
}
