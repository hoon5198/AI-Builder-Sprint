import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { letterMonthLabel, letterParagraphs, letterSignature } from '../data/mockData';
import { LetterSegment } from '../types';

interface Props {
  onQuoteTap: (date: string) => void;
}

export default function LetterScreen({ onQuoteTap }: Props) {
  const { colors } = useTheme();

  function renderSegment(segment: LetterSegment, key: string) {
    if (segment.type === 'quote') {
      return (
        <Text
          key={key}
          onPress={() => onQuoteTap(segment.date)}
          style={[styles.quote, { color: colors.accent, borderBottomColor: colors.accent }]}
        >
          {segment.content}
        </Text>
      );
    }
    return (
      <Text key={key} style={{ color: colors.text }}>
        {segment.content}
      </Text>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.month, { color: colors.sub }]}>{letterMonthLabel}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {letterParagraphs.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph.segments.map((segment, j) => renderSegment(segment, `${i}-${j}`))}
          </Text>
        ))}
        <Text style={[styles.signature, { color: colors.sub }]}>{letterSignature}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52, paddingHorizontal: 26, paddingBottom: 26 },
  scrollContent: { paddingBottom: 26 },
  month: { textAlign: 'center', fontSize: 13, marginBottom: 34 },
  paragraph: {
    fontFamily: 'GowunBatang_400Regular',
    fontSize: 15.5,
    lineHeight: 31,
    marginBottom: 22,
  },
  quote: { borderBottomWidth: StyleSheet.hairlineWidth },
  signature: { textAlign: 'right', fontSize: 13, marginTop: 4 },
});
