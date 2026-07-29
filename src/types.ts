export interface DiaryEntry {
  date: string; // 'YYYY-MM-DD'
  dateLabel: string; // '7월 5일 일요일'
  body: string;
  highlight?: string; // 편지 인용과 정확히 일치하는 부분 문자열 — 일기 상세에서 하이라이트
}

export type LetterSegment =
  | { type: 'text'; content: string }
  | { type: 'quote'; content: string; date: string };

export interface LetterParagraph {
  segments: LetterSegment[];
}