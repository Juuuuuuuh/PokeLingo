'use strict';
globalThis.RewardRules={
 normalize(v){const score=x=>Math.max(1,Math.min(5,Math.round(Number(x)||1)));return{difficulty:score(v.difficulty),importance:score(v.importance),effort:score(v.effort),reason:String(v.reason||'활동 시간과 목표 내용을 기준으로 평가했어요.').slice(0,600)}},
 calculate(minutes,assessment){const a=this.normalize(assessment),m=Math.max(5,Math.min(240,Number(minutes)||25)),coins=Math.min(240,Math.round(10+m*1.2+(a.difficulty-1)*8+(a.importance-1)*5+(a.effort-1)*5)),xp=Math.round(coins*.5);return{coins,xp,training:Math.max(1,Math.floor(xp/10))}},
 fallback(task){const text=task.name+' '+(task.context||''),m=Number(task.minutes)||25;return this.normalize({difficulty:/논문|설계|알고리즘|기출|개발|프로젝트|자격증/.test(text)?4:/복습|정리|걷기|청소/.test(text)?2:3,importance:/마감|시험|제출|자격증/.test(text)?4:3,effort:m>=90?5:m>=50?4:m>=25?3:m>=15?2:1,reason:'기본 규칙 계산: 목표의 핵심 단어와 예상 시간을 이용했어요. 마감·시험·제출 표현은 중요도에, 설계·기출·개발 표현은 난이도에 반영해요. 실제 AI 평가가 아니에요.'})}
};
