# 진행 기록

> 이 파일은 CLAUDE.md/SKILL.md(안 바뀌는 원칙)와 별개로, "지금까지 뭘 했고 왜 그렇게 했는지"를 남기는 로그입니다.
> 새로 합류하거나 다른 브랜치에서 작업을 이어받는 사람(또는 AI)은 이 파일을 CLAUDE.md와 함께 먼저 읽으세요.
> 작업하다가 중요한 결정을 내리면 이 파일 맨 아래에 이어서 추가해주세요.

---

## 2026-07-29 — 화면 스켈레톤 완성

### 한 것
- 6화면(잠금·홈·캘린더·봉투·편지·일기상세) `docs/prototype.html` 기준으로 React Native로 옮김
- `src/theme.ts`, `src/ThemeContext.tsx` — SKILL.md §1 색 토큰, §2 타이포그래피 그대로 반영
- `src/data/mockData.ts` — 가짜 일기 데이터 + 편지 문안 (실데이터 아님, 개발용)
- 네비게이션은 라이브러리 없이 `App.tsx`에서 화면 이름을 state로 전환하는 방식

### 의도적으로 단순화한 부분 (아직 SKILL.md 기준 100% 미충족 — 나중에 보완 필요)
- **아이콘**: SKILL.md §7은 선 아이콘(stroke 1.4px)을 요구하는데, `react-native-svg`가 아직 설치 안 돼 있어서 지금은 텍스트 라벨("캘린더", "편지함")로 대체함. 나중에 `react-native-svg` 추가하고 `prototype.html`의 SVG path를 그대로 옮기면 됨
- **봉투 플랩**: 원본은 CSS `clip-path`로 삼각형인데 RN엔 없어서 지금은 사각형. 시간 되면 SVG로 삼각형 처리
- **캘린더 "안 쓴 날 탭"**: 지금은 아무 동작 안 함. `plan.md` §7 [2]대로 "그 날짜 일기 쓰기" 화면으로 연결해야 함 (사람 1 작업)
- **편지함 화면(plan.md P0 #9)**: 스켈레톤엔 아직 없음 (사람 1 작업)

### Expo SDK 57 → 54 다운그레이드한 이유
- 최초 세팅이 SDK 57이었는데, **SDK 57용 Expo Go 앱이 아직 앱스토어/플레이스토어 심사 중**이라 폰에서 "incompatible" 에러가 남
- 확인해보니 **현재 스토어에 정식으로 풀린 버전은 SDK 54**뿐 (55, 56, 57 전부 심사 대기)
- 그래서 `expo`, `react-native` 등을 전부 54 기준으로 내림. **SDK 버전을 임의로 다시 올리지 말 것** — 스토어에 54가 아닌 게 풀렸다는 공식 확인 없이 올리면 똑같은 에러 재발함
- 만약 나중에 55/56/57이 스토어에 정식으로 올라왔다는 게 확인되면, 그때는 `npx expo install expo@^해당버전.0.0` → `npx expo install --fix`로 올리면 됨

### AGENTS.md에 대해
- 내용: "Expo가 최근 많이 바뀌었으니 코드 짜기 전에 버전별 공식 문서(`https://docs.expo.dev/versions/v57.0.0/`) 확인하라"는 메모
- **지우지 말 것.** 다만 지금은 SDK 54로 내렸으니, 이 메모를 참고할 땐 v57이 아니라 **v54 문서**를 봐야 함 (`https://docs.expo.dev/versions/v54.0.0/`)

### 코딩할 때 주의할 파일 (충돌 방지)
- `App.tsx`, `src/screens/`, `src/theme.ts`, `src/ThemeContext.tsx` — 사람 1 담당, 다른 사람이 고쳐야 하면 단톡방에 먼저 말할 것
- `src/pipeline/` — 사람 2·3이 같이 쓰는 폴더. 파일 단위로 나눠서 작업 (예: `preprocess.ts`/`tagging.ts`/`extract.ts`는 사람 2, `assemble.ts`/`verify.ts`는 사람 3)
- `src/ocr/` — 사람 3

### 팀 간 인터페이스 (미리 합의된 약속, 임의로 바꾸지 말 것)

사람 1이 만들 함수:
```ts
// src/storage.ts
function getEntriesForMonth(yearMonth: string): Promise<DiaryEntry[]>
// AsyncStorage 기반이라 비동기. 쓸 때 반드시 await 붙일 것
```

사람 2 → 사람 3으로 넘기는 데이터 형태:
```ts
interface ExtractedSignal {
  category: 'repeated' | 'faded' | 'unspoken_effort';
  quote: string;   // 원문 그대로, 한 글자도 수정 없음
  date: string;    // YYYY-MM-DD
}
```

이 두 가지는 아직 실제 구현 전이라도, 이 타입을 기준으로 각자 가짜 데이터를 만들어서 먼저 개발을 시작할 수 있음.

### 실데이터 수집 (plan.md §14)
- 아직 시작 전. 오늘(7/29)부터 셋 다 시작해야 함 — 사람 2·3의 파이프라인 테스트에 필요

---

## 2026-07-30 — 코드 합류 + 캘린더 연결 · 편지함 화면 · storage.ts

### 브랜치 상태 관련 (먼저 알아야 할 것)
- `hyelim` 브랜치엔 그동안 docs만 있었고, 실제 코드 스켈레톤(App.tsx, src/ 등)은 `origin/hoooon` 브랜치에 있었음
- `origin/hoooon`의 **코드 파일만** 체크아웃해서 `hyelim`으로 가져옴 (`git checkout origin/hoooon -- App.tsx src/ assets/ ...`). docs(plan.md, 이 파일 등)는 `hyelim`의 최신 버전을 그대로 유지 — hoooon 쪽 docs는 더 오래된 버전(예: 역할분담 4인 버전, 연말편지 항목 빠짐)이라 덮어쓰지 않음
- 이후 코딩할 때는 `hyelim`이 코드까지 포함한 브랜치가 됐다는 전제로 작업하면 됨

### 빌드가 아예 안 되던 문제 발견 및 수정
- `src/screens/LetterScreen.tsx`가 **첫 커밋(43f86b3)부터 빈 파일**이었음 — 한 번도 구현된 적 없음. `App.tsx`가 default export 없는 모듈을 import해서 `npx tsc --noEmit` 자체가 실패하는 상태였음
- 오늘 요청받은 3개 작업을 확인하려면 빌드가 되어야 해서, SKILL.md §5(시그니처 화면: 편지) 기준 + `mockData.ts`에 이미 있던 `letterParagraphs`/`letterMonthLabel`/`letterSignature`를 써서 최소 구현함
- 인용 문장 탭 → `onQuoteTap(date)` 연결까지 되어 있음. 톤·카피는 손대지 않음(이미 mockData에 완성된 7월 편지 예시 그대로 사용)

### 오늘 요청받은 작업 3가지
1. **캘린더 "안 쓴 날" 탭 연결**
   - 새 화면 `src/screens/DiaryWriteScreen.tsx` 추가 — HomeScreen과 UI는 비슷하지만 임의 날짜용(뒤로가기 있음, 캘린더로 복귀)
   - `App.tsx`의 `handleSelectDay`: mock `entries`에 없는 날짜면 `write` 화면으로 분기 (기존엔 주석만 있고 미구현이었음)
   - "놓쳤다"가 아니라 "아직 안 썼다" 원칙대로 실패 표시 없음, placeholder만 다르게("이 날은...")

2. **편지함 화면 (plan.md P0 #9) 신규 구현**
   - `src/screens/LetterboxScreen.tsx` — 받은 편지 월별 리스트. 카드 없이 `--line` 구분선만 사용(SKILL.md §7 "카드는 쓰지 않는다")
   - `mockData.ts`에 `receivedLetters` 배열 추가 (현재는 7월 1건만 — 편지 데이터 자체가 아직 월별로 분리 저장되지 않기 때문. 편지 콘텐츠가 여러 달로 늘어나면 여기 확장 필요)
   - `HomeScreen`의 "편지함" 버튼(App.tsx의 `onOpenLetterbox`)이 원래 빈 함수였는데 실제로 화면 전환하게 연결. 편지함 항목 탭 → 봉투 화면으로 이동

3. **`src/storage.ts` 신규 — `getEntriesForMonth(yearMonth)`**
   - AsyncStorage 기반으로 실제 구현 (mock 반환 아님)
   - 짝 함수로 `getEntry(date)` / `saveEntry(entry)`도 같이 추가 — 안 쓴 날 → 일기 쓰기 화면이 실제로 읽고 저장할 대상이 필요했음
   - ⚠️ **인터페이스 문서(이 파일 상단, 사람1→사람2 약속)엔 `getEntriesForMonth`가 동기 함수(`DiaryEntry[]` 리턴)로 적혀 있었는데, AsyncStorage 자체가 비동기라 `Promise<DiaryEntry[]>`로 구현함.** 사람2가 갖다 쓸 때 `await` 필요 — 단톡방에 공유 필요
   - `src/dateUtils.ts`도 새로 추가: `formatDateLabel(dateStr)` — `'YYYY-MM-DD'` → `'7월 12일 일요일'`. 캘린더에서 고른 임의 날짜에 라벨을 붙이려면 필요했음 (기존엔 오늘 날짜만 하드코딩)

### 확인한 것 / 못 한 것
- `npx tsc --noEmit` 통과 (컴파일 에러 없음)
- 실기기(Expo Go)·브라우저로 화면을 직접 눈으로 확인하는 건 이번엔 못 했음 — 다음 작업자가 QR 스캔으로 직접 확인 필요
- 웹 프리뷰(`react-dom`, `react-native-web`) 설치해서 확인해보려다가 이 프로젝트는 폰 전용(Expo Go)이 기본 검증 경로라 되돌림 — `package.json`엔 안 남아 있음

### 아직 안 끝난 것 (다음 작업자용)
- 캘린더의 "쓴 날" 점 표시는 여전히 `mockData.writtenDays` 하드코딩 기반. 오늘 새로 쓴 일기가 캘린더 점에 반영되려면 캘린더 ↔ storage 연동이 별도로 더 필요함 (역할분담 문서 "사람 1 — 캘린더 완성" 항목, 오늘 범위 아니었음)
- 편지함은 현재 7월 1건만 있어서 리스트가 사실상 의미 없음. 편지 파이프라인(사람2·3)이 월별로 편지를 만들어내기 시작하면 `receivedLetters`를 실제 데이터로 교체해야 함

<!-- 다음 작업자는 여기 아래에 이어서 기록하세요 -->

## 2026-07-30 (추가) — 문서 버전 혼선 확인 및 정리

- 어제 progress.md에 "hoooon 쪽 docs는 오래된 버전(4인 역할분담, 연말편지 항목 빠짐)"이라는 메모가 있었으나,
  확인 결과 그런 별도 버전은 실제로 존재하지 않았음 (plan.md에 "연말편지" 검색해도 안 나오고, 팀원도 확인해줌)
- docs 폴더엔 plan.md / progress.md / prototype.html / 초하루_역할분담.md 이렇게 4개뿐이고, 역할분담 문서는
  하나뿐이라 버전 통일 문제 자체가 없었음
- 앞으로 문서 관련 메모 남길 땐 "어느 파일의 어느 버전"인지 파일명을 정확히 적을 것 (헷갈림 방지)

## 2026-07-30 (추가) — 브랜치 정리 완료, main이 기준점으로 확정

### 있었던 일
- hoooon과 hyelim이 애초에 커밋 역사가 서로 다른 브랜치였음(각자 로컬에서 git init한 결과로 추정)
- 이 때문에 GitHub PR 화면이 정상 작동 안 해서, 로컬에서 강제 병합(`--allow-unrelated-histories`) 진행
- `sync-hyelim`이라는 임시 브랜치를 만들어 main 기준으로 hyelim을 합치고 → PR → main에 merge 완료
- 이후 hoooon 브랜치도 main과 다시 합쳐서(충돌 5개 파일 발생, 전부 main 내용으로 채택) 최신화 완료
- **결론: 지금부터 main이 진짜 최신 기준점.** 각자 브랜치에서 작업 시작 전엔 반드시
  `git fetch origin` → `git merge origin/main`으로 최신화할 것

### CLAUDE.md 추가된 내용
- "저장소 규칙" 섹션 추가됨: PR/이슈/커밋은 원본 레포(ApptiveDev/AI-Builder-Sprint)가 아닌
  포크한 팀 레포에만 할 것 (대회 측 공지 반영)

### 사람 3 (지문) 진행 상황
- `src/pipeline/types.ts` 작성 완료 — `ExtractedSignal` 타입 정의됨
```ts
  interface ExtractedSignal {
    category: 'repeated' | 'faded' | 'unspoken_effort';
    quote: string;   // 원문 그대로, 한 글자도 수정 없음
    date: string;    // YYYY-MM-DD
  }
```
- 다음: `assemble.ts`(조립), `verify.ts`(검증) 작업 예정

### 사람 2 (yebbinie)에게
- 작업 시작 전에 본인 브랜치에서 `git fetch origin` + `git merge origin/main` 먼저 해서 최신 상태로 맞춰줘
- `getEntriesForMonth`는 비동기(`Promise<DiaryEntry[]>`)인 거 위쪽에 이미 적혀있으니 참고
- 사람2 → 사람3으로 넘길 `ExtractedSignal` 타입은 위에서 확정됨 (`src/pipeline/types.ts`), 이 타입 그대로 맞춰서 `extract.ts` 결과를 만들어주면 됨