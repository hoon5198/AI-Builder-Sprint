# 초하루 (Chohyaru)

매달 첫날, 지난달에 내가 쓴 일기로 만든 편지가 도착하는 일기 앱.

**한 줄 소개**: 내가 나한테 보낸 편지를, AI가 한 달 뒤에 배달한다.
AI는 위로를 만들지 않는다. 사용자가 이미 써둔 문장을 찾아 되돌려줄 뿐이다.

2026 AI Builder Sprint 예선 제출작

---

## 핵심 기능

- **일기 작성 & 저장**: 텍스트 직접 입력, 또는 사진 촬영/선택 후 OCR로 텍스트 자동 인식
- **편지 자동 생성**: 매달 1일, 지난달 일기를 분석해 그 사람의 목소리로 편지를 조립
  - 반복된 감정, 사라진 걱정, 해결된 걱정, 담담하게 적은 노력, 좋았던 날 — 5가지 신호를 코드+LLM으로 추출
  - 편지에 인용된 문장은 원본 일기와 반드시 정확히 일치하도록 코드로 검증 (LLM이 지어낸 문장은 자동 제거)
- **문장 탭 → 원본 일기 이동**: 편지 속 인용 문장을 누르면 그 날짜의 실제 일기로 이동, 하이라이트 표시
- **캘린더**: 쓴 날에만 점 표시 (안 쓴 날 표시·연속 기록·달성률 등 게이미피케이션 요소 일체 없음)
- **지문/PIN 인증**: 기기 등록된 생체인증 우선, 미지원 시 PIN 대체
- **다크모드**: 라이트/다크 전환 지원
- **데모 모드**: 발표 시연을 위해 "매달 1일 자동 진입" 로직을 강제로 트리거하는 숨김 토글 (잠금 화면 앱 이름 1.2초 길게 누르기)

## 기술 스택

- **프레임워크**: React Native (Expo SDK 54), TypeScript
- **저장**: AsyncStorage (기기 로컬, 서버 전송 없음)
- **인증**: expo-local-authentication (생체인증) + PIN fallback
- **OCR**: Upstage Document Digitization API
- **편지 조립 AI**: Google Gemini API (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest` 별칭으로 호출)
- **UI**: react-native-svg (아이콘·봉투 일러스트), 커스텀 디자인 시스템 (외부 UI 라이브러리 미사용)

## AI 파이프라인 구조

```
지난달 일기
   ↓ ① 전처리 (코드)
   ↓ ② 태깅 (LLM — 감정·주제 라벨링)
   ↓ ③ 신호 추출
      ├─ 반복된 감정 / 사라진 걱정 / 해결된 걱정 (코드, 빈도·전후반 비교)
      └─ 담담한 노력 / 좋았던 날 (LLM)
   ↓ ④ 조립 (LLM — 핵심 조각 추출 → 문단 계획(코드) → 자연스러운 편지 조립)
   ↓ ⑤ 검증 (순수 코드 — 인용 문장이 원본과 정확히 일치하는지 대조, 불일치 시 자동 제거·재생성)
완성된 편지
```

⑤ 검증 단계는 LLM에 맡기지 않고 반드시 코드(문자열 대조)로만 처리합니다. 이 앱의 신뢰성이 여기에 달려 있습니다.

---

## 로컬 실행 가이드

### 1. 필수 준비물

- Node.js (LTS 권장)
- 스마트폰의 **Expo Go** 앱 (App Store / Google Play, SDK 54 지원 버전)
- Upstage API 키 ([console.upstage.ai](https://console.upstage.ai)에서 발급, OCR용)
- Google Gemini API 키 ([aistudio.google.com](https://aistudio.google.com)에서 발급, 편지 조립용, 무료)

### 2. 설치

```bash
git clone https://github.com/yebbinie/AI-Builder-Sprint.git
cd AI-Builder-Sprint
npm ci
```

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일을 만들고 아래 내용을 입력합니다.

```
EXPO_PUBLIC_UPSTAGE_API_KEY=발급받은_Upstage_API_키
EXPO_PUBLIC_GEMINI_API_KEY=발급받은_Gemini_API_키
```

| 변수명 | 용도 | 발급처 |
|---|---|---|
| `EXPO_PUBLIC_UPSTAGE_API_KEY` | 손글씨/사진 일기 OCR 텍스트 인식 | console.upstage.ai |
| `EXPO_PUBLIC_GEMINI_API_KEY` | 편지 조립(핵심 조각 추출, 문단 생성) | aistudio.google.com (무료, 카드 불필요) |

두 키 모두 없으면 앱 실행 자체는 되지만, 각각 OCR 기능과 편지 생성 기능이 동작하지 않습니다 (편지는 예시 편지로 자동 대체됩니다).

### 4. 실행

```bash
npx expo start --clear
```

터미널에 뜨는 QR 코드를 스마트폰의 Expo Go 앱(또는 iOS 기본 카메라 앱)으로 스캔하면 앱이 실행됩니다. 폰과 컴퓨터가 같은 Wi-Fi 네트워크에 있어야 합니다.

같은 네트워크 연결이 어려운 경우:
```bash
npx expo start --tunnel
```

### 5. 데모 확인 경로

1. 잠금 화면에서 "초하루" 글자를 1.2초간 길게 눌러 데모 모드 활성화
2. 지문/PIN으로 잠금 해제 → 자동으로 편지 봉투 화면 진입
3. 봉투를 눌러 편지 열람
4. 편지 속 밑줄 그어진 인용 문장을 눌러 원본 일기로 이동, 하이라이트 확인
5. 홈 화면에서 "사진" 버튼으로 OCR 기능 확인 가능

---

## 실행/배포 환경 정보

- Expo SDK: 54
- React Native: 0.86
- React: 19.2
- TypeScript: 6.0
- 별도 배포된 웹/스토어 링크는 없으며, 위 로컬 실행 가이드를 통한 Expo Go 실행을 기준으로 합니다.
- 개발/테스트 환경: Windows 11, iOS/Android Expo Go 앱

## 프로젝트 문서

- `CLAUDE.md`: 프로젝트 핵심 원칙, 기술 스택, 절대 하지 말 것 목록 등 AI 협업 가이드
- `.claude/skills/chohyaru-design/SKILL.md`: 디자인 시스템 (색상 토큰, 타이포그래피, 컴포넌트 규격)
- `docs/plan.md`: 기획서 (기능 우선순위, 화면 흐름, AI 파이프라인, 일정)
- `docs/prototype.html`: 디자인 룩앤필 기준 프로토타입
- `docs/progress.md`: 개발 과정 전체 기록 (의사결정 이유, 시행착오, 버그 수정 내역)