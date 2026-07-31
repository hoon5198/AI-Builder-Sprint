import { verifyLetter } from './verify';
import { DiaryEntry, LetterParagraph } from '../types';

// 가짜 일기 데이터 (실제 storage.ts 없이 테스트)
const fakeEntries: Record<string, DiaryEntry> = {
  '2026-07-05': {
    date: '2026-07-05',
    dateLabel: '7월 5일 일요일',
    body: '며칠째 잠을 못 잤다. 피곤하다.',
  },
  '2026-07-09': {
    date: '2026-07-09',
    dateLabel: '7월 9일 목요일',
    body: '날씨 좋다. 산책했다.',
  },
};

async function fakeGetEntry(date: string): Promise<DiaryEntry | null> {
  return fakeEntries[date] ?? null;
}

// 테스트: 하나는 진짜 있는 인용, 하나는 일부러 없는(조작된) 인용
const testParagraphs: LetterParagraph[] = [
  {
    segments: [
      { type: 'text', content: '지난달엔 ' },
      { type: 'quote', content: '잠을 못 잤다', date: '2026-07-05' }, // 원본에 있음 → 통과해야 함
      { type: 'text', content: '고 자주 썼어.' },
    ],
  },
  {
    segments: [
      { type: 'quote', content: '동아리 면접 봤음', date: '2026-07-09' }, // 이 날짜엔 없는 문장 → 걸러져야 함
      { type: 'text', content: '이라고 적어놨더라.' },
    ],
  },
];

verifyLetter(testParagraphs, fakeGetEntry).then((result) => {
  console.log(JSON.stringify(result, null, 2));
});