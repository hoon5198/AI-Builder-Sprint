import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

interface Props {
  onUnlock: () => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export default function LockScreen({ onUnlock, demoMode, onToggleDemoMode }: Props) {
  const { colors, mode, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1.2초 길게 누르면 데모 모드 토글 — CLAUDE.md가 명시한 숨김 버튼 */}
      <Pressable onLongPress={onToggleDemoMode} delayLongPress={1200}>
        <Text style={[styles.name, { color: colors.text }]}>초하루</Text>
      </Pressable>
      <Text style={[styles.sub, { color: colors.sub }]}>매달 첫날, 편지가 옵니다</Text>
      {demoMode && <Text style={[styles.demoTag, { color: colors.accent }]}>데모 모드 켜짐</Text>}

      <Pressable
        onPress={onUnlock}
        style={({ pressed }) => [
          styles.fp,
          { borderColor: colors.line },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <View style={[styles.fpInner, { borderColor: colors.sub }]} />
      </Pressable>
      <Text style={[styles.tip, { color: colors.sub }]}>지문으로 열기</Text>

      <Pressable onPress={toggleTheme} style={[styles.themeToggle, { borderColor: colors.line }]}>
        <Text style={{ color: colors.sub, fontSize: 12 }}>{mode === 'dark' ? '낮에 읽기' : '밤에 읽기'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },
  name: { fontFamily: 'GowunBatang_400Regular', fontSize: 32, letterSpacing: 4, marginBottom: 10 },
  sub: { fontSize: 13 },
  demoTag: { fontSize: 11, marginTop: 6, marginBottom: 48 },
  fp: { width: 74, height: 74, borderRadius: 37, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 48 },
  fpInner: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.4 },
  tip: { fontSize: 12, marginTop: 18 },
  themeToggle: { position: 'absolute', bottom: 34, borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18 },
});