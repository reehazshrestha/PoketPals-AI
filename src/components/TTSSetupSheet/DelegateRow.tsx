import React, {useContext, useMemo} from 'react';
import {Platform, View} from 'react-native';
import {Text} from 'react-native-paper';
import {observer} from 'mobx-react';

import {CheckMdIcon} from '../../assets/icons';
import {Pressable} from '../ui/primitives/Pressable';
import {useTheme} from '../../hooks';
import {ttsStore} from '../../store';
import {L10nContext} from '../../utils';

import {createStyles} from './styles';

/**
 * TTS execution-provider (delegate) preference.
 *
 * Rendered below the engine list in the Voices sheet: the engine picker
 * chooses *which* local model speaks, this row chooses *what it runs on*.
 * ONNX Runtime only exposes CPU and XNNPACK here — NNAPI is offered but
 * labelled unavailable on Android 15+ where the platform deprecated it,
 * because the bundled ORT build maps it onto XNNPACK at init time.
 */
type DelegateOption = {
  id: 'cpu' | 'xnnpack' | 'nnapi';
  label: string;
  description: string;
  disabled: boolean;
};

export const DelegateRow: React.FC = observer(() => {
  const theme = useTheme();
  const l10n = useContext(L10nContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const selected = ttsStore.ttsExecutionProviders?.[0] ?? null;

  // NNAPI was deprecated in Android 15 and the ORT RN bundle shipped with
  // the app never exposes it; on iOS the whole concept is irrelevant
  // (CoreML is the accelerator and isn't selectable here). The row still
  // lists it so the preference is discoverable, but it is inert.
  const nnapiDisabled = Platform.OS !== 'android';

  const options: DelegateOption[] = [
    {
      id: 'cpu',
      label: l10n.settings.ttsExecutionProviderCpu,
      description: l10n.settings.ttsExecutionProviderCpuDescription,
      disabled: false,
    },
    {
      id: 'xnnpack',
      label: l10n.settings.ttsExecutionProviderXnnpack,
      description: l10n.settings.ttsExecutionProviderXnnpackDescription,
      disabled: false,
    },
    {
      id: 'nnapi',
      label: l10n.settings.ttsExecutionProviderNnapi,
      description: l10n.settings.ttsExecutionProviderNnapiDescription,
      disabled: nnapiDisabled,
    },
  ];

  const select = (id: DelegateOption['id'] | null) => {
    ttsStore.setTtsExecutionProvider(id);
  };

  return (
    <View style={styles.delegateCard} testID="tts-delegate-row">
      <Text style={styles.delegateTitle}>
        {l10n.settings.ttsExecutionProviderLabel}
      </Text>
      <Text style={styles.delegateDescription}>
        {l10n.settings.ttsExecutionProviderDescription}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: selected === null}}
        accessibilityLabel={l10n.settings.ttsExecutionProviderNone}
        testID="tts-delegate-option-auto"
        onPress={() => select(null)}
        style={[
          styles.delegateOption,
          selected === null && styles.delegateOptionSelected,
        ]}>
        <View style={styles.delegateOptionText}>
          <Text style={styles.delegateOptionLabel}>
            {l10n.settings.ttsExecutionProviderNone}
          </Text>
          <Text style={styles.delegateOptionDescription}>
            {l10n.settings.ttsExecutionProviderNoneDescription}
          </Text>
        </View>
        {selected === null ? (
          <CheckMdIcon width={18} height={18} stroke={theme.colors.primary} />
        ) : null}
      </Pressable>

      {options.map(option => {
        const isSelected = selected === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{
              selected: isSelected,
              disabled: option.disabled,
            }}
            accessibilityLabel={option.label}
            disabled={option.disabled}
            testID={`tts-delegate-option-${option.id}`}
            onPress={() => select(option.id)}
            style={[
              styles.delegateOption,
              isSelected && styles.delegateOptionSelected,
              option.disabled && styles.delegateOptionDisabled,
            ]}>
            <View style={styles.delegateOptionText}>
              <Text style={styles.delegateOptionLabel}>{option.label}</Text>
              <Text style={styles.delegateOptionDescription}>
                {option.description}
              </Text>
              {option.disabled ? (
                <Text style={styles.delegateDisabledNote}>
                  {l10n.settings.ttsExecutionProviderDisabledNote}
                </Text>
              ) : null}
            </View>
            {isSelected ? (
              <CheckMdIcon
                width={18}
                height={18}
                stroke={theme.colors.primary}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
});
