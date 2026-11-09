import {
  SMALL_MODEL_BATCH_CAP,
  SMALL_MODEL_CONTEXT_CAP,
  SMALL_MODEL_UBATCH_CAP,
  detectModelProfile,
  smallModelContextTuning,
  smallModelDelegateHint,
  smallModelThreadCount,
} from '../modelProfile';

describe('detectModelProfile', () => {
  it('flags a 1B Q4_K_M file as a small 4-bit model', () => {
    const profile = detectModelProfile({
      filePath: '/models/gemma-3-1b-it-Q4_K_M.gguf',
    });
    expect(profile.quantization).toBe('q4_k_m');
    expect(profile.paramsBillions).toBe(1);
    expect(profile.isSmall4Bit).toBe(true);
  });

  it('accepts Q4_0 and sub-1B sizes', () => {
    const profile = detectModelProfile({
      filePath: '/models/Qwen2.5-0.5B-Instruct-Q4_0.gguf',
    });
    expect(profile.quantization).toBe('q4_0');
    expect(profile.paramsBillions).toBe(0.5);
    expect(profile.isSmall4Bit).toBe(true);
  });

  it('reads the parameter count from the display name when the filename omits it', () => {
    const profile = detectModelProfile({
      filePath: '/models/model-q4_k_m.gguf',
      modelName: 'Gemma 3 1B',
    });
    expect(profile.isSmall4Bit).toBe(true);
  });

  it('does not flag larger or non-4-bit models', () => {
    expect(
      detectModelProfile({filePath: '/m/gemma-3-4b-it-Q4_K_M.gguf'})
        .isSmall4Bit,
    ).toBe(false);
    expect(
      detectModelProfile({filePath: '/m/gemma-3-1b-it-Q8_0.gguf'}).isSmall4Bit,
    ).toBe(false);
    expect(detectModelProfile({filePath: '/m/unknown.gguf'})).toMatchObject({
      quantization: 'other',
      isSmall4Bit: false,
    });
  });
});

describe('smallModelContextTuning', () => {
  it('clamps context and batch sizes down to the small-model caps', () => {
    expect(
      smallModelContextTuning({n_ctx: 16384, n_batch: 2048, n_ubatch: 512}),
    ).toEqual({
      n_ctx: SMALL_MODEL_CONTEXT_CAP,
      n_batch: SMALL_MODEL_BATCH_CAP,
      n_ubatch: SMALL_MODEL_UBATCH_CAP,
    });
  });

  it('never raises a smaller user value', () => {
    expect(
      smallModelContextTuning({n_ctx: 2048, n_batch: 128, n_ubatch: 64}),
    ).toEqual({n_ctx: 2048, n_batch: 128, n_ubatch: 64});
  });

  it('leaves missing values missing', () => {
    expect(smallModelContextTuning({})).toEqual({
      n_ctx: undefined,
      n_batch: undefined,
      n_ubatch: undefined,
    });
  });
});

describe('smallModelThreadCount', () => {
  it('caps an 8-core phone at the four performance cores', () => {
    expect(smallModelThreadCount({currentThreads: 6, coreCount: 8})).toBe(4);
  });

  it('keeps a thread count that is already within the big cluster', () => {
    expect(smallModelThreadCount({currentThreads: 4, coreCount: 8})).toBeNull();
    expect(smallModelThreadCount({currentThreads: 2, coreCount: 8})).toBeNull();
  });

  it('does nothing for small or unknown core counts', () => {
    expect(smallModelThreadCount({currentThreads: 8, coreCount: 4})).toBeNull();
    expect(
      smallModelThreadCount({currentThreads: 8, coreCount: null}),
    ).toBeNull();
    expect(
      smallModelThreadCount({currentThreads: undefined, coreCount: 8}),
    ).toBeNull();
  });
});

describe('smallModelDelegateHint', () => {
  it('picks the CPU delegate on mid and low tier Android', () => {
    for (const tier of ['low', 'mid'] as const) {
      expect(
        smallModelDelegateHint({platform: 'android', deviceTier: tier}),
      ).toMatchObject({devices: ['CPU'], n_gpu_layers: 0});
    }
  });

  it('leaves larger Android tiers and iOS to the platform default', () => {
    expect(
      smallModelDelegateHint({platform: 'android', deviceTier: 'high'}),
    ).toBeNull();
    expect(
      smallModelDelegateHint({platform: 'android', deviceTier: 'flagship'}),
    ).toBeNull();
    expect(
      smallModelDelegateHint({platform: 'ios', deviceTier: 'mid'}),
    ).toBeNull();
    expect(
      smallModelDelegateHint({platform: 'android', deviceTier: null}),
    ).toBeNull();
  });
});
