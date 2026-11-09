import type {ExecutionProvider} from '@pocketpalai/react-native-speech';

export type ExecutionProviderPref = 'cpu' | 'xnnpack' | 'nnapi';

/**
 * Engine-side copy of `ttsStore.ttsExecutionProviders`.
 *
 * `engineRegistry` is imported by the store, so an engine that imported the
 * store back would close a cycle and leave the engine classes undefined at
 * registry construction. The store mirrors its (persisted) choice here in a
 * reaction instead, and engines read it from this module.
 *
 * The default is the CPU chain the engines shipped with before the preference
 * existed, so an unset preference behaves exactly as before.
 */
let current: ExecutionProviderPref[] = ['cpu'];

export function setExecutionProviderPreference(
  pref: ExecutionProviderPref[] | null,
): void {
  current = pref == null || pref.length === 0 ? ['cpu'] : pref;
}

/**
 * Map the preference onto the library's `ExecutionProvider` list.
 * `undefined` means "engine default".
 */
export function executionProvidersFromPreference(
  pref: ExecutionProviderPref[] | null | undefined = current,
): ExecutionProvider[] | undefined {
  if (!pref || pref.length === 0) {
    return undefined;
  }
  const out: ExecutionProvider[] = [];
  for (const p of pref) {
    if (p === 'cpu') {
      out.push('cpu');
    } else if (p === 'xnnpack' || p === 'nnapi') {
      // NNAPI is best-effort: the shipped ORT RN bundle does not expose it,
      // so request the closest accelerated backend instead of failing init.
      out.push('xnnpack');
    }
  }
  return out.length > 0 ? out : undefined;
}
