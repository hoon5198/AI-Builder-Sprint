export interface ExtractedSignal {
  category: 'repeated' | 'faded' | 'unspoken_effort';
  quote: string;   // 원문 그대로, 한 글자도 수정 없음
  date: string;    // YYYY-MM-DD
}