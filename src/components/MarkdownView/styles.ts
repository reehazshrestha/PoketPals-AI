import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

// Plain object (not via StyleSheet.create) because react-syntax-highlighter's
// customStyle is merged with Object.assign — a numeric StyleSheet id won't
// flatten the upstream white PreTag fallback. See MarkdownView for the why.
export const codeHighlighterPreOverride = {
  backgroundColor: 'transparent',
} as const;

export const createTagsStyles = (theme: Theme) => ({
  body: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0.4,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: 0,
    paddingTop: 0,
    margin: 0,
    backgroundColor: 'transparent',
    // display: 'inline-block',
  },
  // Headings keep a wider track than body copy so they read as structure
  // rather than louder body text. Sizes step down cleanly from h1 to h4;
  // h5/h6 match body size and rely on weight for hierarchy.
  h1: {
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 1.0,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: 0.9,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  h3: {
    fontSize: 19,
    lineHeight: 27,
    letterSpacing: 0.8,
    fontWeight: '600' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  h4: {
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: 0.8,
    fontWeight: '600' as const,
    marginTop: 12,
    marginBottom: 4,
  },
  h5: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.8,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 4,
  },
  h6: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.8,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 4,
  },
  a: {
    color: theme.colors.secondary,
    textDecorationLine: 'underline' as const,
  },
  code: {
    fontFamily: 'Courier', // Change the font for code snippets
    backgroundColor: theme.colors.surface, // Custom background for code blocks
    padding: 4,
    borderRadius: 4,
    color: theme.colors.onSurface, // Color for code text
    fontSize: 12,
    whiteSpace: 'pre' as const,
  },
  pre: {
    backgroundColor: theme.colors.surface, // Background for pre blocks
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
    color: theme.colors.onPrimaryContainer,
    fontFamily: 'Courier',
    fontSize: 14,
    whiteSpace: 'pre' as const,
  },
  // Styles for thinking tags
  thinking: {
    color: theme.colors.thinkingBubbleText,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  think: {
    color: theme.colors.thinkingBubbleText,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  thought: {
    color: theme.colors.thinkingBubbleText,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    markdownContainer: {
      // Dynamic maxWidth will be applied via style prop
    },
    codeHighlighterText: {
      fontFamily: 'Courier',
    },
    codeHighlighterScrollContent: {
      backgroundColor: theme.colors.surface,
      padding: 8,
      borderRadius: 6,
      marginTop: 4,
    },
  });
