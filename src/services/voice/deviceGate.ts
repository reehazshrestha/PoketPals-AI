import type {Tier} from '../deviceRules/types';

/**
 * Whether a device can run voice mode. High and flagship tiers anywhere;
 * mid-tier too: an iPhone 13 Pro (A15, 6 GB) classes as mid and answered in
 * 2.8–5.6 s, and an 8 GB Snapdragon 6 Gen 4 (Oppo K13) that also classes as
 * mid keeps up with whisper-base. Only low stays out.
 *
 * Upstream kept Android mid out because a OnePlus 6 (SD845) took 4–8 s in
 * Whisper alone; this fork trades that wait for hands-free voice on mid phones.
 */
export const voiceModeDeviceSupported = (
  tier: Tier | null,
  _os: string,
): boolean => tier === 'mid' || tier === 'high' || tier === 'flagship';
