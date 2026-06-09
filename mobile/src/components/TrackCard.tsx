import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';
import type { Track } from '../types';

interface TrackCardProps {
  track: Track;
  resolvingYoutube: boolean;
  theme: Theme;
  onOpenYoutube: (track: Track) => void;
}

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export function TrackCard({ track, resolvingYoutube, theme, onOpenYoutube }: TrackCardProps) {
  const styles = createStyles(theme);
  const getSongBpmUrl = `https://getsongbpm.com/search?q=${encodeURIComponent(`${track.artists} ${track.name}`)}`;

  return (
    <View style={styles.card}>
      {track.albumArt ? (
        <Image source={{ uri: track.albumArt }} style={styles.artwork} />
      ) : (
        <View style={[styles.artwork, styles.placeholder]}>
          <Text style={styles.placeholderIcon}>♫</Text>
        </View>
      )}

      <View style={styles.content}>
        <View>
          <Text numberOfLines={1} style={styles.title}>{track.name}</Text>
          <Text numberOfLines={1} style={styles.artist}>{track.artists}</Text>
          <Text numberOfLines={1} style={styles.album}>
            {track.album || formatDuration(track.durationMs)}
          </Text>
        </View>

        <View style={styles.badges}>
          <View style={[styles.badge, styles.bpmBadge]}>
            <Text style={styles.bpmText}>{track.bpm ? `${track.bpm} BPM` : 'BPM non analysé'}</Text>
          </View>
          {track.keyText ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{track.keyText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          {track.deezerUrl ? (
            <ActionButton label="Deezer" color="#af52de" theme={theme} onPress={() => Linking.openURL(track.deezerUrl!)} />
          ) : null}
          {track.id.startsWith('gsb-') ? (
            <ActionButton label="GetSongBPM" color="#35c0f0" theme={theme} onPress={() => Linking.openURL(getSongBpmUrl)} />
          ) : null}
          <ActionButton
            label={resolvingYoutube ? 'Recherche…' : 'YouTube'}
            color={theme.accent}
            disabled={resolvingYoutube}
            theme={theme}
            onPress={() => onOpenYoutube(track)}
          />
        </View>
      </View>
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  color: string;
  disabled?: boolean;
  theme: Theme;
  onPress: () => void;
}

function ActionButton({ label, color, disabled, theme, onPress }: ActionButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        stylesShared.actionButton,
        { borderColor: color, backgroundColor: pressed ? color : 'transparent', opacity: disabled ? 0.5 : 1 }
      ]}
    >
      {({ pressed }) => (
        <Text style={[stylesShared.actionText, { color: pressed ? theme.white : color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const stylesShared = StyleSheet.create({
  actionButton: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { fontSize: 12, fontWeight: '800' }
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    padding: 14
  },
  artwork: { backgroundColor: theme.control, borderRadius: 14, height: 100, width: 100 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { color: theme.textTertiary, fontSize: 34 },
  content: { flex: 1, gap: 9, justifyContent: 'space-between', minWidth: 0 },
  title: { color: theme.text, fontSize: 16, fontWeight: '800' },
  artist: { color: theme.textSecondary, fontSize: 14, marginTop: 2 },
  album: { color: theme.textTertiary, fontSize: 12, marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { backgroundColor: theme.control, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  bpmBadge: { backgroundColor: theme.accentSoft },
  badgeText: { color: theme.textSecondary, fontSize: 11, fontWeight: '700' },
  bpmText: { color: theme.accent, fontSize: 11, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }
});
