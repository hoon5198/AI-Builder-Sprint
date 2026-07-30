import 'dotenv/config';
import { generateLetter } from './generateLetter';
import { realSignalsJuly } from './realSignals';
import { realEntriesJuly } from '../data/realEntries';
import { DiaryEntry } from '../types';

async function getRealEntry(date: string): Promise<DiaryEntry | null> {
  return realEntriesJuly[date] ?? null;
}

generateLetter(realSignalsJuly, '2026년 7월', getRealEntry, '2026-07-test')
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((err) => console.error(err));