/* An explicit demo uses a separate save key; the user's real save is never read or changed. */
const DEMO_SCENE = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('demo') : null;
const DEMO_MODE = ['home','tasks','explore'].includes(DEMO_SCENE);
function createDemoSave(){
 const today=day();
 const tasks=[{id:'demo-study',name:'자격증 기출문제 20개 풀이',category:'공부',minutes:25,context:'시험 준비를 위한 예시 미션'},{id:'demo-walk',name:'가볍게 20분 걷기',category:'운동',minutes:20,context:'매일 실천하는 예시 미션'}].map(t=>{const assessment=RewardRules.fallback(t);return {...t,size:1,assessment,reward:RewardRules.calculate(t.minutes,assessment),source:'fallback',done:false}});
 return {version:1,demoVersion:1,coins:120,tickets:1,xp:200,starter:25,mons:[{uid:'demo-pikachu',id:25,lv:12},{uid:'demo-bulbasaur',id:1,lv:12},{uid:'demo-eevee',id:133,lv:12}],party:['demo-pikachu','demo-bulbasaur','demo-eevee'],house:[25,1,133],registered:[25,1,133],tasks,days:[],claims:[],weekly:[],scouts:0,clears:[],locationClears:[],manualClears:[],logs:[{date:today,text:'체험용 미션과 Lv.12 파티를 준비했어요. 보상과 전투는 실제 게임 규칙으로 진행해요.'}],lastDay:today,attendance:[],battle:null,training:0,items:{potion:3,'super-potion':1,'rare-candy':3},modesVersion:1,energy:6,candyEconomyVersion:1};
}
function renderDemoBanner(){
 const banner=$('#demo-banner');if(!banner)return;banner.hidden=!DEMO_MODE;if(!DEMO_MODE)return;
 banner.innerHTML=`<div><b>체험 모드</b><span>예시 미션 · Lv.12 파티 · 내 게임 기록과 별도 저장</span></div><div class="demo-actions"><button data-page="tasks">미션 보기</button><button data-page="explore">탐험 보기</button><button id="demo-reset">체험 초기화</button><a href="${esc(location.pathname)}">내 게임으로</a></div>`;
 $('#demo-reset').onclick=()=>{localStorage.removeItem(KEY);location.reload()};
}
function openDemoScene(){if(!DEMO_MODE)return;go(DEMO_SCENE);if(DEMO_SCENE==='explore'&&!S.battle)combatStartLocation('kanto-moon');}
