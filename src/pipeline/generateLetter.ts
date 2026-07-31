import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExtractedSignal } from './types';
import { assembleLetter } from './assemble';
import { verifyLetter } from './verify';
import { DiaryEntry, LetterParagraph } from '../types';

interface CachedLetter {
  paragraphs: LetterParagraph[];
  signature: string;
}

function cacheKey(yearMonth: string) {
  return `letter-cache:${yearMonth}`;
}

export async function generateLetter(
  signals: ExtractedSignal[],
  monthLabel: string,
  getEntryByDate: (date: string) => Promise<DiaryEntry | null>,
  yearMonth: string
): Promise<{ paragraphs: LetterParagraph[]; signature: string }> {
  // 1. 캐시부터 확인
  try {
    const cached = await AsyncStorage.getItem(cacheKey(yearMonth));
    if (cached) {
      return JSON.parse(cached) as CachedLetter;
    }
  } catch (err) {
    console.warn('캐시 읽기 실패, 새로 생성합니다:', err);
  }

  // 2. 캐시 없으면 새로 생성
  const assembled = await assembleLetter(signals, monthLabel);
  const verified = await verifyLetter(assembled.paragraphs, getEntryByDate);

  if (verified.removedCount > 0) {
    console.warn(`편지 조립 후 검증에서 ${verified.removedCount}개 문단 제거됨`);
  }

  const result = { paragraphs: verified.paragraphs, signature: assembled.signature };

  // 3. 생성된 결과 캐시에 저장
  try {
    await AsyncStorage.setItem(cacheKey(yearMonth), JSON.stringify(result));
  } catch (err) {
    console.warn('캐시 저장 실패 (다음에도 새로 생성됨):', err);
  }

  return result;
}