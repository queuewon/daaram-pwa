# Vercel 배포 런북

이 문서는 절차만 다룬다. 실제 배포 실행과 비밀번호 값 입력은 사람이 직접 한다 — Claude는
`.env`나 실제 비밀번호 값을 보거나 다루지 않는다 (CLAUDE.md, F8).

## 최초 배포

1. https://vercel.com 에서 이 GitHub 저장소를 Import한다. 프레임워크 프리셋은 Next.js가
   자동으로 감지된다 — 별도 `vercel.json` 설정 없이 그대로 진행한다.
2. **Environment Variables** 단계(또는 Import 완료 후 Project → Settings → Environment
   Variables)에서 다음을 추가한다:
   - Key: `GATE_PASSWORD`
   - Value: 본인만 아는 접근 비밀번호 (여기 문서나 커밋에 절대 적지 않는다)
   - Environment: **Production**과 **Preview** 둘 다 체크 (Preview 배포도 게이트로 보호하려면).
     Development는 로컬 `.env.local`을 따로 쓰므로 체크 불필요.
3. Deploy 클릭.

## 배포 후 확인

1. 발급된 URL로 접속 → `/gate`로 리다이렉트되는지 확인(안 되면 `GATE_PASSWORD`가
   설정 안 됐거나 환경이 잘못 선택된 것).
2. 방금 설정한 비밀번호로 로그인 → 정상적으로 `/`로 들어가지는지 확인.
3. `docs/pwa-install-check.md` 절차로 홈 화면 설치까지 한 번 확인.

## 이후 배포 (재배포)

- `main` 브랜치에 push하면 Vercel이 자동으로 재배포한다. 환경변수는 계속 유지되므로
  다시 설정할 필요 없음.
- **서비스워커 캐시 전략(`public/sw.js`)을 바꾼 배포라면** `CACHE_VERSION` 상수를 반드시
  올렸는지 커밋 전에 확인한다 — 안 올리면 기존 사용자의 구버전 캐시가 안 지워진다.

## 환경변수 값을 바꿔야 할 때 (비밀번호 변경)

1. Vercel 대시보드 → Settings → Environment Variables에서 `GATE_PASSWORD` 값을 수정.
2. **재배포가 필요하다** — Vercel은 환경변수를 빌드/런타임 시점에 주입하므로, 값만 바꾸고
   재배포하지 않으면 기존 배포는 이전 값을 계속 쓴다. Deployments 탭에서 최신 배포를
   "Redeploy"한다.
3. 기존에 로그인해 있던 사용자의 쿠키(서명 키가 `GATE_PASSWORD` 자체라 비밀번호를 바꾸면
   서명도 같이 바뀐다 — `lib/infra/gate.ts` 참고)는 자동으로 무효화된다. 재로그인이 필요하다.
