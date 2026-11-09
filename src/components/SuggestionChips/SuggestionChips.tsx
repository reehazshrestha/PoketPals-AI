import React, {useMemo} from 'react';
import {Pressable, Text, View} from 'react-native';

import {useTheme} from '../../hooks';

import {createStyles} from './styles';

interface SuggestionChipsProps {
  /** Follow-up prompts parsed out of the assistant reply. */
  suggestions: string[];
  /** Sends the tapped prompt as the next user message. */
  onSelect: (prompt: string) => void;
  /** Dims and ignores taps while no model is loaded. */
  disabled?: boolean;
}

/**
 * Tappable follow-up chips rendered directly below an assistant bubble.
 *
 * Chips wrap (unlike the horizontally scrolling empty-state prompts row)
 * because they belong to one message and should stay visually attached to
 * it, not to the composer.
 */
export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSelect,
  disabled = false,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID="suggestion-chips">
      {suggestions.map((suggestion, index) => (
        <Pressable
          key={`${index}-${suggestion.slice(0, 16)}`}
          onPress={() => onSelect(suggestion)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{disabled}}
          accessibilityLabel={suggestion}
          testID={`suggestion-chip-${index}`}
          style={({pressed}) => [
            styles.chip,
            pressed && !disabled ? styles.chipPressed : null,
            disabled ? styles.chipDisabled : null,
          ]}>
          <Text style={styles.chipText} numberOfLines={2}>
            {suggestion}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
