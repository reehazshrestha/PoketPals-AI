/**
 * Structured follow-up suggestions in assistant replies.
 *
 * Models are asked (via pal system prompts) to finish a reply with a fenced
 * block listing tappable follow-ups. Two shapes are accepted so a model that
 * was told either protocol still works:
 *
 *   ```suggestions
 *   ["Tell me more", "Compare with X"]
 *   ```
 *
 *   ```json
 *   {"suggestions": ["Tell me more", "Compare with X"]}
 *   ```
 *
 * A trailing bare `{"suggestions": [...]}` (no fence) is also recognised,
 * because small quantized models frequently drop the fence.
 *
 * The block is removed from the text that gets rendered, so the user never
 * sees raw JSON in the bubble.
 */

export type ParsedAssistantContent = {
  /** Reply text with any suggestion block stripped. */
  text: string;
  /** At most `MAX_SUGGESTIONS` non-empty, trimmed suggestion strings. */
  suggestions: string[];
};

export const MAX_SUGGESTIONS = 4;
const MAX_SUGGESTION_LENGTH = 120;

const FENCE_RE = /```([A-Za-z_-]*)[ \t]*\r?\n([\s\S]*?)```/g;

/** Fence info strings that may carry a suggestion payload. */
const SUGGESTION_FENCE_LANGS = new Set([
  '',
  'json',
  'suggestions',
  'suggestion',
  'followups',
  'follow_ups',
]);

/** Keys a suggestion payload may use for its list. */
const SUGGESTION_KEYS = [
  'suggestions',
  'followups',
  'follow_ups',
  'followUpPrompts',
  'prompts',
] as const;

const normalizeList = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > MAX_SUGGESTION_LENGTH) {
      continue;
    }
    if (!out.includes(trimmed)) {
      out.push(trimmed);
    }
    if (out.length >= MAX_SUGGESTIONS) {
      break;
    }
  }
  return out.length > 0 ? out : null;
};

const parsePayload = (raw: string): string[] | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return null;
  }
  const direct = normalizeList(parsed);
  if (direct) {
    return direct;
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;
    for (const key of SUGGESTION_KEYS) {
      const list = normalizeList(record[key]);
      if (list) {
        return list;
      }
    }
  }
  return null;
};

/**
 * Split an assistant reply into renderable text and its follow-up prompts.
 * Pure and total: returns the input unchanged when nothing parseable exists.
 */
export function parseAssistantSuggestions(
  input: string | null | undefined,
): ParsedAssistantContent {
  const text = input ?? '';
  if (text.length === 0) {
    return {text, suggestions: []};
  }

  const suggestions: string[] = [];
  // Track stripped ranges so later replacements don't shift earlier offsets.
  const stripped: Array<[number, number]> = [];

  FENCE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FENCE_RE.exec(text)) !== null) {
    const lang = (match[1] ?? '').toLowerCase();
    if (!SUGGESTION_FENCE_LANGS.has(lang)) {
      continue;
    }
    const list = parsePayload(match[2] ?? '');
    if (!list) {
      continue;
    }
    for (const suggestion of list) {
      if (!suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }
    stripped.push([match.index, match.index + match[0].length]);
  }

  // Fallback: an unfenced trailing `{ "suggestions": [...] }`.
  if (suggestions.length === 0) {
    const trailing = /(\{[\s\S]*"suggestions"[\s\S]*\})\s*$/.exec(text);
    if (trailing && trailing.index > 0) {
      const list = parsePayload(trailing[1]);
      if (list) {
        suggestions.push(...list);
        stripped.push([trailing.index, text.length]);
      }
    }
  }

  let cleaned = text;
  for (let i = stripped.length - 1; i >= 0; i--) {
    const [start, end] = stripped[i]!;
    cleaned = cleaned.slice(0, start) + cleaned.slice(end);
  }

  return {
    text: cleaned.replace(/\s+$/, ''),
    suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
  };
}
