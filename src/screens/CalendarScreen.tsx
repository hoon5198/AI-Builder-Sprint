import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { writtenDays } from '../data/mockData';

interface Props {
  onBack: () => void;
  onSelectDay: (day: number) => void;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const LEADING_BLANKS = 3; // 2026년 7월 1일은 수요일
const DAYS_IN_MONTH = 31;
const CELL = `${100 / 7}%` as const;

export default function CalendarScreen({ onBack, onSelectDay }: Props) {
  const { colors } = useTheme();
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable onPress={onBack} style={styles.backRow}>
        <Text style={{ color: colors.sub, fontSize: 13 }}>‹ 오늘</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>2026년 7월</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>{writtenDays.length}일의 기록</Text>

      <View style={styles.grid}>
        {DOW.map((d) => (
          <Text key={d} style={[styles.dow, { color: colors.sub }]}>{d}</Text>
        ))}
        {Array.from({ length: LEADING_BLANKS }).map((_, i) => (
          <View key={`b${i}`} style={styles.dayCell} />
        ))}
        {days.map((d) => {
          const has = writtenDays.includes(d);
          const isLetterDay = d === 1;
          return (
            <Pressable key={d} style={styles.dayCell} onPress={() => onSelectDay(d)}>
              <Text style={{ color: isLetterDay ? colors.accent : colors.text, fontSize: 14 }}>{d}</Text>
              {has ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : <View style={styles.dotEmpty} />}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.note, { color: colors.sub }]}>쓴 날에만 점이 찍힙니다.{'\n'}안 쓴 날은 표시하지 않습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52, paddingHorizontal: 26, paddingBottom: 26 },
  backRow: { marginBottom: 22 },
  title: { fontFamily: 'GowunBatang_400Regular', fontSize: 19, marginBottom: 4 },
  subtitle: { fontSize: 12, marginBottom: 26 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: CELL, textAlign: 'center', fontSize: 11, paddingBottom: 10 },
  dayCell: { width: CELL, height: 46, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 5 },
  dotEmpty: { height: 4, marginTop: 5 },
  note: { marginTop: 'auto', fontSize: 12, lineHeight: 19 },
});