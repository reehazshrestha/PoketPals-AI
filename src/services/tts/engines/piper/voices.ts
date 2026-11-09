import type {Voice} from '../../types';
import {PIPER_VOICE_ID} from '../../constants';

/**
 * Piper voice catalog. The engine currently ships one verified English
 * (US) medium voice from rhasspy/piper-voices. Adding another locale means
 * adding its onnx + onnx.json pair and its size to PIPER_MODEL_FILES.
 */
export const PIPER_VOICES: Voice[] = [
  {
    id: PIPER_VOICE_ID,
    name: 'Lessac',
    engine: 'piper',
    language: 'en-US',
    gender: 'f',
  },
];
