import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { API_URL, resolveYoutubeTrack, searchTracks } from './src/api/client';
import { MetronomeModal } from './src/components/MetronomeModal';
import { SearchPanel } from './src/components/SearchPanel';
import { TrackCard } from './src/components/TrackCard';
import { themes, type ThemeName } from './src/theme';
import type { SearchCriteria, Track } from './src/types';

const INITIAL_CRITERIA: SearchCriteria = { query: '', bpm: 120, margin: 0 };

export default function App() {
  const systemTheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>(systemTheme === 'dark' ? 'dark' : 'light');
  const [criteria, setCriteria] = useState<SearchCriteria>(INITIAL_CRITERIA);
  const [submittedCriteria, setSubmittedCriteria] = useState<SearchCriteria | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(30);
  const [nextIndex, setNextIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const [metronomeVisible, setMetronomeVisible] = useState(false);

  const theme = themes[themeName];
  const styles = useMemo(() => createStyles(theme), [theme]);

  const runSearch = useCallback(async () => {
    const snapshot = { ...criteria, query: criteria.query.trim() };
    setLoading(true);
    setError(null);
    setSubmittedCriteria(snapshot);
    setTracks([]);
    setTotal(null);

    try {
      const result = await searchTracks(snapshot, 0, pageSize);
      setTracks(result.tracks);
      setTotal(result.total);
      setPageSize(result.limit);
      setNextIndex(result.limit);
      setHasMore(result.hasMore);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Une erreur inattendue est survenue.');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [criteria, pageSize]);

  const loadMore = useCallback(async () => {
    if (!submittedCriteria || !hasMore || loading || loadingMore) return;
    setLoadingMore(true);

    try {
      const result = await searchTracks(submittedCriteria, nextIndex, pageSize);
      setTracks((currentTracks) => {
        const knownIds = new Set(currentTracks.map((track) => track.id));
        return [...currentTracks, ...result.tracks.filter((track) => !knownIds.has(track.id))];
      });
      setTotal(result.total);
      setNextIndex((index) => index + result.limit);
      setHasMore(result.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la suite.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, nextIndex, pageSize, submittedCriteria]);

  const openYoutube = useCallback(async (track: Track) => {
    setResolvingTrackId(track.id);
    setError(null);

    try {
      const match = await resolveYoutubeTrack(track.name, track.artists);
      await Linking.openURL(`https://www.youtube.com/watch?v=${match.youtubeId}`);
    } catch (youtubeError) {
      Alert.alert(
        'Lecture indisponible',
        youtubeError instanceof Error ? youtubeError.message : 'Impossible d’ouvrir YouTube.'
      );
    } finally {
      setResolvingTrackId(null);
    }
  }, []);

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.navigation}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <View style={[styles.logoBar, styles.logoBarSmall]} />
            <View style={[styles.logoBar, styles.logoBarLarge]} />
            <View style={[styles.logoBar, styles.logoBarMedium]} />
          </View>
          <View>
            <Text style={styles.brand}>BeatFinder</Text>
            <Text style={styles.apiLabel}>API · {API_URL.replace(/^https?:\/\//, '')}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <HeaderButton
            label={themeName === 'dark' ? '☀' : '◐'}
            accessibilityLabel={themeName === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
            theme={theme}
            onPress={() => setThemeName((current) => current === 'dark' ? 'light' : 'dark')}
          />
          <HeaderButton
            label="♩"
            accessibilityLabel="Ouvrir le métronome"
            active={metronomeVisible}
            theme={theme}
            onPress={() => setMetronomeVisible(true)}
          />
        </View>
      </View>

      <SearchPanel
        criteria={criteria}
        loading={loading}
        theme={theme}
        onChange={setCriteria}
        onSubmit={runSearch}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Sur un téléphone physique, configure EXPO_PUBLIC_API_URL avec l’adresse IP locale du backend.
          </Text>
        </View>
      ) : null}

      {submittedCriteria && !loading ? (
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>Résultats</Text>
            <Text style={styles.resultsSubtitle}>
              {tracks.length}{total !== null ? ` sur ${total}` : ''} morceau{total === 1 ? '' : 'x'}
            </Text>
          </View>
          <View style={styles.tempoPill}>
            <Text style={styles.tempoPillText}>
              {submittedCriteria.query
                ? 'Recherche texte'
                : `${submittedCriteria.bpm}–${submittedCriteria.bpm + submittedCriteria.margin} BPM`}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      <FlatList
        data={tracks}
        keyExtractor={(track) => track.id}
        renderItem={({ item }) => (
          <TrackCard
            track={item}
            resolvingYoutube={resolvingTrackId === item.id}
            theme={theme}
            onOpenYoutube={openYoutube}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={theme.accent} size="large" />
              <Text style={styles.emptyText}>Recherche en cours…</Text>
            </View>
          ) : submittedCriteria ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>♫</Text>
              <Text style={styles.emptyTitle}>Aucun morceau trouvé</Text>
              <Text style={styles.emptyText}>Essaie un autre tempo ou une marge plus large.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={theme.accent} style={styles.footerLoader} /> : <View style={styles.footerSpace} />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
      />

      <MetronomeModal
        visible={metronomeVisible}
        bpm={criteria.bpm}
        theme={theme}
        onChangeBpm={(bpm) => setCriteria((current) => ({ ...current, bpm }))}
        onClose={() => setMetronomeVisible(false)}
      />
    </SafeAreaView>
  );
}

interface HeaderButtonProps {
  label: string;
  accessibilityLabel: string;
  active?: boolean;
  theme: typeof themes.light;
  onPress: () => void;
}

function HeaderButton({ label, accessibilityLabel, active, theme, onPress }: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        stylesShared.headerButton,
        { backgroundColor: active ? theme.accent : pressed ? theme.controlPressed : theme.control }
      ]}
    >
      <Text style={[stylesShared.headerButtonText, { color: active ? theme.white : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const stylesShared = StyleSheet.create({
  headerButton: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  headerButtonText: { fontSize: 20, fontWeight: '700' }
});

const createStyles = (theme: typeof themes.light) => StyleSheet.create({
  safeArea: { backgroundColor: theme.background, flex: 1 },
  listContent: { paddingBottom: 36, paddingHorizontal: 16 },
  headerContent: { gap: 20, paddingBottom: 18, paddingTop: 10 },
  navigation: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  logo: { alignItems: 'flex-end', flexDirection: 'row', gap: 3, height: 30 },
  logoBar: { backgroundColor: theme.accent, borderRadius: 2, width: 5 },
  logoBarSmall: { height: 12 },
  logoBarLarge: { height: 28 },
  logoBarMedium: { height: 20 },
  brand: { color: theme.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  apiLabel: { color: theme.textTertiary, fontSize: 9, marginTop: 1, maxWidth: 155 },
  headerActions: { flexDirection: 'row', gap: 8 },
  errorBox: { backgroundColor: theme.accentSoft, borderRadius: 14, gap: 5, padding: 14 },
  errorText: { color: theme.accent, fontSize: 14, fontWeight: '700' },
  errorHint: { color: theme.textSecondary, fontSize: 12, lineHeight: 17 },
  resultsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resultsTitle: { color: theme.text, fontSize: 22, fontWeight: '800' },
  resultsSubtitle: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },
  tempoPill: { backgroundColor: theme.accentSoft, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 7 },
  tempoPillText: { color: theme.accent, fontSize: 13, fontWeight: '800' },
  separator: { height: 12 },
  emptyState: { alignItems: 'center', gap: 9, paddingHorizontal: 30, paddingVertical: 60 },
  emptyIcon: { color: theme.textTertiary, fontSize: 44 },
  emptyTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: theme.textSecondary, fontSize: 14, textAlign: 'center' },
  footerLoader: { paddingVertical: 24 },
  footerSpace: { height: 24 }
});
