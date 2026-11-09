/**
 * Personal profile configuration.
 *
 * Every external / social link surfaced in the UI resolves through this
 * object, so re-pointing the app at a personal profile is a data change,
 * not a component change. Empty strings are treated as "not configured":
 * the About screen hides a link rather than opening a dead URL.
 */
import {REPO_URL} from './urls';

export type ProfileConfig = {
  /** Name shown in About / drawer credits when set. */
  displayName: string;
  /** Social handle, e.g. `@you` (without the platform prefix). */
  handle: string;
  /** Personal site or portfolio. */
  website: string;
  github: string;
  x: string;
  /** Contact address used by the support / feedback surfaces. */
  email: string;
  privacyPolicy: string;
  terms: string;
};

export const PROFILE: ProfileConfig = {
  displayName: 'PoketPals AI',
  handle: '',
  website: '',
  github: REPO_URL,
  x: '',
  email: '',
  privacyPolicy: `${REPO_URL}/blob/main/docs/legal/privacy-policy.md`,
  terms: `${REPO_URL}/blob/main/docs/legal/terms-of-service.md`,
};

/** True when `url` is a configured, openable link. */
export const hasLink = (url: string): boolean => url.trim().length > 0;
