import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../ThemeContext';
import { receivedLetters } from '../data/mockData';

interface Props {
  onBack: () => void;
  onSelectLetter: (yearMonth: string) => void;
}

export default function LetterboxScreen({ onBack, onSelectLetter }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable onPress={onBack} style={styles.backRow}>
        <Text style={{ color: colors.sub, fontSize: 13 }}>‹ 오늘</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>편지함</Text>

      {receivedLetters.length === 0 ? (
        <Text style={[styles.empty, { color: colors.sub }]}>아직 도착한 편지가 없습니다</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {receivedLetters.map((letter) => (
            <Pressable
              key={letter.yearMonth}
              style={[styles.row, { borderBottomColor: colors.line }]}
              onPress={() => onSelectLetter(letter.yearMonth)}
            >
              <Text style={[styles.month, { color: colors.text }]}>{letter.monthLabel}</Text>
              <Text style={[styles.preview, { color: colors.sub }]} numberOfLines={1}>
                {letter.preview}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52, paddingHorizontal: 26, paddingBottom: 26 },
  backRow: { marginBottom: 22 },
  title: { fontFamily: 'GowunBatang_400Regular', fontSize: 19, marginBottom: 26 },
  row: { paddingVertical: 18, borderBottomWidth: 1 },
  month: { fontFamily: 'GowunBatang_400Regular', fontSize: 16, marginBottom: 6 },
  preview: { fontSize: 13 },
  empty: { marginTop: 'auto', fontSize: 12 },
});
