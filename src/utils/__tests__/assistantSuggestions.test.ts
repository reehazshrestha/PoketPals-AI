import {
  MAX_SUGGESTIONS,
  parseAssistantSuggestions,
} from '../assistantSuggestions';

describe('parseAssistantSuggestions', () => {
  it('returns the input untouched when there is no suggestion block', () => {
    const input = 'Plain answer with a ```js\nconsole.log(1)\n``` block.';
    expect(parseAssistantSuggestions(input)).toEqual({
      text: input,
      suggestions: [],
    });
  });

  it('extracts a fenced suggestions array and strips the fence', () => {
    const input =
      'Here is the answer.\n\n```suggestions\n["Tell me more", "Compare with X"]\n```';
    expect(parseAssistantSuggestions(input)).toEqual({
      text: 'Here is the answer.',
      suggestions: ['Tell me more', 'Compare with X'],
    });
  });

  it('accepts the {"suggestions": [...]} JSON shape', () => {
    const input = 'Done.\n```json\n{"suggestions": ["One", "Two"]}\n```';
    const parsed = parseAssistantSuggestions(input);
    expect(parsed.text).toBe('Done.');
    expect(parsed.suggestions).toEqual(['One', 'Two']);
  });

  it('accepts a trailing unfenced JSON object', () => {
    const input = 'Answer text.\n{"suggestions": ["Next step"]}';
    expect(parseAssistantSuggestions(input)).toEqual({
      text: 'Answer text.',
      suggestions: ['Next step'],
    });
  });

  it('ignores non-suggestion code fences', () => {
    const input = '```python\nprint("hi")\n```';
    expect(parseAssistantSuggestions(input)).toEqual({
      text: input,
      suggestions: [],
    });
  });

  it('de-duplicates, trims, drops non-strings and caps the list', () => {
    const input = `\`\`\`suggestions\n${JSON.stringify([
      '  A  ',
      'A',
      42,
      '',
      'B',
      'C',
      'D',
      'E',
    ])}\n\`\`\``;
    const parsed = parseAssistantSuggestions(input);
    expect(parsed.suggestions).toEqual(['A', 'B', 'C', 'D']);
    expect(parsed.suggestions).toHaveLength(MAX_SUGGESTIONS);
  });

  it('handles empty and null input', () => {
    expect(parseAssistantSuggestions('')).toEqual({text: '', suggestions: []});
    expect(parseAssistantSuggestions(null)).toEqual({
      text: '',
      suggestions: [],
    });
    expect(parseAssistantSuggestions(undefined)).toEqual({
      text: '',
      suggestions: [],
    });
  });
});
