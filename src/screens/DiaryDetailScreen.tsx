import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { DiaryEntry } from '../types';

interface Props {
  entry: DiaryEntry;
  fromLetter: boolean;
  onBack: () => void;
}

export default function DiaryDetailScreen({ entry, fromLetter, onBack }: Props) {
  const { colors } = useTheme();
  const showHighlight = fromLetter && entry.highlight && entry.body.includes(entry.highlight);
  const parts = showHighlight ? entry.body.split(entry.highlight as string) : [entry.body];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable onPress={onBack} style={styles.backRow}>
        <Text style={{ color: colors.sub, fontSize: 13 }}>‹ {fromLetter ? '편지로 돌아가기' : '캘린더로 돌아가기'}</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>{entry.dateLabel}</Text>
      <Text style={[styles.body, { color: colors.text }]}>
        {showHighlight ? (
          <>
            <Text>{parts[0]}</Text>
            <Text style={{ backgroundColor: colors.mark }}>{entry.highlight}</Text>
            <Text>{parts[1]}</Text>
          </>
        ) : (
          entry.body
        )}
      </Text>
      {fromLetter && <Text style={[styles.note, { color: colors.sub }]}>편지에서 인용된 문장입니다</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52, paddingHorizontal: 26, paddingBottom: 26 },
  backRow: { marginBottom: 22 },
  title: { fontFamily: 'GowunBatang_400Regular', fontSize: 18, marginBottom: 20 },
  body: { fontFamily: 'GowunBatang_400Regular', fontSize: 16, lineHeight: 32 },
  note: { marginTop: 'auto', fontSize: 12 },
});