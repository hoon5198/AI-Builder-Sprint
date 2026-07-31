import 'dotenv/config';
import { assembleLetter } from './assemble';
import { ExtractedSignal } from './types';

const fakeSignals: ExtractedSignal[] = [
  { category: 'faded', quote: '잠을 못 잤다', date: '2026-07-05' },
  { category: 'repeated', quote: '날씨 좋다', date: '2026-07-09' },
  { category: 'unspoken_effort', quote: '동아리 면접 봤음', date: '2026-07-12' },
];

assembleLetter(fakeSignals, '2026년 7월')
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((err) => console.error(err));