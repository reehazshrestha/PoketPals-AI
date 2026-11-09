import * as Keychain from 'react-native-keychain';
import {makePersistable} from 'mobx-persist-store';

import {SearchProviderStore, SEARCH_PROVIDERS} from '../SearchProviderStore';
import * as budget from '../../services/search/searchBudget';

// `mobx-persist-store` is globally mocked (jest.config.js moduleNameMapper →
// __mocks__/external/mobx-persist-store.js); `makePersistable` is a jest.fn.
const persistMock = makePersistable as jest.Mock;

const setMock = Keychain.setGenericPassword as jest.Mock;
const getMock = Keychain.getGenericPassword as jest.Mock;
const resetMock = Keychain.resetGenericPassword as jest.Mock;

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('SearchProviderStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMock.mockResolvedValue(false);
  });

  const newStore = async () => {
    const store = new SearchProviderStore();
    await flush();
    return store;
  };

  describe('initial state', () => {
    it('defaults to the keyless You.com provider, result count 5, search on', async () => {
      const store = await newStore();
      expect(store.activeProviderId).toBe('you');
      expect(store.resultCount).toBe(5);
      // Free web search works on a fresh install; the Settings switch revokes.
      expect(store.hasConsentedToSearch).toBe(true);
    });

    it('lists Parallel as gated (not selectable)', () => {
      const parallel = SEARCH_PROVIDERS.find(p => p.id === 'parallel');
      expect(parallel?.selectable).toBe(false);
    });

    it('reads each provider key under its own keychain service on load', async () => {
      await newStore();
      for (const {id} of SEARCH_PROVIDERS) {
        expect(getMock).toHaveBeenCalledWith({
          service: `search_provider_service_${id}`,
        });
      }
    });
  });

  describe('secure-store boundary (keys never in plain storage)', () => {
    it('persists only non-secret prefs via AsyncStorage, never a key field', async () => {
      await newStore();
      const config = persistMock.mock.calls[0][1];
      expect(config.properties).toEqual([
        'activeProviderId',
        'resultCount',
        'hasConsentedToSearch',
      ]);
      expect(config.properties).not.toContain('keys');
      expect(JSON.stringify(config.properties)).not.toMatch(/key/i);
    });

    it('writes BYOK keys only through Keychain, not via the persisted store', async () => {
      const store = await newStore();
      persistMock.mockClear();
      await store.setKey('tavily', 'tav-secret');
      expect(setMock).toHaveBeenCalledWith('tavily', 'tav-secret', {
        service: 'search_provider_service_tavily',
      });
      const persistedKeys = persistMock.mock.calls.flatMap(
        c => c[1]?.properties ?? [],
      );
      expect(persistedKeys).not.toContain('keys');
    });
  });

  describe('per-provider key isolation', () => {
    it('writes a key under the provider-specific service', async () => {
      const store = await newStore();
      await store.setKey('tavily', 'tav-key');

      expect(setMock).toHaveBeenCalledWith('tavily', 'tav-key', {
        service: 'search_provider_service_tavily',
      });
      expect(store.hasKey('tavily')).toBe(true);
      expect(store.hasKey('brave')).toBe(false);
      expect(store.getKey('brave')).toBe('');
    });

    it('clears a key under the provider-specific service', async () => {
      const store = await newStore();
      await store.setKey('exa', 'exa-key');
      expect(store.hasKey('exa')).toBe(true);

      await store.clearKey('exa');
      expect(resetMock).toHaveBeenCalledWith({
        service: 'search_provider_service_exa',
      });
      expect(store.hasKey('exa')).toBe(false);
    });

    it('loads a stored key only for the provider that has one', async () => {
      getMock.mockImplementation((opts: {service: string}) =>
        opts.service === 'search_provider_service_tavily'
          ? Promise.resolve({password: 'stored-tav', username: 'tavily'})
          : Promise.resolve(false),
      );
      const store = await newStore();
      expect(store.getKey('tavily')).toBe('stored-tav');
      expect(store.hasKey('brave')).toBe(false);
    });
  });

  describe('preferences', () => {
    it('sets the active provider only for selectable providers', async () => {
      const store = await newStore();
      // Switch away from the default so the write is observable.
      store.setActiveProvider('tavily');
      expect(store.activeProviderId).toBe('tavily');

      store.setActiveProvider('parallel');
      expect(store.activeProviderId).toBe('tavily');
    });

    it('clamps result count into range', async () => {
      const store = await newStore();
      store.setResultCount(0);
      expect(store.resultCount).toBe(1);
      store.setResultCount(99);
      expect(store.resultCount).toBe(8);
      store.setResultCount(4);
      expect(store.resultCount).toBe(4);
    });

    it('records consent', async () => {
      const store = await newStore();
      store.setConsent(true);
      expect(store.hasConsentedToSearch).toBe(true);
    });
  });

  describe('post-hydration normalization (persisted prefs bypass setters)', () => {
    it('resets a persisted gated/unknown provider to the default', async () => {
      const store = await newStore();
      store.activeProviderId = 'parallel'; // gated; only reachable via stale storage
      store.normalizeHydratedPrefs();
      expect(store.activeProviderId).toBe('you');
    });

    it('clamps a persisted out-of-range result count', async () => {
      const store = await newStore();
      store.resultCount = 99;
      store.normalizeHydratedPrefs();
      expect(store.resultCount).toBe(8);

      store.resultCount = 0;
      store.normalizeHydratedPrefs();
      expect(store.resultCount).toBe(1);
    });

    it('leaves valid persisted prefs unchanged', async () => {
      const store = await newStore();
      store.activeProviderId = 'tavily';
      store.resultCount = 4;
      store.hasConsentedToSearch = true;
      store.normalizeHydratedPrefs();
      expect(store.activeProviderId).toBe('tavily');
      expect(store.resultCount).toBe(4);
      expect(store.hasConsentedToSearch).toBe(true);
    });

    it('treats a non-boolean persisted consent as no consent', async () => {
      const store = await newStore();
      (store as any).hasConsentedToSearch = 'false'; // truthy string from tampered storage
      store.normalizeHydratedPrefs();
      expect(store.hasConsentedToSearch).toBe(false);
      expect(store.canSearch).toBe(false);
    });

    it('restores the default on a non-numeric or non-finite persisted count', async () => {
      const store = await newStore();
      for (const bad of ['bad', NaN, null, {}, Infinity]) {
        (store as any).resultCount = bad;
        store.normalizeHydratedPrefs();
        expect(store.resultCount).toBe(5);
      }
    });
  });

  describe('isProviderConfigured', () => {
    it('is false with no key and true once the active provider has a key', async () => {
      const store = await newStore();
      store.setActiveProvider('brave'); // default is keyless, so pick a keyed one
      expect(store.isProviderConfigured).toBe(false);
      await store.setKey('brave', 'k'); // the active provider
      expect(store.isProviderConfigured).toBe(true);
    });

    it.each(['you', 'duckduckgo'] as const)(
      'counts the keyless provider %s as configured without a key',
      async id => {
        const store = await newStore();
        store.setActiveProvider(id);
        expect(store.hasKey(id)).toBe(false);
        expect(store.isKeyOptional(id)).toBe(true);
        expect(store.isProviderConfigured).toBe(true);
      },
    );

    it('keeps keyed providers requiring a key', () => {
      const keyless = new Set(['you', 'duckduckgo']);
      for (const {id, requiresKey} of SEARCH_PROVIDERS) {
        if (!keyless.has(id)) {
          expect(requiresKey).not.toBe(false);
        }
      }
    });
  });

  describe('canSearch (consent + configured provider, load-bearing at execution)', () => {
    it('requires both consent and a key', async () => {
      const store = await newStore();
      store.setActiveProvider('brave'); // keyed
      expect(store.canSearch).toBe(false);

      // A key alone is not enough: revoking consent still closes search.
      await store.setKey('brave', 'k'); // the active provider
      expect(store.canSearch).toBe(true);

      store.setConsent(false);
      expect(store.canSearch).toBe(false);

      store.setConsent(true);
      expect(store.canSearch).toBe(true);
    });

    it('lets the consent switch close a keyless provider', async () => {
      const store = await newStore();
      store.setActiveProvider('you');
      expect(store.canSearch).toBe(true);
      store.setConsent(false);
      expect(store.canSearch).toBe(false);
    });
  });

  describe('cache invalidation on auth-boundary changes', () => {
    it('resets the search cache on key/consent/provider changes', async () => {
      const reset = jest.spyOn(budget, 'resetSearchCache');
      const store = await newStore();
      reset.mockClear();

      await store.setKey('tavily', 'k');
      await store.clearKey('tavily');
      store.setConsent(true);
      store.setActiveProvider('brave');

      // setKey + clearKey + setConsent + setActiveProvider each invalidate.
      expect(reset.mock.calls.length).toBeGreaterThanOrEqual(4);
      reset.mockRestore();
    });
  });
});
