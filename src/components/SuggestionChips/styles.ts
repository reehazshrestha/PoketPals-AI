import {StyleSheet} from 'react-native';

import {useTheme} from '../../hooks';

export const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
      paddingRight: 4,
    },
    chip: {
      maxWidth: '100%',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    chipPressed: {
      opacity: 0.6,
    },
    chipDisabled: {
      opacity: 0.4,
    },
    chipText: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.primary,
    },
  });
