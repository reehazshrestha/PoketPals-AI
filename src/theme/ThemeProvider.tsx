import React from 'react';
import {observer} from 'mobx-react';
import {Provider as PaperProvider} from 'react-native-paper';

import {useTheme} from '../hooks';

/**
 * Single owner of the app's theme.
 *
 * Everything below this provider reads the same `Theme`: MD3 colors driven
 * by the token module (light/dark + accent palette), locale-aware
 * typography, radius/stroke scales, and the legacy Paper `fonts` surface.
 *
 * It exists so adding a theme input (a new palette, a contrast mode) is a
 * one-file change: the input goes into `uiStore` + `useTheme`, and every
 * consumer updates through Paper's context. `App` no longer has to thread a
 * theme object into `PaperProvider` itself.
 */
export const ThemeProvider: React.FC<{children: React.ReactNode}> = observer(
  ({children}) => {
    const theme = useTheme();
    return <PaperProvider theme={theme}>{children}</PaperProvider>;
  },
);
