import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiaryEntry } from './types';

const STORAGE_KEY = 'chohyaru:diaryEntries';

async function readAllEntries(): Promise<Record<string, DiaryEntry>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function getEntry(date: string): Promise<DiaryEntry | null> {
  const entries = await readAllEntries();
  return entries[date] ?? null;
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const entries = await readAllEntries();
  entries[entry.date] = entry;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// yearMonth: 'YYYY-MM'
export async function getEntriesForMonth(yearMonth: string): Promise<DiaryEntry[]> {
  const entries = await readAllEntries();
  return Object.values(entries)
    .filter((entry) => entry.date.startsWith(yearMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
}
