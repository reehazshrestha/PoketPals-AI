import React, {useContext} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {observer} from 'mobx-react';

import {useTheme} from '../../hooks';
import {uiStore} from '../../store';
import {L10nContext} from '../../utils';
import {
  ACCENT_PALETTE_IDS,
  ACCENT_PALETTES,
  type AccentPaletteId,
} from '../../theme';

const paletteLabelKey = {
  graphite: 'accentGraphite',
  lavender: 'accentLavender',
  emerald: 'accentEmerald',
  ocean: 'accentOcean',
} as const satisfies Record<AccentPaletteId, string>;

/**
 * Accent palette picker. Swatches preview the palette's primary + container
 * in the active mode, so the choice is visible before it is committed.
 */
export const AccentPaletteRow: React.FC = observer(() => {
  const theme = useTheme();
  const l10n = useContext(L10nContext);

  return (
    <View style={styles.container} testID="accent-palette-row">
      <Text style={styles.title}>{l10n.settings.accentColor}</Text>
      <Text style={styles.description}>
        {l10n.settings.accentColorDescription}
      </Text>
      <View style={styles.swatchRow}>
        {ACCENT_PALETTE_IDS.map(palette => {
          const selected = uiStore.accentPalette === palette;
          const binding = ACCENT_PALETTES[palette][uiStore.colorScheme];
          const swatchColor = binding.primary ?? theme.colors.primary;
          const containerColor =
            binding.primaryContainer ?? theme.colors.primaryContainer;
          return (
            <Pressable
              key={palette}
              accessibilityRole="button"
              accessibilityState={{selected}}
              accessibilityLabel={l10n.settings[paletteLabelKey[palette]]}
              testID={`accent-palette-${palette}`}
              onPress={() => uiStore.setAccentPalette(palette)}
              style={[
                styles.swatch,
                {
                  backgroundColor: containerColor,
                  borderColor: selected ? swatchColor : theme.colors.outline,
                },
                selected && styles.swatchSelected,
              ]}>
              <View
                style={[styles.swatchDot, {backgroundColor: swatchColor}]}
              />
              <Text
                style={[
                  styles.swatchLabel,
                  {color: selected ? swatchColor : theme.colors.onSurface},
                ]}
                numberOfLines={1}>
                {l10n.settings[paletteLabelKey[palette]]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    marginBottom: 10,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  swatchSelected: {
    borderWidth: 2,
  },
  swatchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  swatchLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
