# 기술 기억 · 성장 · 지방별 탐험

## 기술은 기록과 사용 슬롯을 나눠 관리

- `learnedMoves`: 실제로 한 번 이상 배운 기술. 진화/폼 변경으로 삭제하지 않습니다.
- `moveArchive`: 배운 기술과 배울 기회에 넘어간 자력기 기록. 사용 중이 아닌 기술은 하트비늘로 떠올립니다.
- `moveOffers`: 레벨업/진화/폼 변경 후 새로 배울 수 있는 기술. 직접 배우기 또는 배우지 않기를 선택합니다.
- `moves`: 현재 사용하는 최대 네 기술. 교체한 기술은 기록에 남습니다.

네 칸이 차면 어떤 기술을 잊을지 고르거나 배우지 않기를 선택합니다. TM과 하트비늘은 슬롯 선택을 확정할 때만 소모합니다. 취소하면 도구를 쓰지 않습니다. TM 사용을 취소하는 것만으로 무료 떠올리기 기록을 만들지 않습니다.

기존 저장 데이터의 기술 기록과 사용 기술은 유지합니다. 새 정책 적용 전에 이미 삭제되어 저장된 과거 정보는 복원할 수 없습니다. 남아 있는 기록은 이후 진화해도 지우지 않습니다. 첫 영입 시에는 스바 학습표에 맞는 초기 기술을 배치하고, 그 레벨에서 선택되지 않은 자력기도 기록에 남깁니다. 미구현 전투 효과는 기존처럼 배치 제한을 유지합니다.

## 이상한사탕과 스바식 능력치

이상한사탕 1개가 레벨 1을 올립니다. 모든 포켓몬과 지원 변경폼에 종족값·개체값·노력치·성격을 적용하여 능력치를 다시 계산하고, 사용 결과에 여섯 능력치의 전후 차이를 표시합니다. 최고 레벨은 100입니다. 능력치 계산의 버림 때문에 모든 능력치가 매 레벨 반드시 1씩 증가하는 것은 아닙니다. 껍질몬의 HP 1 예외도 유지합니다.

- 이상한사탕: 60코인. 탐험 클리어와 박사 전송 보상으로도 획득.
- 하트비늘: 15코인. 기술 한 개를 떠올릴 때 사용.
- 기존 종별 연구 사탕은 레벨업에 쓰지 않습니다. 최초 이전 시 전체 세 개당 이상한사탕 한 개로 변환하며 마지막 잔여분은 올림하여 보존합니다. 이전은 한 번만 수행합니다.
- 탐험 클리어는 파티 수만큼 이상한사탕을 지급합니다. 포켓몬 레벨을 몰래 올리지 않습니다.
- 중복을 박사에게 보내면 이상한사탕 한 개와 성격·특성·개체값/폼 발견 기록을 얻습니다.
- 탐험 중에는 레벨과 사용 기술을 변경하지 않습니다. 새 기술 선택이 남아 있으면 먼저 배우거나 넘어갈지 결정합니다.

## 탐험지 구성

| 지방 | 지역 수 |
| --- | ---: |
| 관동 | 10 |
| 성도 | 10 |
| 호연 | 10 |
| 신오 | 10 |
| 하나 | 10 |
| 칼로스 | 10 |
| 알로라 | 10 |
| 가라르 | 13 |
| 팔데아 | 13 |
| 합계 | 96 |

도시 목록 대신 도로·숲·산·호수·동굴·유적 등 탐험 장소로 구성했습니다. 순서는 일반 지역 → 패러독스 전용 지역(Lv.45, 팔데아) → 준전설(Lv.55) → 초전설(Lv.60)입니다. 대표 이미지에는 그 세대에서 처음 등장한 포켓몬만 씁니다. 실제 지역 후보에 새 세대 포켓몬이 없으면 지방 대표 이미지임을 표시하고, 기존 세대 후보로 일반 조우를 구성합니다.

### 일반 조우

먼저 지역에 지정된 후보 중 스바 학습표가 있는 일반 포켓몬만 사용합니다. 해당 세대의 후보가 세 종 이상이면 기존 세대 후보를 섞지 않습니다. 세 종보다 적으면 기존 세대의 지역 후보로 최소 세 종까지 보충합니다. 둘이 섞이면 새 세대 그룹 70%, 이전 세대 그룹 30%이며 그룹 안에서는 같은 확률입니다. 실제로 가능한 후보가 적으면 억지로 다른 지역 포켓몬을 추가하지 않습니다.

### 특별 조우

각 세대의 준전설 지역은 그 세대의 준전설 전체, 초전설 지역은 그 세대의 초전설 전체를 마지막 특별 조우 후보로 사용합니다. 일반 포켓몬은 앞선 탐험 구간에서 만납니다. 특별 탐험은 매번 티켓 한 장을 사용하고 성공 시 다시 영입할 수 있습니다. 실패·중단 시 티켓을 반환합니다. 코인·트레이너 EXP의 최초 클리어 보상은 지역별 한 번만 지급합니다.

이는 요청에 따른 팬게임용 지방·등급 통합 출현표입니다. 원작의 특정 장소에서 원래 모든 전설이 나온다는 뜻은 아닙니다. 원작의 개별 버전·날씨·시간·출현률을 완전히 복제하지 않습니다.

- 관동: 세 새 준전설 / 뮤츠.
- 성도: 라이코·앤테이·스이쿤 / 루기아·칠색조.
- 호연: 레지 세 종·라티아스·라티오스 / 가이오가·그란돈·레쿠쟈.
- 신오: 호수 세 종·히드런·레지기가스·크레세리아 / 디아루가·펄기아·기라티나.
- 하나: 코바르온·테라키온·비리디온·토네로스·볼트로스·랜드로스 / 레시라무·제크로무·큐레무.
- 칼로스: 신규 준전설이 없으므로 억지로 해당 등급을 만들지 않음 / 제르네아스·이벨타르·지가르데. 환상은 별도 특수 영입.
- 알로라: 타입:널·실버디·카푸 네 종·울트라비스트 / 솔가레오·루나아라·네크로즈마. 코스모그·코스모움은 전설 성장형으로 분류하여 최종 초전설 조우에서 제외.
- 가라르: 치고마·우라오스·레지에레키·레지드래고·블리자포스·레이스포스 / 자시안·자마젠타·무한다이노·버드렉스. 버드렉스는 백마/흑마 폼으로 조우하며 해당 폼의 능력치와 기술을 사용. 직접 영입한 폼은 발견 기록으로 다시 선택할 수 있음.
- 팔데아: 사흉수·조타구·이야후·기로치·오거폰 / 코라이돈·미라이돈·테라파고스. 패러독스 18종은 에리어 제로 연구구역으로 분리. 나페산은 일반 설원 후보만 유지.

스바 학습표가 없는 특별 포켓몬은 임의의 기술을 주지 않고 관찰 조우로 영입합니다. 이후 도감·집·기록에는 남지만 스바 기술 데이터 없는 전투를 임의로 만들지 않습니다.

## 태초마을과 메뉴

마을 이름은 태초마을입니다. 파티 카드에서 `능력치를 본다`, `기술 확인하기`, `이상한사탕 사용`으로 접근합니다. 기술 확인하기의 `배운 기록`과 `떠올리기`에서 이전 기술도 볼 수 있습니다.

검증: `npm test`는 진화 전 전용 기술 보존, 취소 시 도구 미소모, 하트비늘 차감, 레벨 100 제한, 전 종 레벨 능력치, 지방별 수량·정렬·세대·희귀 후보·빈도, 버드렉스 두 폼, 반복 특별 조우, 관찰 조우와 저장 이전을 검사합니다.

## Manual clears, automatic expeditions and trainer competitions (0.6)

Existing exploration clears migrate once to manual clears because automatic battles did not exist before this version. New regions require a manual clear before automatic combat opens. Both modes use the same party stats, equipped moves, PP, held items, encounters and rewards. Automatic combat chooses a supported damaging move using the existing damage evaluator, uses the healing fork, switches on fainting and stops after 400 actions. It can lose; it does not spend bag consumables. Special encounters still require their ticket and level gate.

Energy starts at 6 once and caps at 12. Successful, nonduplicate goal completions replenish 1–3 energy according to goal size. There is no unattended daily refill. Ordinary explorations and gym entries cost 1; special explorations and PWT cost 2. Failures and retreats consume energy. Exploration special tickets retain the existing refund rule. These are initial economy values, intended for tuning from actual play.

The gym unlocks at trainer level 8. All selected members must share the chosen gym type (forms included). One challenger fields three Pokemon. Every three wins raises gym rank (cap 10); first rank milestones award a ticket. Three consecutive losses reset the current streak, preserving rank and Pokemon. Wins give 30 coins and one Rare Candy.

PWT unlocks at trainer level 20, ten registered species and three gym wins. Nine regional cups each have three trainers with three Pokemon each. Teams are fan-game adaptations using SV-compatible species and legal supported level/TM moves. Owned fighters are cloned and normalized to level 50; their actual learned slots, nature, IVs and EVs remain. Bag items are forbidden; HP/PP/status reset between trainers, but not between that trainer's Pokemon. Held consumables are restored after gym/PWT win, defeat or forfeit. First cup wins award a trophy, 150 coins, two tickets and three Rare Candies; repeats award 30 coins and one Rare Candy. Arena and exploration reward commits are idempotent.

Storage remains browser-local. Linux hosting with persistent account saves, database and server-authoritative battle results is a future migration; this version does not implement server accounts or deploy to a personal Linux machine.
