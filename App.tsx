import { realEntriesJuly } from './src/data/realEntries';
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, GowunBatang_400Regular } from '@expo-google-fonts/gowun-batang';

import { ThemeProvider, useTheme } from './src/ThemeContext';
import LockScreen from './src/screens/LockScreen';
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import EnvelopeScreen from './src/screens/EnvelopeScreen';
import LetterScreen from './src/screens/LetterScreen';
import DiaryDetailScreen from './src/screens/DiaryDetailScreen';
import DiaryWriteScreen from './src/screens/DiaryWriteScreen';
import LetterboxScreen from './src/screens/LetterboxScreen';
import { entries } from './src/data/mockData';

type Screen = 'lock' | 'home' | 'cal' | 'envelope' | 'letter' | 'diary' | 'write' | 'letterbox';

function AppInner() {
  const { colors } = useTheme();
  const [screen, setScreen] = useState<Screen>('lock');
  const [demoMode, setDemoMode] = useState(false);
  const [diaryDate, setDiaryDate] = useState<string | null>(null);
  const [diaryFromLetter, setDiaryFromLetter] = useState(false);
  const [writeDate, setWriteDate] = useState<string | null>(null);

  const todayLabel = '7월 28일 화요일'; // TODO: 실제 날짜 로직 붙일 때 교체

  function handleUnlock() {
    // 데모 모드일 때는 "이번 달 1일 첫 실행"으로 강제 취급해 편지로 바로 진입한다.
    // 실제 로직: 오늘이 매달 1일 && 이번 달 첫 실행인지 확인.
    setScreen(demoMode ? 'envelope' : 'home');
  }

  function handleSelectDay(day: number) {
    if (day === 1) {
      setScreen('envelope');
      return;
    }
    const date = `2026-07-${String(day).padStart(2, '0')}`;
    if (realEntriesJuly[date] || entries[date]) {
      setDiaryDate(date);
      setDiaryFromLetter(false);
      setScreen('diary');
    } else {
      // 안 쓴 날: "놓쳤다"가 아니라 "아직 안 썼다" — 그 날짜 일기 쓰기 화면으로 이동 (plan.md §7 [2])
      setWriteDate(date);
      setScreen('write');
    }
  }

  function handleQuoteTap(date: string) {
    setDiaryDate(date);
    setDiaryFromLetter(true);
    setScreen('diary');
  }

  const currentEntry = diaryDate ? (realEntriesJuly[diaryDate] ?? entries[diaryDate]) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="auto" />
      {screen === 'lock' && (
        <LockScreen onUnlock={handleUnlock} demoMode={demoMode} onToggleDemoMode={() => setDemoMode((v) => !v)} />
      )}
      {screen === 'home' && (
        <HomeScreen
          dateLabel={todayLabel}
          onOpenCalendar={() => setScreen('cal')}
          onOpenLetterbox={() => setScreen('letterbox')}
        />
      )}
      {screen === 'cal' && <CalendarScreen onBack={() => setScreen('home')} onSelectDay={handleSelectDay} />}
      {screen === 'envelope' && <EnvelopeScreen onOpen={() => setScreen('letter')} />}
      {screen === 'letter' && <LetterScreen onQuoteTap={handleQuoteTap} />}
      {screen === 'diary' && currentEntry && (
        <DiaryDetailScreen
          entry={currentEntry}
          fromLetter={diaryFromLetter}
          onBack={() => setScreen(diaryFromLetter ? 'letter' : 'cal')}
        />
      )}
      {screen === 'write' && writeDate && (
        <DiaryWriteScreen date={writeDate} onBack={() => setScreen('cal')} onSaved={() => setScreen('cal')} />
      )}
      {screen === 'letterbox' && (
        <LetterboxScreen onBack={() => setScreen('home')} onSelectLetter={() => setScreen('envelope')} />
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ GowunBatang_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}