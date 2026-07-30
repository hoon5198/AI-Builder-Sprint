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
import { entries } from './src/data/mockData';

type Screen = 'lock' | 'home' | 'cal' | 'envelope' | 'letter' | 'diary';

function AppInner() {
  const { colors } = useTheme();
  const [screen, setScreen] = useState<Screen>('lock');
  const [demoMode, setDemoMode] = useState(false);
  const [diaryDate, setDiaryDate] = useState<string | null>(null);
  const [diaryFromLetter, setDiaryFromLetter] = useState(false);

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
    if (entries[date]) {
      setDiaryDate(date);
      setDiaryFromLetter(false);
      setScreen('diary');
    }
    // 안 쓴 날 탭: 스켈레톤 단계에서는 미구현.
    // 다음 단계에서 "그 날짜 일기 쓰기" 화면으로 연결해야 함 (plan.md §7 [2]).
  }

  function handleQuoteTap(date: string) {
    setDiaryDate(date);
    setDiaryFromLetter(true);
    setScreen('diary');
  }

  const currentEntry = diaryDate ? entries[diaryDate] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="auto" />
      {screen === 'lock' && (
        <LockScreen onUnlock={handleUnlock} demoMode={demoMode} onToggleDemoMode={() => setDemoMode((v) => !v)} />
      )}
      {screen === 'home' && (
        <HomeScreen dateLabel={todayLabel} onOpenCalendar={() => setScreen('cal')} onOpenLetterbox={() => {}} />
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