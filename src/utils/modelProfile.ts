/**
 * 1B-class 4-bit model profile.
 *
 * Small quantized models are the ones that actually run comfortably on
 * budget Android hardware, and they behave differently from 3B+ models:
 * they need far less KV cache, batch sizes above a few hundred buy nothing,
 * and the OpenCL delegate's fixed init cost can dominate first-token
 * latency on mid-tier SoCs. This module turns the model's filename into a
 * profile and derives the load hints (context/batch caps + delegate choice)
 * that `ModelStore` applies before `initLlama`.
 *
 * Pure functions only — no React, Paper, MobX, or native imports, so the
 * rules are unit-testable without a device.
 */

/** GGUF quantization families this layer distinguishes. */
export type QuantizationFamily =
  | 'q4_0'
  | 'q4_k_m'
  | 'q8_0'
  | 'other'
  | 'unknown';

export type ModelProfile = {
  /** Quantization parsed from the filename. */
  quantization: QuantizationFamily;
  /** Parameter count in billions when the filename states one. */
  paramsBillions: number | null;
  /**
   * True for a ≤1.5B model in a 4-bit format — the profile that gets the
   * small-model tuning below.
   */
  isSmall4Bit: boolean;
};

export type DeviceTier = 'low' | 'mid' | 'high' | 'flagship';

type ContextTuning = {
  n_ctx?: number;
  n_batch?: number;
  n_ubatch?: number;
};

export type DelegateHint = {
  /** `llama.rn` device list; `['CPU']` is the CPU delegate. */
  devices: string[];
  n_gpu_layers: number;
  /** Short human-readable reason, logged at init. */
  reason: string;
};

/** Context/batch caps for a 1B-class 4-bit model. */
export const SMALL_MODEL_CONTEXT_CAP = 4096;
export const SMALL_MODEL_BATCH_CAP = 512;
export const SMALL_MODEL_UBATCH_CAP = 128;

const QUANT_PATTERNS: Array<[QuantizationFamily, RegExp]> = [
  ['q4_k_m', /q4[_-]k[_-]m/i],
  ['q4_0', /q4[_-]0/i],
  ['q8_0', /q8[_-]0/i],
];

/** Matches `1B`, `1.2B`, `0.5b`, `350M`, etc. in a filename or name. */
const PARAM_PATTERN = /(?:^|[\s\-_.])(\d+(?:\.\d+)?)\s*([bm])(?=[\s\-_.]|$)/i;

function parseParamsBillions(text: string): number | null {
  const match = PARAM_PATTERN.exec(text);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return match[2]!.toLowerCase() === 'm' ? value / 1000 : value;
}

/**
 * Detect the profile from a model path or display name. Returns
 * `isSmall4Bit: false` for anything that isn't a ≤1.5B 4-bit GGUF, so
 * callers can apply the tuning unconditionally.
 */
export function detectModelProfile({
  filePath,
  modelName,
}: {
  filePath?: string | null;
  modelName?: string | null;
}): ModelProfile {
  // Quantization is a property of the file; the parameter count may only
  // appear in the display name (e.g. "Gemma 3 1B" + "gemma-3-1b-it-Q4_K_M").
  const filename = (filePath ?? '').split(/[\\/]/).pop() ?? modelName ?? '';
  const haystack = `${filename} ${modelName ?? ''}`;

  let quantization: QuantizationFamily = 'unknown';
  for (const [family, pattern] of QUANT_PATTERNS) {
    if (pattern.test(haystack)) {
      quantization = family;
      break;
    }
  }
  if (quantization === 'unknown' && /\.gguf$/i.test(filename)) {
    quantization = 'other';
  }

  const paramsBillions = parseParamsBillions(haystack);

  return {
    quantization,
    paramsBillions,
    isSmall4Bit:
      (quantization === 'q4_0' || quantization === 'q4_k_m') &&
      paramsBillions !== null &&
      paramsBillions <= 1.5,
  };
}

/** Context/batch caps for a small 4-bit model (only ever clamps down). */
export function smallModelContextTuning(params: ContextTuning): ContextTuning {
  return {
    n_ctx:
      params.n_ctx !== undefined
        ? Math.min(params.n_ctx, SMALL_MODEL_CONTEXT_CAP)
        : params.n_ctx,
    n_batch:
      params.n_batch !== undefined
        ? Math.min(params.n_batch, SMALL_MODEL_BATCH_CAP)
        : params.n_batch,
    n_ubatch:
      params.n_ubatch !== undefined
        ? Math.min(params.n_ubatch, SMALL_MODEL_UBATCH_CAP)
        : params.n_ubatch,
  };
}

/**
 * Thread count for a small model.
 *
 * The app defaults to ~80% of all cores (6 on an 8-core phone), which spills
 * work onto the four little cores while the four big cores wait on them: the
 * slowest thread gates every token, so end-to-end decode gets slower. Small
 * models are the case where that shows up worst (the per-token work is small
 * enough that scheduling noise dominates). Cap at the performance-core count
 * for 1B-class models and leave bigger models on the tuned default.
 */
export function smallModelThreadCount({
  currentThreads,
  coreCount,
}: {
  currentThreads: number | undefined;
  coreCount: number | null;
}): number | null {
  if (currentThreads === undefined || coreCount == null || coreCount < 6) {
    return null;
  }
  // 8-core big.LITTLE parts are 4+4 (or 4+4+... on tri-cluster): the big core
  // cluster is half the physical cores and is what actually does the work.
  const performanceCores = Math.max(2, Math.floor(coreCount / 2));
  return currentThreads > performanceCores ? performanceCores : null;
}

/**
 * Delegate choice for a 1B 4-bit model.
 *
 * Returns `null` when the platform default is already the right answer
 * (iOS: Metal auto-selected by llama.cpp; unknown tier: don't second-guess).
 * On Android mid/low tiers the GPU delegate is overridden to CPU: the
 * OpenCL kernel/context setup cost is a large fraction of a 1B model's
 * total work, so CPU wins on first-token latency and avoids a driver
 * failure class on budget Adreno parts.
 */
export function smallModelDelegateHint({
  platform,
  deviceTier,
}: {
  platform: string;
  deviceTier: DeviceTier | null;
}): DelegateHint | null {
  if (platform !== 'android') {
    return null;
  }
  if (deviceTier !== 'low' && deviceTier !== 'mid') {
    return null;
  }
  return {
    devices: ['CPU'],
    n_gpu_layers: 0,
    reason: `1B 4-bit on ${deviceTier}-tier Android: CPU delegate beats GPU offload`,
  };
}
