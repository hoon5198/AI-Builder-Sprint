import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

interface Props {
  dateLabel: string;
  onOpenCalendar: () => void;
  onOpenLetterbox: () => void;
}

export default function HomeScreen({ dateLabel, onOpenCalendar, onOpenLetterbox }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <Text style={[styles.date, { color: colors.text }]}>{dateLabel}</Text>
        <View style={styles.icons}>
          <Pressable onPress={onOpenLetterbox}>
            <Text style={{ color: colors.sub, fontSize: 13 }}>편지함</Text>
          </Pressable>
          <Pressable onPress={onOpenCalendar}>
            <Text style={{ color: colors.sub, fontSize: 13 }}>캘린더</Text>
          </Pressable>
        </View>
      </View>
      <TextInput
        style={[styles.writer, { color: colors.text }]}
        placeholder="오늘은..."
        placeholderTextColor={colors.ph}
        multiline
        textAlignVertical="top"
        value={text}
        onChangeText={setText}
      />
      <View style={[styles.foot, { borderTopColor: colors.line }]}>
        <Text style={{ color: colors.sub, fontSize: 13 }}>사진</Text>
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
          <Text style={{ color: colors.bg, fontSize: 14 }}>저장</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52, paddingHorizontal: 26, paddingBottom: 26 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  date: { fontSize: 15, fontWeight: '500' },
  icons: { flexDirection: 'row', gap: 16 },
  writer: { flex: 1, fontFamily: 'GowunBatang_400Regular', fontSize: 16, lineHeight: 30 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 9, paddingHorizontal: 20, borderRadius: 20 },
});