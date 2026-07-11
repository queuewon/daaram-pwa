Design Decisions — daaram-pwa

형식: 날짜 | 결정 | 이유 한 문장. 한 결정 = 한 줄. Claude와 석 달 뒤의 나에게 주는 가장 싼 컨텍스트.

2026-07-10 | 스택을 Next.js(App Router) + TS + Tailwind + Zustand + Dexie(IndexedDB)로 확정, 서버 DB 없음 | 지인 1인 전용 확정(동기화 불필요) + 무료 우선 제약 + 기존 자산(타입/유틸/스토어 구조) 이식 비용 0
2026-07-10 | LLM/프롬프트 관련 하네스 부품(전용 클라이언트 인터페이스, 프롬프트 경로 가드)을 두지 않음 | 이 프로젝트는 LLM을 쓰지 않음 — 근거 없는 부품은 만들지 않는다
2026-07-10 | 프로젝트 고유 위협 F5~F8(백업손실/IndexedDB마이그레이션/캐시오염/접근게이트우회)을 하네스에 반영 | 서버 없이 클라이언트(브라우저)에만 데이터를 두는 구조라 생기는 특유의 위협들
2026-07-10 | verify-gate/post-edit을 단일 workspace 구조로 설계 | 백엔드가 없는 Next.js 단독 repo라 워크스페이스 분리 실익이 없음
2026-07-10 | 접근 제어는 middleware + 공유 비밀번호 1개로, 풀 인증 시스템은 도입하지 않음 | 사용자 1인 확정 상황에서 계정/OAuth는 과설계 — 마찰 실측 전 예방적 증설 금지
2026-07-10 | 백업 파일 암호화는 MVP 범위에서 하지 않음 | 파일이 지인 본인 기기 밖으로 나갈 구체적 경로가 없어 위협 근거 약함, 필요해지면 그때 추가
2026-07-10 | git 커밋/브랜치/푸시는 Claude 자동 실행 없이 사람이 직접 수행 | diff를 사람이 매번 눈으로 거치는 관문을 유지하고 싶음 — 속도보다 안전판 우선
2026-07-10 | 브랜치 전략은 main 직진행, 실험적 시도에만 예외적으로 브랜치 사용 | 협업자 없음 + verify-gate가 이미 부서진 상태 완료선언을 막음 + P1 단계가 순차 의존이라 병렬 브랜치 필요성 자체가 없음
2026-07-10 | CostLineItem.quantityGram을 원시 number 대신 NonNegativeNumber branded type으로 감쌈 | 원시 타입 노출 금지 원칙을 도메인 수량 값에도 일관 적용, 음수 수량을 타입 단계에서 차단
2026-07-10 | importBackup에 forceEmpty 옵션 추가, 테이블이 기존에 레코드가 있는데 신규 백업이 0개로 줄이는 경우 기본적으로 거부 | F5(백업이 지인의 유일한 데이터 사본을 덮어씀) 위험 — 대량 소실을 명시적 확인 없이 자동 반영하지 않기 위함
2026-07-10 | verify-gate.sh의 head_count/skip_count grep 범위를 app/lib/store에서 저장소 전체(node_modules 등 제외)로 확장 | Next.js 16의 proxy.ts/proxy.test.ts가 레포 루트에 있어야 하는데 기존 범위가 루트 파일을 못 봐서 "테스트 개수 감소" 거짓 게이밍 경보가 발생함
2026-07-10 | known gap: IndexedDB read 경로(db.ts/store) zod 미검증, 추후 조치 필요 | 현재 스토어가 Dexie 조회 결과를 zod 재검증 없이 바로 state에 반영함 — CLAUDE.md의 "IndexedDB에서 읽은 값도 신뢰 경계" 원칙과 어긋나지만 이번 엔티티 재정의 범위 밖이라 스키마만 재사용 가능하게 옮겨두고 실제 적용은 보류
2026-07-11 | lib/infra/repository.ts(제네릭 CRUD 팩토리)로 위 known gap을 해소, store/*.ts도 Dexie 직접 호출 대신 리포지토리 경유로 교체 | list()는 오염 레코드를 skippedCount로 건너뛰고(단일 레코드 손상이 전체 목록을 막지 않도록), get()은 명시적으로 하나를 요청한 것이므로 CorruptedRecord로 실패시켜 "삭제됨"과 "깨짐"을 구분함
2026-07-11 | 게이트 쿠키를 SHA-256 해시(무만료) 방식에서 HMAC-SHA256 서명 + exp 클레임(30일) 방식으로 교체(lib/infra/gate.ts), 서명 키는 별도 env 없이 GATE_PASSWORD 재사용, 실패 시 고정 지연(700ms)만 적용하고 IP 기반 레이트리밋은 도입하지 않음 | 무만료 해시 쿠키는 탈취 시 영구 접근을 허용함 + 서명 위조에도 결국 비밀번호가 필요해 별도 시크릿의 이득이 적음 + 지인 1인 위협 모델에서 상태 저장형 레이트리밋은 과설계
2026-07-11 | 레시피 CRUD 구현 시 Recipe 엔티티에 재료 구성(lines)을 두지 않고, lines의 유일한 원천을 RecipeVersion.snapshotJson으로 한정함(recipes 테이블 스키마 변경 없음) | 저장할 때마다 새 버전 스냅샷이 자동 생성되는 요구와 자연히 맞아떨어지고, recipes 테이블에 lines를 추가했다면 IndexedDB v3 마이그레이션과 백업 스키마 버전업이 함께 필요했을 것 — 근거 없는 스키마 변경을 피함
2026-07-11 | 버전 "복원"은 과거 데이터를 덮어쓰지 않고 선택한 스냅샷을 편집 폼 상태로만 불러옴 — 저장을 눌러야 새 버전(versionNo 최댓값+1)으로 append됨 | 이력을 append-only로 유지해 실수로 과거 버전을 삭제/훼손할 수 없게 함
2026-07-11 | 레시피 에디터 UI는 jsdom/@testing-library 없이(신규 의존성 승인 없이) vitest 자동 테스트 대상에서 제외하고 /verify로 브라우저에서 직접 확인함 | vitest.config.ts가 environment:"node"라 RTL 도입은 별도 승인 필요 사항 — 이번 범위에서 새 의존성을 추가하지 않기로 함
2026-07-11 | 재료 CRUD 구현 시 categoryId는 계속 null 고정, IngredientCategory 관리 UI를 만들지 않음(레시피 categoryId 결정 연장) | 카테고리 CRUD가 이번 요구사항(재료 CRUD·가격이력·재고표시·공급업체)에 없어 근거 없는 범위 확장을 피함
2026-07-11 | 공급업체 삭제 시 참조 무결성(그 공급업체를 쓰는 재료가 있어도) 강제하지 않음 | supplierId가 nullable이고 이 레포 전체에 FK 강제 사례가 없어(레시피 삭제도 daily_checklist를 정리하지 않음) 선례를 따름 — 필요해지면 그때 추가
2026-07-11 | RecipeCategory/IngredientCategory/PackageUnit 라벨 CRUD를 createLabelStore(제네릭 팩토리) + LabelManager(제네릭 UI) 하나씩으로 3종 공용 구현, 각각 별도 스토어/컴포넌트 파일로 만들지 않음 | 세 라벨 타입이 {id,name,colorHex}로 구조가 완전히 동일하고(entities.schema.ts의 labelSchema<B>() 팩토리와 동일 근거), lib/infra/repository.ts의 createRepository 제네릭화 선례를 그대로 따름
2026-07-11 | PackageUnit을 Ingredient.stockUnit의 FK로 바꾸지 않고 자유입력 + datalist 자동완성으로만 연결 | v1→v2 마이그레이션에서 이미 Ingredient.packageUnitId가 제거된 상태였고, FK로 강제하려면 엔티티 스키마 변경(IndexedDB v3 마이그레이션)이 필요해 근거 없는 스키마 변경을 피함 — 이전 결정(재료 categoryId 미노출)은 이번 작업으로 뒤집혀 Recipe/Ingredient 모두 categoryId 선택 UI가 생김
2026-07-11 | 오늘 생산 체크리스트에 요구사항에 없던 removeChecklistItem(삭제)을 추가함 | 잘못 추가한 항목을 지울 방법이 없으면 실사용이 막힘 — 레시피/재료/공급업체/라벨 등 지금까지 만든 모든 목록 기능에 삭제가 있었던 선례를 따름
2026-07-11 | DailyChecklist에 createdAt이 없어 같은 날짜 내 항목 정렬 순서를 보장하지 않음(Dexie 기본 반환 순서에 의존) | 스키마 변경(필드 추가) 없이 가기로 결정 — 순서가 실제로 문제 되면 그때 필드 추가 + 마이그레이션 논의
