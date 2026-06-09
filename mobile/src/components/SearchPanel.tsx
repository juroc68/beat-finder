import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SearchCriteria } from '../types';
import type { Theme } from '../theme';

interface SearchPanelProps {
  criteria: SearchCriteria;
  loading: boolean;
  theme: Theme;
  onChange: (criteria: SearchCriteria) => void;
  onSubmit: () => void;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

export function SearchPanel({ criteria, loading, theme, onChange, onSubmit }: SearchPanelProps) {
  const styles = createStyles(theme);

  const adjustBpm = (amount: number) => {
    onChange({ ...criteria, bpm: clamp(criteria.bpm + amount, 40, 220) });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>RECHERCHE MUSICALE</Text>
      <Text style={styles.title}>Trouve ton rythme.</Text>
      <Text style={styles.description}>
        Laisse le champ vide pour une recherche précise par BPM, ou saisis un artiste ou un titre.
      </Text>

      <TextInput
        value={criteria.query}
        onChangeText={(query) => onChange({ ...criteria, query })}
        placeholder="Artiste, chanson ou style"
        placeholderTextColor={theme.textTertiary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        style={styles.input}
      />

      <View style={styles.tempoHeader}>
        <View>
          <Text style={styles.label}>TEMPO CIBLE</Text>
          <Text style={styles.tempoHint}>De 40 à 220 BPM</Text>
        </View>
        <Text style={styles.bpmValue}>{criteria.bpm}</Text>
      </View>

      <View style={styles.stepperRow}>
        {[-5, -1, 1, 5].map((amount) => (
          <Pressable
            key={amount}
            accessibilityRole="button"
            accessibilityLabel={`${amount > 0 ? 'Augmenter' : 'Diminuer'} le tempo de ${Math.abs(amount)}`}
            onPress={() => adjustBpm(amount)}
            style={({ pressed }) => [styles.stepButton, pressed && styles.controlPressed]}
          >
            <Text style={styles.stepButtonText}>{amount > 0 ? `+${amount}` : amount}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.marginSection}>
        <Text style={styles.label}>MARGE SUPÉRIEURE</Text>
        <View style={styles.marginRow}>
          {[0, 1, 2, 3, 4, 5].map((margin) => {
            const selected = criteria.margin === margin;
            return (
              <Pressable
                key={margin}
                onPress={() => onChange({ ...criteria, margin })}
                style={({ pressed }) => [
                  styles.marginButton,
                  selected && styles.marginButtonSelected,
                  pressed && !selected && styles.controlPressed
                ]}
              >
                <Text style={[styles.marginText, selected && styles.marginTextSelected]}>+{margin}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.searchButton,
          pressed && styles.searchButtonPressed,
          loading && styles.searchButtonDisabled
        ]}
      >
        <Text style={styles.searchButtonText}>{loading ? 'Recherche…' : 'Lancer la recherche'}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 14,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3
  },
  eyebrow: { color: theme.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: theme.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  description: { color: theme.textSecondary, fontSize: 14, lineHeight: 20 },
  input: {
    backgroundColor: theme.control,
    borderColor: theme.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    color: theme.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  tempoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  label: { color: theme.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.9 },
  tempoHint: { color: theme.textTertiary, fontSize: 12, marginTop: 3 },
  bpmValue: { color: theme.text, fontSize: 46, fontWeight: '800', letterSpacing: -2 },
  stepperRow: { flexDirection: 'row', gap: 8 },
  stepButton: {
    alignItems: 'center',
    backgroundColor: theme.control,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 11
  },
  controlPressed: { backgroundColor: theme.controlPressed },
  stepButtonText: { color: theme.text, fontSize: 15, fontWeight: '700' },
  marginSection: { gap: 9 },
  marginRow: { flexDirection: 'row', gap: 7 },
  marginButton: {
    alignItems: 'center',
    backgroundColor: theme.control,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 9
  },
  marginButtonSelected: { backgroundColor: theme.text },
  marginText: { color: theme.textSecondary, fontSize: 13, fontWeight: '700' },
  marginTextSelected: { color: theme.background },
  searchButton: {
    alignItems: 'center',
    backgroundColor: theme.accent,
    borderRadius: 14,
    marginTop: 4,
    paddingVertical: 15
  },
  searchButtonPressed: { backgroundColor: theme.accentPressed },
  searchButtonDisabled: { opacity: 0.55 },
  searchButtonText: { color: theme.white, fontSize: 16, fontWeight: '800' }
});
