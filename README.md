# 증언대: 신약 재판소

소문을 신약 본문으로 검증하는 조사 게임. 통독은 [복음의 전령](../light-herald)이 맡고, 이 앱은 **이해도**를 맡는다.

## 개발

```bash
npm i
npm run dev
npm test        # 구조·스토어·verify 회귀
npm run verify  # 콘텐츠 정확도 게이트 (prebuild에서도 실행)
npm run build
```

## 문서

- `docs/exclusion-list.md` — 콘텐츠 제외 기준 (최상위)
- `docs/case-candidates.md` — 사건 후보 (소문 81, 증언 18)
- `docs/spec.md` — 게임 루프·데이터 구조·화면·마일스톤

## 구조

- `src/content/` — 본문(`nt-krv.json`, 개역한글 퍼블릭 도메인), `books.json`, `chapters.json`(사건철), `rumors.json`, `testimonies.json`, 타입, 참조 파서(`ref.ts`)
- `src/store/progress.ts` — 진행 상태(localStorage). `solveRumor`는 첫 해결 기록을 보존하고 재조사는 `bestTries`·`replays`만 갱신
- `scripts/verify-cases.mjs` — 모든 참조가 실재하는지, 인용이 본문과 일치하는지, `evidence ⊂ scope` 등을 검사. `scripts/fixtures/`의 깨진 데이터로 회귀 테스트
- `scripts/dump-ref.mjs "마 28:11-15"` — 콘텐츠 쓸 때 본문을 꺼내 보는 도구. 인용은 기억으로 쓰지 않는다
- `scripts/batches/` — 사건을 추가할 때 쓴 입력 파일. `python scripts/_add.py <batch.json> [target.json]`으로 병합
- `src/features/` — mandate(위임장), board(게시판), investigate(소문 사건), witness(증언 사건), archive(보관소), complete(보고서)

## 현재 상태 (2026-09-22)

소문 사건 81건 + 증언 사건 18건. 위임장 → 게시판 → 사건 파일 → 조사 → 판정 → 결과 → 보관소 → 보고서까지 전 화면 동작. 테스트 39개, verify 인용 282개 통과.

배포: https://witness-stand-two.vercel.app (Vercel 프로젝트 `witness-stand`, light-herald와 같은 계정). 재배포는 `npx vercel deploy --prod`. 아이콘(`public/icon-*.png`)은 PIL로 만든 임시본 — 교체 가능.

경계선에 걸려 뺀 사건은 `docs/case-candidates.md` D절에 사유와 함께 남겨 두었다.

## 콘텐츠 작성

`rumors.json`·`testimonies.json`에 항목을 추가하고 `npm run verify`. 증언 카드 `quote`는 절 본문과 **완전 일치**해야 하고, 그 외 텍스트의 따옴표 안 문구(8자 이상)는 참조 절에 **포함**되어야 한다. `flags: ["review"]`가 남은 사건은 빌드는 통과하지만 게시판에 표시되지 않는다.

자동 배포: `main`에 push하면 Vercel이 빌드·배포한다 (prebuild에서 verify 실행).
