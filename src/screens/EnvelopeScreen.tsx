import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

interface Props {
  onOpen: () => void;
}

export default function EnvelopeScreen({ onOpen }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable onPress={onOpen} style={[styles.env, { borderColor: colors.line, backgroundColor: colors.envBody }]}>
        <View style={[styles.flap, { backgroundColor: colors.envFlap, borderBottomColor: colors.line }]} />
        <View style={[styles.seal, { backgroundColor: colors.accent }]} />
      </Pressable>
      <Text style={[styles.text, { color: colors.text }]}>7월의 편지가 도착했습니다</Text>
      <Text style={[styles.sub, { color: colors.sub }]}>봉투를 눌러 열기</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  env: { width: 190, height: 126, borderWidth: 1, borderRadius: 4, overflow: 'hidden' },
  flap: { position: 'absolute', top: 0, left: 0, right: 0, height: 70, borderBottomWidth: 1 },
  seal: { position: 'absolute', left: '50%', top: 62, marginLeft: -13, width: 26, height: 26, borderRadius: 13 },
  text: { fontFamily: 'GowunBatang_400Regular', fontSize: 15, marginTop: 30 },
  sub: { fontSize: 12, marginTop: 8 },
});