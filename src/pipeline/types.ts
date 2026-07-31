export interface ExtractedSignal {
  category: 'repeated' | 'faded' | 'unspoken_effort' | 'good_day';
  quote: string;   // 원문 그대로, 한 글자도 수정 없음
  date: string;    // YYYY-MM-DD
  context?: string; // 편지 조립 시 앞뒤 맥락을 살리기 위한 보조 정보 (선택)
}