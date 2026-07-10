# CLAUDE.md — gelato-pwa

## What this is
지인(젤라또 자영업자) 1인이 쓰는 레시피·재료·원가·오늘생산 관리 PWA.
Next.js(App Router) + TypeScript(strict) + Tailwind + Zustand, 데이터는 브라우저 IndexedDB(Dexie)에만 저장.
서버/백엔드 없음. 배포는 Vercel, middleware 기반 공유 비밀번호 게이트로 접근 제어.

핵심 도메인 개념: Recipe(+RecipeVersion), Ingredient(+IngredientPriceHistory), Supplier,
DailyChecklist, RecipeCategory / IngredientCategory / PackageUnit(사용자 정의 라벨)

## Commands
- Typecheck: `npx tsc --noEmit`
- Test: `npx vitest run` (IndexedDB는 fake-indexeddb로 모킹)
- Lint: `npx eslint .`
- Format: `npx prettier --write <file>`

## Workflow
- 새 기능/수정은 반드시 계획부터: plan-and-review 스킬을 먼저 사용한다.
- 테스트를 먼저 쓰고(red), 같은 턴에서 구현으로 통과시킨다(green).
- 완료 주장 전에 vitest가 통과해야 한다. 통과 없이 "완료"라고 말하지 않는다.
- 설계 결정을 내리면 docs/decisions.md에 한 줄 추가한다.

## Code rules
- tsconfig strict 전제. `any` / `as any` / `@ts-ignore` 금지 (불가피하면 이유 주석 + 승인).
- 도메인 값은 원시 타입 노출 금지 — branded type으로 감싼다 (예: RecipeId, IngredientId).
- 모든 신뢰 경계(폼 입력, 백업 JSON import, IndexedDB에서 읽은 값)는 zod 스키마로 파싱한다.
  파싱 실패 = 거부. 특히 백업 복원은 반드시 스키마 검증 후에만 DB에 반영한다.
- 오류를 빈 catch로 삼키지 않는다. 실패는 반환 타입으로 드러내거나 명시적으로 전파한다.
- 비즈니스 규칙(원가 계산·배치 스케일링·유효성 검증)은 lib/policy/ 와 lib/domain/에 순수함수로 분리한다.
  service 층(app/, store/)은 조합만 하고 계산 로직을 갖지 않는다.
- IndexedDB 접근은 반드시 lib/infra/db.ts의 Dexie 인스턴스를 경유한다. 컴포넌트에서 직접
  Dexie API를 호출하지 않는다.
- IndexedDB 스키마를 바꾸면(버전 업) 반드시 Dexie의 upgrade 함수로 마이그레이션 경로를 작성하고,
  기존 데이터가 있는 상태에서의 업그레이드 테스트를 함께 작성한다. [F6]
- 백업 export/import 로직 수정은 계획 승인 후에만. 수정 시 decisions.md 기록. [F5]
- service worker(캐시 전략) 변경도 조건부 위임 대상. [F7]
- 접근 게이트 비밀번호는 서버 전용 env 변수로만 존재한다. 클라이언트 번들에 노출되는
  `NEXT_PUBLIC_` 접두사를 이 값에 절대 쓰지 않는다. [F8]
- 새 의존성(npm 패키지) 추가 전에 반드시 이유를 말하고 승인을 받는다.

## Never
- app/ lib/ store/ docs/ .claude/ 밖, 그리고 repo 밖 파일 수정 금지.
- .env·자격 증명·시크릿(접근 게이트 비밀번호 포함)을 읽거나 코드에 하드코딩하지 않는다.
  셸 프로필(.zshrc 등) 수정 금지.
- 테스트를 삭제하거나 it.skip / xit / describe.skip 으로 침묵시켜 통과를 만들지 않는다.
- 백업 import 경로에서 스키마 검증을 건너뛰고 곧바로 DB에 쓰지 않는다. [F5]
- IndexedDB를 "정리" 명목으로 전체 삭제하는 코드를 승인 없이 실행/추가하지 않는다.
- Non-goal 침범 금지: 로스율 계산, 단위 변환 UI, 재고현황 전용 페이지, 배치량 전용 페이지,
  멀티유저/계정 시스템, 결제/수익화, LLM·AI 에이전트 기능.
