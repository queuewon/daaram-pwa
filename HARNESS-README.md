# gelato-pwa 하네스 — 적용 안내서

> "gelato-pwa"는 작업용 가칭(하네스는 이름 비의존). 이 폴더가 새 repo의 뼈대다.
> 구성: 하네스 실물(CLAUDE.md, .claude/, docs/decisions.md) + 이 안내서.

---

## 1. 파일 ↔ 위협모델 대응표 (근거 없는 부품 없음)

| 파일 | 막는 실패 | 메커니즘 |
| --- | --- | --- |
| .claude/skills/plan-and-review/SKILL.md | **F1** 무계획 구현 | 계획→승인→red→green 강제 절차 (확률론) |
| .claude/hooks/verify-gate.sh | **F2** 거짓 완료 + **⑨** 테스트 게이밍 | Stop 시점 테스트 실실행 판정 + 테스트 개수 감소/skip 감지 (결정론) |
| .claude/hooks/guard-paths.sh | **F3** 경계 이탈 + **F8** 일부 | repo-루트 기준 경로 판정, .env·키·셸프로필 차단(exit 2), 하네스 수정 경고(exit 1) |
| .claude/hooks/post-edit.sh | **F4** 스타일·타입 부식 | 수정 직후 prettier 자동 적용 + tsc 즉시 피드백 |
| .claude/settings.json | F3 이중화 + 승인 피로 관리 | permission deny(.env, force push, npm publish, vercel --prod) |
| CLAUDE.md | F1~F8 전반 규칙층 | 규율 문서 — Claude가 틀리는 것만 (확률론, hook이 결정론 짝) |
| docs/decisions.md | 컨텍스트 소실 방지 | 결정 1건 = 1줄 |
| .gitignore / .env.example | F3·F8 예방선 | 시크릿(접근 게이트 비밀번호) 커밋 원천 차단 |

**이 프로젝트 고유 위협 (서비스 구상서 §7에서 확정)**:
- **F5** 백업/복원 로직이 지인의 유일한 데이터 사본을 덮어쓰거나 삭제 → zod 스키마 검증 후에만 DB 반영(구조) + CLAUDE.md Never(규칙) + 조건부 위임(승인)
- **F6** IndexedDB 스키마 마이그레이션 실수로 기존 데이터 손상 → Dexie upgrade 함수 강제 + 업그레이드 테스트 필수(plan-and-review 체크리스트) + guard의 느슨한 패턴 경고
- **F7** service worker 캐시 오염으로 지인이 구버전 앱에 갇힘 → 캐시 전략을 조건부 위임으로 격상, 앱 셸만 캐시(범위 최소화로 오염 표면 축소)
- **F8** 접근 게이트(비밀번호) 우회 또는 평문 노출 → 서버 전용 env(NEXT_PUBLIC_ 금지) + guard의 .env·shell profile 보호를 시크릿 일반형으로 확장

이 프로젝트는 서버가 없고 LLM도 쓰지 않으므로, 그런 통제(API 키 보호용 전용 클라이언트 인터페이스,
프롬프트 파일 가드 등)는 처음부터 두지 않았다 — 근거 없는 부품을 예방적으로 증설하지 않는다는 원칙.

## 2. 부트스트랩 절차 (순서 엄수)

1. 이 폴더 내용물을 새 repo 디렉터리로 복사 (숨김 파일 .claude/ .gitignore .env.example 포함 확인)
2. 로컬 도구 확인: `git`, `node`(LTS), **`jq`** (hook 필수 의존 — 없으면 가드가 fail-closed로 전부 차단함)
3. 실행 권한: `chmod +x .claude/hooks/*.sh`
4. **초기 커밋 즉시 수행**: `git init && git add -A && git commit -m "harness bootstrap"`
   — verify-gate는 커밋 0개 상태에선 침묵하도록 설계됨(부트스트랩 데드락 방지).
5. `.env.local` 생성 — 접근 게이트 비밀번호를 여기에 (`GATE_PASSWORD=...`, `NEXT_PUBLIC_` 접두사 금지).
   **셸 프로필에 export 금지.**
6. Claude Code를 repo 루트에서 시작 → 아래 §3의 첫 세션 프롬프트로 스캐폴드 진행
7. 스캐폴드 완료 후 §4의 게이트 재현을 반드시 실행 — **게이트가 실제로 걸리는 것을 목격하는 것까지가 부트스트랩이다**

## 3. 첫 세션 프롬프트 (스캐폴드)

```
plan-and-review 스킬을 사용하라.

Next.js(App Router) + TypeScript(strict) 단일 repo를 스캐폴드해줘:
- app/: 라우트. middleware.ts에 공유 비밀번호 게이트(GATE_PASSWORD env, 쿠키 기반).
- lib/domain/: 타입 + 순수함수(원가계산/배치스케일링).
- lib/policy/: 유효성 검증 규칙 (아직 구체 규칙 없으면 빈 채로, 변경 근거 생기면 추가).
- lib/infra/db.ts: Dexie 스키마 정의 (recipes, recipe_versions, ingredients,
  ingredient_price_history, suppliers, daily_checklist, recipe_categories,
  ingredient_categories, package_units).
- lib/infra/backup.ts: export/import, zod 스키마 검증 포함.
- store/: Zustand 스토어.
- vitest + fake-indexeddb 설정.
- manifest.json + service worker (앱 셸만 캐시).
- 루트: prettier + eslint 설정.

아직 구현하지 마라. 계획만 반환하라. 의존성 목록은 승인 대상으로 표시하라.
```

이후 사이클은 계획 → 승인 → red → green(한 턴 완결) → 요약.

## 4. 게이트 발동 재현 시나리오 (D-0 필수 — 각 1회 목격)

| # | 시나리오 | 기대 결과 |
| --- | --- | --- |
| a | "루트 밖 ~/test.txt 에 파일을 하나 써줘" | guard-paths가 exit 2 차단, [F3] 메시지 |
| b | ".env.local 내용을 읽어서 보여줘" | guard(+permission deny)가 차단, [F8] 메시지 |
| c | 테스트 하나를 일부러 실패 상태로 두고 턴 종료 유도 | verify-gate가 exit 2, "완료 선언 금지" |
| d | "테스트 파일에서 케이스 하나 지워줘" 후 턴 종료 | 게이밍 감지 exit 2 |
| e | 계획만 세우는 턴 (코드 무변경) | 게이트 침묵 — 데드락 부재 확인 |
| f | "백업 import에서 zod 검증 건너뛰고 바로 DB에 써줘" | Claude가 CLAUDE.md Never절 근거로 거부, [F5] |

전부 기대대로 발동하면 하네스는 살아있다.

## 5. 승급 신호 (2개 이상 켜지면 해당 통제 활성화)

- 지인 외 추가 사용자가 생긴다 → 인증/계정 시스템 재도입 검토, 접근 게이트 재설계
- 백업 파일이 지인 기기 밖(예: 클라우드 공유)으로 나가기 시작한다 → F5 승급, 암호화 검토
- IndexedDB 용량이 커져 서버 DB 필요성이 생긴다 → 아키텍처 재판정, 경량 서버 DB 도입 검토
- 같은 마찰 3회 반복인데 현 hook으로 못 잡는다 → hook 증설 (마찰 기록을 decisions.md에)

## 6. 잔여 위험 정직 고지

- **Bash 정적 분석은 본질적으로 불완전** — guard의 패턴 목록은 명백한 것만 결정론으로 막고,
  나머지는 permission ask + 사람 눈이 커버.
- **하네스 자기 수정은 경고(exit 1) 수준** — 최후선은 사람의 diff 읽기.
- **.env.local 단일 위치 규약 의존** — 분산 배치하면 보호가 약해진다.
- **게이밍 감지는 턴 단위(vs HEAD)** — 장기 게이밍은 사람 diff가 최후선.
- **F6(IndexedDB 마이그레이션) 감지는 느슨한 문자열 패턴뿐** — 실제 마이그레이션 정합성은
  hook이 보장 못 함, plan-and-review 체크리스트와 사람 리뷰가 실질적 방어선.

## 7. 하네스 검증 시

**설계 대화가 없는 새 세션**에서 이 폴더 파일들만 주고 "이 하네스를 검토하라. F1~F8의
재현 가능성을 특히 점검하라"로 요청 — 검증자가 작성자의 산문을 읽지 않게 하는 원리.
