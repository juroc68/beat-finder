import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View
} from 'react-native';
import type { Theme } from '../theme';

interface MetronomeModalProps {
  visible: boolean;
  bpm: number;
  theme: Theme;
  onChangeBpm: (bpm: number) => void;
  onClose: () => void;
}

const clampBpm = (bpm: number) => Math.min(Math.max(bpm, 40), 220);

export function MetronomeModal({ visible, bpm, theme, onChangeBpm, onClose }: MetronomeModalProps) {
  const styles = createStyles(theme);
  const [playing, setPlaying] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [hapticsEnabled, setHapticsEnabled] = useState(Platform.OS === 'android');
  const bpmRef = useRef(bpm);
  const hapticsRef = useRef(hapticsEnabled);
  const pendulum = useRef(new Animated.Value(-1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { hapticsRef.current = hapticsEnabled; }, [hapticsEnabled]);

  useEffect(() => {
    if (!visible) setPlaying(false);
  }, [visible]);

  useEffect(() => {
    if (!playing) {
      Vibration.cancel();
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let nextBeatAt = Date.now() + 80;
    let direction = 1;

    const tick = () => {
      if (cancelled) return;

      const interval = 60_000 / bpmRef.current;
      setBeatCount((count) => count + 1);
      if (hapticsRef.current && Platform.OS === 'android') {
        Vibration.vibrate(12);
      }

      pulse.setValue(0);
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 120, useNativeDriver: true })
      ]).start();
      Animated.timing(pendulum, {
        toValue: direction,
        duration: Math.max(120, interval),
        useNativeDriver: true
      }).start();
      direction *= -1;

      nextBeatAt += interval;
      const now = Date.now();
      if (nextBeatAt < now) nextBeatAt = now + interval;
      timer = setTimeout(tick, Math.max(0, nextBeatAt - now));
    };

    timer = setTimeout(tick, 80);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      pendulum.stopAnimation();
      pulse.stopAnimation();
      Vibration.cancel();
    };
  }, [pendulum, playing, pulse]);

  const close = () => {
    setPlaying(false);
    setBeatCount(0);
    onClose();
  };

  const rotation = pendulum.interpolate({ inputRange: [-1, 1], outputRange: ['-25deg', '25deg'] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>MÉTRONOME</Text>
              <Text style={styles.title}>Garde le tempo.</Text>
            </View>
            <Pressable onPress={close} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.metronomeBody}>
            <Animated.View style={[styles.pulse, { transform: [{ scale: pulseScale }] }]} />
            <Animated.View style={[styles.needle, { transform: [{ rotate: rotation }] }]}>
              <View style={styles.weight} />
            </Animated.View>
            <View style={styles.pivot} />
          </View>

          <Text style={styles.bpm}>{bpm}</Text>
          <Text style={styles.bpmLabel}>BATTEMENTS PAR MINUTE</Text>

          <View style={styles.adjustments}>
            {[-5, -1, 1, 5].map((amount) => (
              <Pressable
                key={amount}
                onPress={() => onChangeBpm(clampBpm(bpm + amount))}
                style={({ pressed }) => [styles.adjustButton, pressed && styles.controlPressed]}
              >
                <Text style={styles.adjustText}>{amount > 0 ? `+${amount}` : amount}</Text>
              </Pressable>
            ))}
          </View>

          {Platform.OS === 'android' ? (
            <Pressable onPress={() => setHapticsEnabled((enabled) => !enabled)} style={styles.hapticRow}>
              <Text style={styles.hapticText}>Impulsion tactile</Text>
              <View style={[styles.switchTrack, hapticsEnabled && styles.switchTrackActive]}>
                <View style={[styles.switchThumb, hapticsEnabled && styles.switchThumbActive]} />
              </View>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setPlaying((current) => !current)}
            style={({ pressed }) => [
              styles.playButton,
              playing && styles.stopButton,
              pressed && styles.playButtonPressed
            ]}
          >
            <Text style={styles.playButtonText}>{playing ? 'Arrêter' : 'Démarrer'}</Text>
          </Pressable>
          <Text style={styles.beatCount}>{playing ? `Battement ${beatCount}` : 'Prêt'}</Text>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: { backgroundColor: theme.overlay, flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 32,
    paddingHorizontal: 22,
    paddingTop: 10
  },
  handle: { alignSelf: 'center', backgroundColor: theme.border, borderRadius: 3, height: 5, marginBottom: 18, width: 42 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: theme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
  closeButton: { alignItems: 'center', backgroundColor: theme.control, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  closeText: { color: theme.textSecondary, fontSize: 27, lineHeight: 30 },
  metronomeBody: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.control,
    borderRadius: 22,
    height: 170,
    justifyContent: 'flex-end',
    marginTop: 22,
    overflow: 'hidden',
    paddingBottom: 22,
    width: 190
  },
  needle: { backgroundColor: theme.accent, borderRadius: 2, height: 115, transformOrigin: 'bottom', width: 4 },
  weight: { backgroundColor: theme.text, borderRadius: 3, height: 12, left: -7, position: 'absolute', top: 30, width: 18 },
  pivot: { backgroundColor: theme.text, borderColor: theme.surface, borderRadius: 8, borderWidth: 3, bottom: 16, height: 16, position: 'absolute', width: 16 },
  pulse: { backgroundColor: theme.accentSoft, borderRadius: 40, bottom: -8, height: 80, position: 'absolute', width: 80 },
  bpm: { color: theme.text, fontSize: 52, fontWeight: '800', letterSpacing: -2, marginTop: 18, textAlign: 'center' },
  bpmLabel: { color: theme.textTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center' },
  adjustments: { flexDirection: 'row', gap: 8, marginTop: 18 },
  adjustButton: { alignItems: 'center', backgroundColor: theme.control, borderRadius: 12, flex: 1, paddingVertical: 11 },
  controlPressed: { backgroundColor: theme.controlPressed },
  adjustText: { color: theme.text, fontSize: 15, fontWeight: '800' },
  hapticRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  hapticText: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
  switchTrack: { backgroundColor: theme.controlPressed, borderRadius: 14, height: 28, padding: 3, width: 48 },
  switchTrackActive: { backgroundColor: theme.accent },
  switchThumb: { backgroundColor: theme.white, borderRadius: 11, height: 22, width: 22 },
  switchThumbActive: { alignSelf: 'flex-end' },
  playButton: { alignItems: 'center', backgroundColor: theme.accent, borderRadius: 15, marginTop: 20, paddingVertical: 15 },
  stopButton: { backgroundColor: theme.text },
  playButtonPressed: { opacity: 0.78 },
  playButtonText: { color: theme.white, fontSize: 16, fontWeight: '800' },
  beatCount: { color: theme.textTertiary, fontSize: 12, marginTop: 10, textAlign: 'center' }
});
