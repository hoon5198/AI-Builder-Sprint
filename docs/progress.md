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
function getEntriesForMonth(yearMonth: string): DiaryEntry[]
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

<!-- 다음 작업자는 여기 아래에 이어서 기록하세요 -->
