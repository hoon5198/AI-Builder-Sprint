import { DiaryEntry, LetterParagraph, ReceivedLetter } from '../types';

export const writtenDays = [1, 3, 5, 9, 12, 15, 18, 20, 24, 26, 27, 28];

export const entries: Record<string, DiaryEntry> = {
  '2026-07-01': { date: '2026-07-01', dateLabel: '7월 1일 수요일', body: '새 달 시작. 별생각 없이 하루 지나감. 저녁에 국수 해 먹음.' },
  '2026-07-03': { date: '2026-07-03', dateLabel: '7월 3일 금요일', body: '도서관에서 반나절. 집중이 잘 안 됐다. 그래도 앉아는 있었다.' },
  '2026-07-05': { date: '2026-07-05', dateLabel: '7월 5일 일요일', body: '며칠째 잠을 못 잤다. 대신 새벽에 라디오 들었는데 그건 좀 좋았다.', highlight: '잠을 못 잤다' },
  '2026-07-09': { date: '2026-07-09', dateLabel: '7월 9일 목요일', body: '날씨 좋다. 점심 먹고 캠퍼스 한 바퀴 돌았다. 벤치에 고양이 두 마리.', highlight: '날씨 좋다' },
  '2026-07-12': { date: '2026-07-12', dateLabel: '7월 12일 일요일', body: '동아리 면접 봤음. 손 떨렸는데 티는 안 났을 듯. 저녁은 라면.', highlight: '동아리 면접 봤음' },
  '2026-07-15': { date: '2026-07-15', dateLabel: '7월 15일 수요일', body: '엄마가 전화해서 삼십 분 떠들었다. 별 얘기 안 했는데 기분이 나아졌다.' },
  '2026-07-18': { date: '2026-07-18', dateLabel: '7월 18일 토요일', body: '친구랑 저녁. 오랜만에 많이 웃었다.' },
  '2026-07-20': { date: '2026-07-20', dateLabel: '7월 20일 월요일', body: '비 옴. 하루 종일 집에 있었다. 밀린 빨래를 했다.' },
  '2026-07-24': { date: '2026-07-24', dateLabel: '7월 24일 금요일', body: '붙었다. 얼떨떨해서 친구한테 세 번 말했다.', highlight: '붙었다' },
  '2026-07-26': { date: '2026-07-26', dateLabel: '7월 26일 일요일', body: '시장에서 복숭아 사 왔다. 한 박스에 만 이천 원. 두 개는 그 자리에서 먹음.', highlight: '복숭아 한 박스' },
  '2026-07-27': { date: '2026-07-27', dateLabel: '7월 27일 월요일', body: '별일 없음. 일찍 잠.' },
  '2026-07-28': { date: '2026-07-28', dateLabel: '7월 28일 화요일', body: '팀플. 정신없었지만 재밌었다.' },
};

export const letterMonthLabel = '2026년 7월';

export const letterParagraphs: LetterParagraph[] = [
  { segments: [{ type: 'text', content: '잘 지내고 있으려나.' }] },
  {
    segments: [
      { type: 'text', content: '한동안 ' },
      { type: 'quote', content: '잠을 못 잔다', date: '2026-07-05' },
      { type: 'text', content: '고 자주 썼는데, 뒤로 갈수록 그 얘기가 없어졌더라. 언제 괜찮아졌는지는 나도 모르겠어. 그냥 어느 날부터 안 썼어. 그런 것들은 늘 그렇게 지나가나 봐.' },
    ],
  },
  {
    segments: [
      { type: 'quote', content: '날씨 좋다', date: '2026-07-09' },
      { type: 'text', content: '는 말은 참 여러 번 썼더라. 벤치에 고양이가 두 마리 앉아 있었다는 것까지 굳이 적어놨던데, 그런 걸 적어두는 사람이구나 싶어서 좀 웃었어.' },
    ],
  },
  {
    segments: [
      { type: 'quote', content: '면접 보고 온 날', date: '2026-07-12' },
      { type: 'text', content: '은 여섯 글자로 끝냈더라. 저녁에 먹은 라면 얘기가 더 길었어. 며칠 전만 해도 사람 만나는 게 부담이라고 써놓고선. 별거 아니라고 생각했겠지. 근데 나는 그날이 제일 좋았어.' },
    ],
  },
  {
    segments: [
      { type: 'quote', content: '붙었다는 소식', date: '2026-07-24' },
      { type: 'text', content: ' 듣고 얼떨떨하다는 말을 세 번이나 한 것도, 시장에서 ' },
      { type: 'quote', content: '복숭아 한 박스', date: '2026-07-26' },
      { type: 'text', content: ' 사 와서 두 개는 그 자리에서 먹었다는 것도 다 읽었어. 그런 문장으로 한 달이 끝나는 것도 나쁘지 않네.' },
    ],
  },
  {
    segments: [{ type: 'text', content: '다음 달의 너는 이걸 잊고 있을 텐데, 그래도 한 번은 읽어줬으면 좋겠다.' }],
  },
];

export const letterSignature = '— 7월의 나로부터';

export const receivedLetters: ReceivedLetter[] = [
  { yearMonth: '2026-07', monthLabel: letterMonthLabel, preview: '잘 지내고 있으려나.' },
];