# PoketPals AI — Open-source notices

PoketPals AI is built on open-source software and is itself open source under
the MIT License. This page lists the main components bundled with the app and
the attribution for the voice stack.

## PoketPals AI

Copyright (c) 2026 reehazshrestha and PoketPals AI contributors.

PoketPals AI is a fork of PocketPal AI, copyright (c) 2024 Asghar Ghorbani,
licensed under the MIT License. Upstream project:
https://github.com/a-ghorbani/pocketpal-ai

The MIT License permits use, modification, and distribution provided the
copyright notice and permission notice are included. The full text is in the
repository's `LICENSE` file.

## Model runtime

- **llama.cpp** — MIT License. https://github.com/ggml-org/llama.cpp
- **llama.rn** — MIT License. https://github.com/mybigday/llama.rn
- **ONNX Runtime** (`onnxruntime-react-native`) — MIT License.
  https://github.com/microsoft/onnxruntime
- **whisper.rn** — MIT License. https://github.com/mybigday/whisper.rn

## Voice and speech

- **@pocketpalai/react-native-speech** — MIT License.
- **@pocketpalai/react-native-speech-phonon** — MIT License.
- **Phonon voice model and voices** — by Gradium, licensed under Apache-2.0.
  Built on Pocket TTS and the Mimi codec by Kyutai.
- **Piper** — MIT License. https://github.com/rhasspy/piper

The detailed third-party notices shipped with the Phonon add-on are reproduced
below.

## App framework and libraries

- **React** and **React Native** — MIT License. https://github.com/facebook/react-native
- **React Native Paper** — MIT License. https://github.com/callstack/react-native-paper
- **React Navigation** — MIT License. https://github.com/react-navigation/react-navigation
- **MobX** and **mobx-react** — MIT License. https://github.com/mobxjs/mobx
- **WatermelonDB** — MIT License. https://github.com/Nozbe/WatermelonDB
- **react-native-render-html** — BSD-2-Clause License.
  https://github.com/meliorence/react-native-render-html
- **react-native-svg** — MIT License. https://github.com/software-mansion/react-native-svg
- **react-native-reanimated** — MIT License. https://github.com/software-mansion/react-native-reanimated
- **react-native-gesture-handler** — MIT License.
  https://github.com/software-mansion/react-native-gesture-handler
- **@gorhom/bottom-sheet** — MIT License. https://github.com/gorhom/react-native-bottom-sheet
- **react-native-vision-camera** — MIT License. https://github.com/mrousavy/react-native-vision-camera
- **react-native-keychain** — MIT License. https://github.com/oblador/react-native-keychain
- **react-native-iap** — MIT License. https://github.com/hyodotdev/react-native-iap
- **Axios** — MIT License. https://github.com/axios/axios
- **zod** — MIT License. https://github.com/colinhacks/zod
- **marked** — MIT License. https://github.com/markedjs/marked

A complete dependency list with versions is available in the repository's
`package.json` and `yarn.lock`. Each package's license text is distributed in
its own package directory and is available from its project page.

## Models

Model files are not authored by PoketPals AI. They are downloaded directly from
their publishers, and each model carries its own license and acceptable-use
terms. Review the model card before downloading or redistributing a model.

## Reporting an attribution issue

If a component is missing from these notices, open an issue at
https://github.com/reehazshrestha/PoketPals-AI/issues so it can be corrected.
