import {Platform} from 'react-native';

import * as RNFS from '@dr.pogodin/react-native-fs';
import type {ChunkProgressEvent} from '@pocketpalai/react-native-speech';

import {
  PIPER_CONFIG_FILENAME,
  PIPER_HF_BASE_URL,
  PIPER_MODEL_FILENAME,
  PIPER_MODEL_FILES,
  PIPER_MODEL_ONNX_SHA256,
  PIPER_MODEL_SUBDIR,
  PIPER_VOICE_ID,
  TTS_DICT_FILENAME,
  TTS_DICT_URL,
  TTS_PARENT_SUBDIR,
} from '../../constants';
import {executionProvidersFromPreference} from '../../executionProviders';
import {ttsRuntime} from '../../runtime';
import type {
  NeuralEngine,
  StreamOptions,
  StreamingHandle,
  Voice,
} from '../../types';
import {PIPER_VOICES} from './voices';

/** Minimal shape used from onnxruntime-react-native (loaded lazily). */
type OnnxTensor = {
  data: Float32Array | Int32Array | Uint8Array | BigInt64Array;
};
type OnnxSession = {
  run(feeds: Record<string, unknown>): Promise<Record<string, OnnxTensor>>;
  release?: () => Promise<void>;
};
type PiperPhonemizer = {
  phonemize(text: string, language: string): Promise<string>;
};

type StreamSession = {
  append(text: string): void;
  finalize(): Promise<void>;
  cancel(): Promise<void>;
};

type MarkdownBuffer = {
  push(text: string): string | null;
  flush(): string | null;
};

/**
 * Streaming markdown stripper from the speech package. Loaded lazily so
 * the TTS registry stays importable in tests without the native root
 * module. Falls back to a pass-through buffer if it is unavailable.
 */
const createMarkdownBuffer = (
  firstChunk?: 'sentence' | 'clause',
): MarkdownBuffer => {
  try {
    const {
      createMarkdownStreamBuffer,
    } = require('@pocketpalai/react-native-speech');
    return createMarkdownStreamBuffer({firstChunk}) as MarkdownBuffer;
  } catch (err) {
    console.warn('[PiperEngine] markdown stripping unavailable:', err);
    return {push: text => text, flush: () => null};
  }
};

type StreamingSdk = {
  EngineStreamSession: new (config: {
    maxChunkSize: number;
    firstChunk?: 'sentence' | 'clause';
    synthesizeChunk: (text: string) => Promise<Float32Array>;
    hasAudio: (audio: Float32Array) => boolean;
    playAudio: (audio: Float32Array, options?: unknown) => Promise<void>;
    stopPlayback: () => Promise<void>;
    onChunkProgress?: (event: ChunkProgressEvent) => void;
  }) => StreamSession;
  neuralAudioPlayer: {
    play(
      buffer: {
        samples: Float32Array;
        sampleRate: number;
        channels: number;
        duration: number;
      },
      options?: unknown,
    ): Promise<void>;
    stop(): Promise<void>;
  };
};

let streamingSdk: StreamingSdk | null = null;

const getStreamingSdk = (): StreamingSdk => {
  if (!streamingSdk) {
    // Lazy so importing the TTS registry in tests does not pull in the
    // native add-on subpath.
    streamingSdk = require('@pocketpalai/react-native-speech/engine-sdk');
  }
  return streamingSdk!;
};

let onnxRuntime: {
  InferenceSession: {
    create(uri: string, options?: unknown): Promise<OnnxSession>;
  };
  Tensor: new (
    type: 'int64' | 'float32',
    data: ArrayLike<number> | ArrayLike<bigint>,
    dims: readonly number[],
  ) => unknown;
} | null = null;

const getOnnxRuntime = () => {
  if (!onnxRuntime) {
    try {
      // Loaded lazily so this module stays importable in tests without the
      // native ONNX runtime.
      const onnx = require('onnxruntime-react-native');
      onnxRuntime = {
        InferenceSession: onnx.InferenceSession,
        Tensor: onnx.Tensor,
      };
    } catch {
      throw new Error('onnxruntime-react-native is required to use Piper TTS.');
    }
  }
  return onnxRuntime;
};

/**
 * Load the shared IPA dictionary + phonemizer from the speech package's
 * engine sources. The library exposes engine building blocks on
 * `engine-sdk` but does not re-export the phonemization helpers.
 */
const createPhonemizer = async (dictPath: string): Promise<PiperPhonemizer> => {
  const {
    openNativeDict,
  } = require('@pocketpalai/react-native-speech/lib/module/phonemization/NativeDictSource.js');
  const {
    HansPhonemizer,
  } = require('@pocketpalai/react-native-speech/lib/module/phonemization/HansPhonemizer.js');
  const dict = await openNativeDict(dictPath);
  return new HansPhonemizer({dict});
};

interface PiperConfigFile {
  audio?: {sample_rate?: number};
  sample_rate?: number;
  phoneme_id_map?: Record<string, number[]>;
  inference?: {
    noise_scale?: number;
    length_scale?: number;
    noise_w?: number;
  };
  noise_scale?: number;
  length_scale?: number;
  noise_w?: number;
}

interface LoadedPiperConfig {
  sampleRate: number;
  phonemeIdMap: Record<string, number[]>;
  noiseScale: number;
  lengthScale: number;
  noiseW: number;
}

const toSamples = (tensor: OnnxTensor): Float32Array => {
  const data = tensor.data;
  if (data instanceof Float32Array) {
    return data.slice();
  }
  if (data instanceof Int32Array) {
    return Float32Array.from(data, value => value / 2147483648);
  }
  if (data instanceof Uint8Array) {
    return Float32Array.from(data, value => (value - 128) / 128);
  }
  return new Float32Array(0);
};

/**
 * Piper neural TTS engine (en_US lessac medium, rhasspy/piper-voices).
 *
 * Downloads the pinned ONNX voice + config from Hugging Face, verifies the
 * ONNX SHA-256, and synthesizes with onnxruntime-react-native. Text is
 * phonemized with the shared dictionary phonemizer and streamed through
 * `EngineStreamSession`, which flushes on clause punctuation (`,` `.` `!` `?`)
 * for low time-to-first-audio.
 */
export class PiperEngine implements NeuralEngine {
  readonly id = 'piper' as const;

  private session: OnnxSession | null = null;
  private config: LoadedPiperConfig | null = null;
  private phonemizer: PiperPhonemizer | null = null;
  private activeStream: StreamingHandle | null = null;

  private getParentDir(): string {
    const root =
      Platform.OS === 'ios'
        ? `${RNFS.LibraryDirectoryPath}/Application Support`
        : RNFS.DocumentDirectoryPath;
    return `${root}/${TTS_PARENT_SUBDIR}`;
  }

  getModelPath(): string {
    const root =
      Platform.OS === 'ios'
        ? `${RNFS.LibraryDirectoryPath}/Application Support`
        : RNFS.DocumentDirectoryPath;
    return `${root}/${PIPER_MODEL_SUBDIR}`;
  }

  private getFilePath(filename: string): string {
    return `${this.getModelPath()}/${filename}`;
  }

  async isInstalled(): Promise<boolean> {
    try {
      for (const file of [
        ...PIPER_MODEL_FILES.map(f => f.name),
        TTS_DICT_FILENAME,
      ]) {
        if (!(await RNFS.exists(this.getFilePath(file)))) {
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('[PiperEngine] isInstalled check failed:', err);
      return false;
    }
  }

  async getVoices(): Promise<Voice[]> {
    return PIPER_VOICES;
  }

  async downloadModel(onProgress?: (progress: number) => void): Promise<void> {
    const parentDir = this.getParentDir();
    const modelDir = this.getModelPath();

    await RNFS.mkdir(parentDir, {NSURLIsExcludedFromBackupKey: true});
    await RNFS.mkdir(modelDir, {NSURLIsExcludedFromBackupKey: true});

    const allFiles = [
      ...PIPER_MODEL_FILES.map(file => ({
        name: file.name,
        url: `${PIPER_HF_BASE_URL}/${file.urlPath}`,
      })),
      {name: TTS_DICT_FILENAME, url: TTS_DICT_URL},
    ];
    const perFileProgress = new Array(allFiles.length).fill(0);
    const reportOverall = () => {
      if (!onProgress) {
        return;
      }
      const sum = perFileProgress.reduce((a, b) => a + b, 0);
      onProgress(Math.min(1, sum / allFiles.length));
    };

    try {
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i]!;
        const target = this.getFilePath(file.name);
        const result = await RNFS.downloadFile({
          fromUrl: file.url,
          toFile: target,
          background: false,
          discretionary: false,
          cacheable: false,
          progressInterval: 500,
          progress: res => {
            const contentLength = res.contentLength || 1;
            perFileProgress[i] = Math.min(1, res.bytesWritten / contentLength);
            reportOverall();
          },
        }).promise;

        if (result.statusCode !== 200) {
          throw new Error(
            `Failed to download ${file.name}: HTTP ${result.statusCode}`,
          );
        }
        perFileProgress[i] = 1;
        reportOverall();
      }

      // Pinned ONNX checksum. A mismatch means a truncated or tampered file;
      // discard the install so a retry starts clean.
      const onnxPath = this.getFilePath(PIPER_MODEL_FILENAME);
      const hash = (await RNFS.hash(onnxPath, 'sha256')).toLowerCase();
      if (hash !== PIPER_MODEL_ONNX_SHA256) {
        throw new Error(
          `Piper voice checksum mismatch (expected ${PIPER_MODEL_ONNX_SHA256.slice(
            0,
            12,
          )}…, got ${hash.slice(0, 12)}…)`,
        );
      }

      if (onProgress) {
        onProgress(1);
      }
    } catch (err) {
      try {
        if (await RNFS.exists(modelDir)) {
          await RNFS.unlink(modelDir);
        }
      } catch (cleanupErr) {
        console.warn(
          '[PiperEngine] partial-download cleanup failed:',
          cleanupErr,
        );
      }
      throw err;
    }
  }

  async deleteModel(): Promise<void> {
    await this.release();
    try {
      if (await RNFS.exists(this.getModelPath())) {
        await RNFS.unlink(this.getModelPath());
      }
    } catch (err) {
      console.warn('[PiperEngine] deleteModel failed:', err);
    }
  }

  async loadInto(): Promise<void> {
    if (this.session && this.config && this.phonemizer) {
      return;
    }
    if (!(await this.isInstalled())) {
      throw new Error('Piper voice is not installed');
    }

    const configText = await RNFS.readFile(
      this.getFilePath(PIPER_CONFIG_FILENAME),
      'utf8',
    );
    const parsed = JSON.parse(configText) as PiperConfigFile;
    if (!parsed.phoneme_id_map) {
      throw new Error('Piper voice config is missing phoneme_id_map');
    }
    this.config = {
      sampleRate: parsed.audio?.sample_rate ?? parsed.sample_rate ?? 22050,
      phonemeIdMap: parsed.phoneme_id_map,
      noiseScale: parsed.inference?.noise_scale ?? parsed.noise_scale ?? 0.667,
      lengthScale: parsed.inference?.length_scale ?? parsed.length_scale ?? 1.0,
      noiseW: parsed.inference?.noise_w ?? parsed.noise_w ?? 0.8,
    };

    const {InferenceSession} = getOnnxRuntime();
    // Plain filesystem path, matching the fork's other ONNX engines
    // (onnxruntime-react-native resolves it on both platforms).
    this.session = await InferenceSession.create(
      this.getFilePath(PIPER_MODEL_FILENAME),
      {executionProviders: executionProvidersFromPreference() ?? ['cpu']},
    );
    this.phonemizer = await createPhonemizer(
      this.getFilePath(TTS_DICT_FILENAME),
    );
  }

  private phonemeIds(phonemes: string): number[] {
    const map = this.config?.phonemeIdMap ?? {};
    const ids: number[] = [];
    const bos = map['^']?.[0];
    if (bos !== undefined) {
      ids.push(bos);
    }
    const boundary = map[' ']?.[0] ?? map._?.[0] ?? 0;
    // Piper's IPA map contains multi-codepoint phonemes ("tʃ", "eɪ",
    // "aʊ"…), so match the longest key at each position instead of
    // iterating code points — otherwise those sounds are silently lost.
    const phonemeKeys = Object.keys(map)
      .filter(key => key !== '^' && key !== '$' && !/^\s+$/.test(key))
      .sort((a, b) => b.length - a.length);
    let lastWasBoundary = false;
    let index = 0;
    while (index < phonemes.length) {
      const char = phonemes[index]!;
      if (/\s/.test(char)) {
        if (!lastWasBoundary && ids.length > 0) {
          ids.push(boundary);
          lastWasBoundary = true;
        }
        index++;
        continue;
      }
      const key = phonemeKeys.find(k => phonemes.startsWith(k, index));
      if (!key) {
        index++;
        continue;
      }
      const id = map[key]?.[0];
      if (id !== undefined) {
        ids.push(id, 0);
        lastWasBoundary = false;
      }
      index += key.length;
    }
    const eos = map.$?.[0];
    if (eos !== undefined) {
      ids.push(eos);
    }
    return ids;
  }

  private async synthesizeAudio(text: string): Promise<Float32Array> {
    const session = this.session;
    const config = this.config;
    const phonemizer = this.phonemizer;
    if (!session || !config || !phonemizer) {
      throw new Error('Piper engine is not initialized');
    }

    const phonemes = await phonemizer.phonemize(text, 'en-us');
    const ids = this.phonemeIds(phonemes);
    if (ids.length === 0) {
      return new Float32Array(0);
    }

    const {Tensor} = getOnnxRuntime();
    const input = new Tensor(
      'int64',
      BigInt64Array.from(ids.map(id => BigInt(id))),
      [1, ids.length],
    );
    const inputLengths = new Tensor(
      'int64',
      BigInt64Array.from([BigInt(ids.length)]),
      [1],
    );
    const scales = new Tensor(
      'float32',
      Float32Array.from([config.noiseScale, config.lengthScale, config.noiseW]),
      [3],
    );

    const outputs = await session.run({
      input,
      input_lengths: inputLengths,
      scales,
    });
    const first = Object.values(outputs)[0];
    if (!first) {
      return new Float32Array(0);
    }
    return toSamples(first);
  }

  async play(text: string, voice: Voice): Promise<void> {
    if (!(await this.isInstalled())) {
      throw new Error('Piper voice is not installed');
    }
    const handle = this.playStreaming(voice);
    handle.appendText(text);
    await handle.finalize();
  }

  playStreaming(
    _voice: Voice,
    waitFor?: Promise<void>,
    streamOpts?: StreamOptions,
  ): StreamingHandle {
    let stream: StreamingHandle | null = null;
    let dead = false;
    const pending: string[] = [];
    const mdBuffer = createMarkdownBuffer(streamOpts?.firstChunk);

    const routeClean = (clean: string) => {
      if (stream) {
        stream.appendText(clean);
      } else {
        pending.push(clean);
      }
    };

    const appendClean = (raw: string) => {
      const clean = mdBuffer.push(raw);
      if (clean) {
        routeClean(clean);
      }
    };

    const ready = (waitFor ?? Promise.resolve())
      .catch(() => undefined)
      .then(() =>
        ttsRuntime.acquire(this, async () => {
          if (dead) {
            return;
          }
          const sdk = getStreamingSdk();
          const session = new sdk.EngineStreamSession({
            maxChunkSize: 200,
            firstChunk: streamOpts?.firstChunk ?? 'clause',
            synthesizeChunk: chunk => this.synthesizeAudio(chunk),
            hasAudio: samples => samples.length > 0,
            playAudio: samples =>
              sdk.neuralAudioPlayer.play(
                {
                  samples,
                  sampleRate: this.config?.sampleRate ?? 22050,
                  channels: 1,
                  duration: samples.length / (this.config?.sampleRate ?? 22050),
                },
                {silentMode: 'obey', ducking: true},
              ),
            stopPlayback: () => sdk.neuralAudioPlayer.stop(),
            onChunkProgress: streamOpts?.onProgress
              ? (event: ChunkProgressEvent) => {
                  streamOpts.onProgress?.({
                    chunkText: event.chunkText,
                    chunkIndex: event.chunkIndex,
                    batchIndex: 0,
                    streamRange: event.textRange,
                  });
                }
              : undefined,
          });
          stream = {
            appendText: chunk => session.append(chunk),
            finalize: () => session.finalize(),
            cancel: () => session.cancel(),
          };
          this.activeStream = stream;
          for (const chunk of pending) {
            session.append(chunk);
          }
          pending.length = 0;
        }),
      )
      .catch(err => {
        console.warn('[PiperEngine] streaming acquire failed:', err);
        throw err;
      });

    return {
      appendText: (chunk: string) => {
        if (dead) {
          return;
        }
        appendClean(chunk);
      },
      finalize: async () => {
        if (dead) {
          return;
        }
        const tail = mdBuffer.flush();
        if (tail) {
          routeClean(tail);
        }
        await ready;
        await stream?.finalize();
        this.activeStream = null;
      },
      cancel: async () => {
        if (dead) {
          return;
        }
        dead = true;
        pending.length = 0;
        await stream?.cancel();
        await this.stop();
        this.activeStream = null;
      },
    };
  }

  async stop(): Promise<void> {
    try {
      await this.activeStream?.cancel();
    } catch (err) {
      console.warn('[PiperEngine] cancel failed:', err);
    }
    await getStreamingSdk().neuralAudioPlayer.stop();
  }

  async release(): Promise<void> {
    await this.stop();
    const session = this.session;
    this.session = null;
    this.config = null;
    this.phonemizer = null;
    try {
      await session?.release?.();
    } catch (err) {
      console.warn('[PiperEngine] session release failed:', err);
    }
  }
}

export {PIPER_VOICE_ID};
