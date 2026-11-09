import {HuggingFaceModel, Model, ModelOrigin, ModelType} from '../utils/types';
import {chatTemplates} from '../utils/chat';
import {defaultCompletionParams} from '../utils/completionSettingsVersions';

/**
 * Built-in low-latency chat model.
 *
 * Verified against the upstream Hugging Face repository on 2026-11-08:
 *   repo:  Qwen/Qwen2.5-0.5B-Instruct-GGUF
 *   file:  qwen2.5-0.5b-instruct-q4_k_m.gguf
 *   bytes: 491,400,032
 *   sha256: 74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db
 *
 * The entry is always present in the model list, so users can pick it without
 * searching HF. It is not downloaded until the user (or Low Latency Mode)
 * asks for it.
 */
export const QWEN25_05B_INSTRUCT_MODEL_ID =
  'Qwen/Qwen2.5-0.5B-Instruct-GGUF/qwen2.5-0.5b-instruct-q4_k_m.gguf';

const QWEN25_05B_FILENAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const QWEN25_05B_REPO = 'Qwen/Qwen2.5-0.5B-Instruct-GGUF';
const QWEN25_05B_SIZE = 491_400_032;
const QWEN25_05B_SHA256 =
  '74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db';

const QWEN25_05B_HF_MODEL = {
  id: QWEN25_05B_REPO,
  author: 'Qwen',
  url: `https://huggingface.co/${QWEN25_05B_REPO}`,
  specs: {gguf: {total: 494_032_768}},
  siblings: [
    {
      rfilename: QWEN25_05B_FILENAME,
      url: `https://huggingface.co/${QWEN25_05B_REPO}/resolve/main/${QWEN25_05B_FILENAME}`,
      size: QWEN25_05B_SIZE,
      lfs: {
        oid: QWEN25_05B_SHA256,
        size: QWEN25_05B_SIZE,
        pointerSize: 134,
      },
    },
  ],
} as unknown as HuggingFaceModel;

const qwenCompletionSettings = {
  ...defaultCompletionParams,
  n_predict: 384,
  temperature: 0.6,
  top_p: 0.9,
};

export const QWEN25_05B_INSTRUCT_MODEL: Model = {
  id: QWEN25_05B_INSTRUCT_MODEL_ID,
  author: 'Qwen',
  repo: 'Qwen2.5-0.5B-Instruct-GGUF',
  name: 'Qwen2.5 0.5B Instruct',
  type: 'qwen2',
  capabilities: [],
  size: QWEN25_05B_SIZE,
  params: 494_032_768,
  isDownloaded: false,
  downloadUrl: `https://huggingface.co/${QWEN25_05B_REPO}/resolve/main/${QWEN25_05B_FILENAME}`,
  hfUrl: `https://huggingface.co/${QWEN25_05B_REPO}`,
  progress: 0,
  filename: QWEN25_05B_FILENAME,
  isLocal: false,
  origin: ModelOrigin.HF,
  modelType: ModelType.LLM,
  expectedSha256: QWEN25_05B_SHA256,
  defaultChatTemplate: chatTemplates.qwen25,
  chatTemplate: chatTemplates.qwen25,
  defaultCompletionSettings: {...qwenCompletionSettings},
  completionSettings: {...qwenCompletionSettings},
  defaultStopWords: ['<|im_end|>', '<|endoftext|>'],
  stopWords: ['<|im_end|>', '<|endoftext|>'],
  hfModel: QWEN25_05B_HF_MODEL,
  hfModelFile: {
    rfilename: QWEN25_05B_FILENAME,
    url: `https://huggingface.co/${QWEN25_05B_REPO}/resolve/main/${QWEN25_05B_FILENAME}`,
    size: QWEN25_05B_SIZE,
    lfs: {
      oid: QWEN25_05B_SHA256,
      size: QWEN25_05B_SIZE,
      pointerSize: 134,
    },
    canFitInStorage: true,
  },
};

/**
 * Runtime tuning for the low-latency model. 4K leaves headroom for the
 * system/tool prompt and a real conversation; at 1K this app's prompt alone
 * used ~90% of the window on the first turn, which made replies degrade.
 * Thread count is applied separately from the device recommendation.
 */
export const LOW_LATENCY_CONTEXT_PARAMS = {
  n_ctx: 4096,
  n_batch: 512,
} as const;
