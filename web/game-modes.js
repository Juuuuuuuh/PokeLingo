/* Shared battle rules for manual clears, finite auto expeditions and trainer cups. */
const ENERGY_CAP = 12;
function initializeModes() {
  if (S.modesVersion !== 1) {
    S.energy = 6;
    S.manualClears = [...S.locationClears];
    S.modesVersion = 1;
  }
  S.energy = Math.max(
    0,
    Math.min(ENERGY_CAP, Math.floor(Number(S.energy) || 0)),
  );
  S.manualClears = Array.isArray(S.manualClears) ? S.manualClears : [];
  S.gym = S.gym || {
    type: "노말",
    rank: 1,
    wins: 0,
    streak: 0,
    strikes: 0,
    rankClaims: [],
  };
  S.trophies = S.trophies || [];
}
function explorationCost(l) {
  return l.rareKind ? 2 : 1;
}
const startBeforeModes = combatStartLocation;
combatStartLocation = function (id, mode = "manual") {
  initializeModes();
  const l = LOCATIONS.find((l) => l.id === id);
  if (!l || S.battle) return false;
  if (
    mode === "auto" &&
    !(S.manualClears.includes(id) && S.locationClears.includes(id))
  )
    return toast("직접 클리어한 지역에서만 자동 전투를 사용할 수 있어요.");
  if (S.energy < explorationCost(l))
    return toast("탐험 에너지가 부족해요. 실제 목표를 완료해서 충전해주세요.");
  startBeforeModes(id);
  if (!S.battle) return false;
  S.energy -= explorationCost(l);
  S.battle.mode = mode;
  S.battle.energyCost = explorationCost(l);
  save();
  if (mode === "auto") runAutoExpedition();
  else render();
  return true;
};
const finishBeforeModes = finishExpeditionWithRewards;
finishExpeditionWithRewards = function (b) {
  if (b.rewardGranted) return;
  b.rewardGranted = true;
  finishBeforeModes(b);
  if (b.mode !== "auto" && !S.manualClears.includes(b.location))
    S.manualClears.push(b.location);
  save();
};
function runAutoExpedition() {
  const b = S.battle;
  if (!b || b.mode !== "auto" || b.kind === "arena") return;
  let turns = 0;
  while (!b.finished && turns < 400) {
    turns++;
    const a = activeFighter(b);
    if (b.phase === "fight") {
      const move = enemyMove(a, b.foe);
      resolveCombatTurn(b, move.id);
    } else if (b.phase === "forced-switch") {
      const i = b.party.findIndex((uid) => b.fighters[uid].hp > 0);
      if (i < 0) {
        b.finished = true;
        refundTicket(b);
        break;
      }
      switchFighter(b, i, []);
      b.phase = "fight";
    } else if (b.phase === "observation") {
      finishExpeditionWithRewards(b);
    } else if (b.phase === "choice") {
      healFighter(a, 30);
      b.phase = "next";
    } else {
      b.step++;
      if (b.step === 1) b.phase = "choice";
      else if ([2, 4].includes(b.step)) {
        prepareEnemy(b);
        b.phase = b.observationOnly ? "observation" : "fight";
      } else {
        for (const uid of b.party) {
          const f = b.fighters[uid];
          if (f.hp > 0) f.hp = f.max;
        }
        b.phase = "next";
      }
    }
  }
  if (!b.finished) {
    b.finished = true;
    refundTicket(b);
    b.log = "400회 행동 제한에 도달해 자동 탐험을 중단했어요.";
  }
  b.autoReport = { turns, won: !!b.rewardGranted };
  b.log = `자동 전투 ${turns}회 행동 · ${b.rewardGranted ? "클리어" : "실패"} · ${b.log}`;
  syncBattle(b);
  save();
  render();
}
const exploreBeforeModes = regionalExplore;
regionalExplore = function () {
  initializeModes();
  let html = exploreBeforeModes();
  if (S.battle) return html;
  html =
    `<div class="notice">탐험 에너지 <b>${S.energy} / ${ENERGY_CAP}</b> · 목표 완료 시 1~3 충전 · 일반 1 / 특별 2 소모<br>첫 클리어는 직접 기술을 선택해 진행해요. 직접 클리어한 지역만 자동 전투가 열려요. 자동 전투도 현재 파티·기술·PP·지니는 도구로 승패를 계산해요. 패배·중단 시 에너지는 돌아오지 않아요.</div>` +
    html;
  return html.replace(
    /(<button class="primary" data-location="([^"]+)"[\s\S]*?<\/button>)/g,
    (all, button, id) =>
      button +
      `<button class="secondary full" data-auto-location="${id}" ${!S.manualClears.includes(id) || !S.locationClears.includes(id) || S.energy < explorationCost(LOCATIONS.find((l) => l.id === id)) ? "disabled" : ""}>${S.manualClears.includes(id) ? "자동 전투" : "직접 클리어 후 자동 전투 해금"}</button>`,
  );
};
function arenaUnlocked(mode) {
  return mode === "gym"
    ? level() >= 8
    : level() >= 20 && S.registered.length >= 10 && S.gym.wins >= 3;
}
function challengeFighter(id, lv) {
  const f = makeEnemy(id, lv),
    l = LEARNSETS[String(id)];
  const legal = new Set([
    ...(l?.level || []).filter(([n]) => n <= lv).map(([, m]) => m),
    ...(l?.machine || []),
    ...(l?.form || []),
  ]);
  f.moves = [
    ...new Set([
      ...(CHALLENGE_MOVESETS[id] || []).filter(
        (m) => legal.has(m) && MOVES[m]?.supported,
      ),
      ...f.moves,
    ]),
  ].slice(0, 4);
  f.pp = Object.fromEntries(f.moves.map((id) => [id, MOVES[id].pp]));
  f.ppMax = { ...f.pp };
  return f;
}
function startArena(mode, cupId) {
  initializeModes();
  if (S.battle) return toast("현재 전투를 먼저 마쳐주세요.");
  if (S.pending || !arenaUnlocked(mode) || !S.party.length)
    return toast("도전 조건과 영입 대기 상태를 확인해주세요.");
  const members = S.party.map((uid) => S.mons.find((m) => m.uid === uid));
  if (members.some((m) => !learnsetFor(m)?.available || !m.moves.length))
    return toast("파티의 스바 기술 배치를 확인해주세요.");
  if (
    mode === "gym" &&
    members.some((m) => !(formData(m) || mon(m.id)).types.includes(S.gym.type))
  )
    return toast("체육관 파티 전원이 주력 타입을 가지고 있어야 해요.");
  const cup = PWT_CUPS.find((c) => c.id === cupId);
  if (mode === "pwt" && !cup) return;
  const cost = mode === "pwt" ? 2 : 1;
  if (S.energy < cost) return toast("탐험 에너지가 부족해요.");
  S.energy -= cost;
  const trainers =
    mode === "pwt"
      ? cup.trainers
      : [GYM_CHALLENGERS[S.gym.wins % GYM_CHALLENGERS.length]];
  const b = (S.battle = {
    kind: "arena",
    arenaMode: mode,
    cupId: cup?.id,
    trainers,
    trainerIndex: 0,
    foeIndex: 0,
    party: [...S.party],
    active: 0,
    step: 0,
    phase: "fight",
    finished: false,
    combatVersion: 1,
    regionPoolVersion: 1,
    energyCost: cost,
    heldSnapshot: Object.fromEntries(
      members.map((m) => [m.uid, m.heldItem || null]),
    ),
    fighters: Object.fromEntries(
      members.map((m) => {
        const copy = JSON.parse(JSON.stringify(m));
        if (mode === "pwt") copy.lv = 50;
        return [m.uid, makeFighter(copy)];
      }),
    ),
    log: "트레이너 대결을 시작해요.",
  });
  prepareArenaEnemy(b);
  save();
  go("arena");
}
function prepareArenaEnemy(b) {
  for (const f of Object.values(b.fighters)) resetEntry(f);
  b.foe = challengeFighter(
    b.trainers[b.trainerIndex].team[b.foeIndex],
    b.arenaMode === "pwt" ? 50 : Math.min(50, 5 + S.gym.rank * 5),
  );
  b.phase = "fight";
  syncBattle(b);
}
function finishArena(b, won) {
  if (b.rewardGranted) return;
  b.rewardGranted = true;
  b.finished = true;
  b.won = won;
  for (const m of S.mons)
    if (Object.hasOwn(b.heldSnapshot, m.uid))
      m.heldItem = b.heldSnapshot[m.uid];
  let reward = "";
  if (b.arenaMode === "gym") {
    if (won) {
      S.gym.wins++;
      S.gym.streak++;
      S.gym.strikes = 0;
      const rank = Math.min(10, 1 + Math.floor(S.gym.wins / 3));
      if (rank > S.gym.rank && !S.gym.rankClaims.includes(rank)) {
        S.gym.rankClaims.push(rank);
        S.tickets++;
        reward = " · 승급 티켓 1장";
      }
      S.gym.rank = rank;
      S.coins += 30;
      S.items["rare-candy"] = (S.items["rare-candy"] || 0) + 1;
      reward = " · 30코인 · 이상한사탕 1개" + reward;
    } else {
      S.gym.strikes++;
      if (S.gym.strikes >= 3) {
        S.gym.strikes = 0;
        S.gym.streak = 0;
        reward = " · 3연패로 연승 도전 초기화 (등급과 동료는 유지)";
      }
    }
  } else if (won) {
    const first = !S.trophies.includes(b.cupId);
    if (first) {
      S.trophies.push(b.cupId);
      S.tickets += 2;
    }
    S.coins += first ? 150 : 30;
    S.items["rare-candy"] = (S.items["rare-candy"] || 0) + (first ? 3 : 1);
    reward = first
      ? " · 첫 우승 트로피 · 150코인 · 티켓 2장 · 이상한사탕 3개"
      : " · 30코인 · 이상한사탕 1개";
  }
  b.log = (won ? "도전 승리!" : "도전 종료.") + reward;
  addLog(b.log);
  save();
}
const outcomeBeforeModes = evaluateBattleOutcome;
evaluateBattleOutcome = function (b, log) {
  if (b.kind !== "arena") return outcomeBeforeModes(b, log);
  if (b.foe.hp <= 0) {
    if (b.foeIndex < 2) {
      b.phase = "arena-next";
      log.push("상대가 다음 포켓몬을 준비해요.");
    } else if (b.trainerIndex < b.trainers.length - 1) {
      b.phase = "arena-round";
      log.push("라운드 승리! 다음 트레이너 전에 파티가 회복돼요.");
    } else {
      finishArena(b, true);
      log.push(b.log);
    }
    return;
  }
  if (activeFighter(b).hp <= 0) {
    if (b.party.every((uid) => b.fighters[uid].hp <= 0)) {
      finishArena(b, false);
      log.push(b.log);
    } else b.phase = "forced-switch";
  }
};
const actionBeforeModes = combatAction;
combatAction = function (action) {
  const b = S.battle;
  if (b?.kind === "arena" && !b.finished) {
    if (
      action === "arena-next" &&
      ["arena-next", "arena-round"].includes(b.phase)
    ) {
      if (b.phase === "arena-round") {
        b.trainerIndex++;
        b.foeIndex = 0;
        for (const f of Object.values(b.fighters)) {
          f.hp = f.max;
          f.status = null;
          f.confusion = 0;
          f.pp = { ...f.ppMax };
        }
        b.active = 0;
      } else b.foeIndex++;
      prepareArenaEnemy(b);
      b.log = `${b.trainers[b.trainerIndex].name}의 ${b.foe.name}!`;
      save();
      render();
      return;
    }
    if (!action.startsWith("move:") && !action.startsWith("switch:")) return;
  }
  return actionBeforeModes(action);
};
const itemBeforeModes = useInventoryItem;
useInventoryItem = function (...args) {
  if (S.battle?.kind === "arena" && S.battle.arenaMode === "pwt")
    return { ok: false, message: "PWT에서는 가방 도구를 사용할 수 없어요." };
  return itemBeforeModes(...args);
};
function arenaBattleView() {
  const b = S.battle,
    a = activeFighter(b);
  return (
    intro(
      "TRAINER BATTLE",
      b.arenaMode === "gym" ? "나의 체육관 방어전" : "PWT 지방 대회",
      `${b.trainers[b.trainerIndex].name} · 라운드 ${b.trainerIndex + 1}/${b.trainers.length} · 상대 ${b.foeIndex + 1}/3`,
    ) +
    `<div class="battle"><div class="battlefield">${[a, b.foe].map((f) => `<div>${fighterImage(f)}<b>${f.name} Lv.${f.level}</b><p>${fighterTypes(f).join(" / ")}</p><div class="hp"><i style="width:${Math.max(0, (f.hp / f.max) * 100)}%"></i></div><small>HP ${f.hp}/${f.max} ${STATUS_LABELS[f.status] || ""}</small></div>`).join("")}</div><div class="battlelog" role="status">${esc(b.log)}</div><div class="move-grid">${!b.finished && b.phase === "fight" ? (usableMoves(a).length ? a.moves.map((id) => `<button class="move-button" data-type="${MOVES[id].type}" data-action="move:${id}" ${usableMoves(a).some((m) => m.id === id) ? "" : "disabled"}><b>${MOVES[id].name}</b><span>${MOVES[id].type} · PP ${a.pp[id]}/${a.ppMax[id]}</span></button>`).join("") : '<button class="primary" data-action="move:165">발버둥</button>') : ""}</div><div class="actions">${b.finished ? '<button class="primary" id="arena-return">대회 로비로 돌아가기</button>' : `${["arena-next", "arena-round"].includes(b.phase) ? '<button class="primary" data-action="arena-next">다음 상대 ▶</button>' : ""}${b.arenaMode === "gym" ? '<button class="secondary" id="battlebag">가방</button>' : ""}<button class="smalllink" id="arena-forfeit">도전 포기</button>`}</div><div class="battleparty">${!b.finished ? b.party.map((uid, i) => `<button class="secondary" data-action="switch:${uid}" ${i === b.active || b.fighters[uid].hp <= 0 || !["fight", "forced-switch"].includes(b.phase) ? "disabled" : ""}>${b.fighters[uid].name} ${b.fighters[uid].hp}/${b.fighters[uid].max}</button>`).join("") : ""}</div></div>`
  );
}
function arena() {
  initializeModes();
  if (S.battle)
    return S.battle.kind === "arena"
      ? arenaBattleView()
      : intro(
          "BATTLE IN PROGRESS",
          "탐험 진행 중",
          "탐험 메뉴에서 현재 모험을 먼저 마쳐주세요.",
        );
  return (
    intro(
      "GYM & PWT",
      "체육관 · 월드 토너먼트",
      "직접 고른 기술과 키워 온 파티로 트레이너에게 도전해요.",
    ) +
    `<div class="notice">에너지 ${S.energy}/${ENERGY_CAP} · 체육관 1 / PWT 2 소모 · 패배·포기 시 환불 없음<br>체육관은 현재 레벨, PWT는 레벨 50으로 보정해요. 개체값·노력치·성격·배치한 기술은 유지해요. 대회에서 소비한 지니는 도구는 종료 시 복구해요.<br>PWT는 가방 사용 금지 · 트레이너 사이에는 전원 HP·PP 회복. 전투 효과는 현재 구현된 스바 규칙을 사용해요.</div><section class="panel"><h2>나만의 체육관 · Rank ${S.gym.rank}</h2><p>승리 ${S.gym.wins} · 연승 ${S.gym.streak} · 연패 ${S.gym.strikes}/3</p><label>주력 타입 <select id="gymtype">${Object.keys(
      TYPE_CHART,
    )
      .map((t) => `<option ${S.gym.type === t ? "selected" : ""}>${t}</option>`)
      .join(
        "",
      )}</select></label><p>파티 전원이 주력 타입을 가져야 해요. 3승마다 승급하며 첫 승급에 티켓 1장을 받아요. 3연패 시 연승 도전만 초기화돼요.</p><button class="primary" id="gym-start" ${!arenaUnlocked("gym") || S.energy < 1 ? "disabled" : ""}>${arenaUnlocked("gym") ? "체육관 방어전 · 에너지 1" : "트레이너 Lv.8에 해금"}</button></section><h2>PWT · 지방별 3라운드</h2><p>트레이너 Lv.20 · 도감 등록 10종 · 체육관 3승 필요 (${level()}/20 · ${S.registered.length}/10 · ${S.gym.wins}/3)</p><div class="regiongrid">${PWT_CUPS.map((c) => `<section class="region"><h3>${c.name} ${S.trophies.includes(c.id) ? "🏆" : ""}</h3><p>${c.trainers.map((t) => t.name).join(" → ")}</p><p>각 트레이너 3마리 · 첫 우승 티켓 2장</p><button class="primary" data-cup="${c.id}" ${!arenaUnlocked("pwt") || S.energy < 2 ? "disabled" : ""}>대회 출전 · 에너지 2</button></section>`).join("")}</div><p class="credit">트레이너 팀은 스바에서 사용 가능한 종·기술로 구성한 팬게임 편성이에요. 원작 대회 팀과 동일하지 않아요.</p>`
  );
}
function bindModes() {
  document
    .querySelectorAll("[data-auto-location]")
    .forEach(
      (b) =>
        (b.onclick = () => combatStartLocation(b.dataset.autoLocation, "auto")),
    );
  $("#gymtype")?.addEventListener("change", (e) => {
    if (S.battle) return;
    S.gym.type = e.target.value;
    save();
  });
  $("#gym-start")?.addEventListener("click", () => startArena("gym"));
  document
    .querySelectorAll("[data-cup]")
    .forEach((b) => (b.onclick = () => startArena("pwt", b.dataset.cup)));
  $("#arena-return")?.addEventListener("click", () => {
    if (!S.battle?.finished) return;
    S.battle = null;
    save();
    go("arena");
  });
  $("#arena-forfeit")?.addEventListener("click", () => {
    modal(
      '<h2>도전을 포기할까요?</h2><p>패배로 기록되며 에너지는 돌아오지 않아요.</p><button class="primary" id="arena-confirm-forfeit">도전 포기</button>',
    );
    $("#arena-confirm-forfeit").onclick = () => {
      if (S.battle?.kind === "arena") finishArena(S.battle, false);
      close();
      render();
    };
  });
}
