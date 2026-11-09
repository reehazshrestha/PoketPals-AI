<div align="center">

<img src="src/assets/poketpals-icon.png" alt="PoketPals AI icon" width="140" />

# PoketPals AI

**A free, private AI companion that runs on your phone — with hands-free voice included.**

Chat with on-device language models, talk to them out loud, and keep every conversation on your device. No account, no subscription, no paywall on voice.

[![Latest release](https://img.shields.io/github/v/release/reehazshrestha/PoketPals-AI?sort=semver)](https://github.com/reehazshrestha/PoketPals-AI/releases)
[![License: MIT](https://img.shields.io/github/license/reehazshrestha/PoketPals-AI)](LICENSE)
[![Stars](https://img.shields.io/github/stars/reehazshrestha/PoketPals-AI)](https://github.com/reehazshrestha/PoketPals-AI/stargazers)
[![Issues](https://img.shields.io/github/issues/reehazshrestha/PoketPals-AI)](https://github.com/reehazshrestha/PoketPals-AI/issues)

[Download the APK](https://github.com/reehazshrestha/PoketPals-AI/releases/latest) · [Report a bug](https://github.com/reehazshrestha/PoketPals-AI/issues)

</div>

---

## What is PoketPals AI?

PoketPals AI is a community fork of **[PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai)** by [Ali Ghorbani](https://github.com/a-ghorbani). PocketPal proved that a phone can run a real language model entirely offline. PoketPals keeps that foundation and changes the parts that matter most for everyday use: **voice is free, small models are tuned properly, and there are more voice engines to choose from.**

Everything still runs on the device. Your prompts, replies, and documents never leave the phone unless you deliberately turn on an online feature such as web search or a remote model server.

## Why PoketPals AI?

### 🆓 Hands-free voice is free — no Plus purchase

Upstream PocketPal sells hands-free voice as an optional **PocketPal Plus** purchase in the App Store and Google Play builds. In PoketPals AI the gate is off: start a voice conversation, speak naturally, and hear the reply without buying anything or creating an account. There is no Plus screen, no licence check, and no store dependency in the normal build.

### ⚡ A real low-latency mode for smaller phones

Most phones cannot comfortably run a 3B+ model. PoketPals adds a one-switch **Low Latency Mode** built around **Qwen2.5 0.5B Instruct (4-bit)** and the **Piper** voice:

- a built-in, verified 0.5B GGUF model that can be downloaded straight from the model list;
- a small-model runtime profile that caps context, batch, and micro-batch sizes instead of letting oversized defaults waste RAM;
- automatic CPU/GPU delegate selection based on the detected device tier;
- a small, fast Piper voice selected for you when the mode is enabled.

The result is a conversation that starts quickly and keeps working on hardware that would struggle with a larger model.

### 🗣️ More voice engines, more voices

Choose the speech engine that fits your device:

| Engine | Voices | Disk | Notes |
| --- | --- | --- | --- |
| **Piper** | 1 | ~66 MB | Fast, low-RAM default for Low Latency Mode |
| **Kitten** | 8 | ~57 MB | Small and quick |
| **Kokoro** | 22 | ~330 MB | Large voice selection, higher quality |
| **Supertonic** | 10 | ~380 MB | High-quality neural voices |
| **Phonon** | 8 | ~64 MB+ | Native runtime on supported devices |
| **System** | — | — | Uses the voices already installed on your phone |

All neural engines run through ONNX Runtime on the phone. You can also use your system's own text-to-speech voices when you want zero extra downloads.

### 🧠 Better compatibility with the models you already use

- Download any GGUF model from Hugging Face, including gated repositories with your own access token.
- Import models from local storage.
- Automatic small-model tuning avoids the out-of-memory crashes that make budget phones give up on local AI.
- CPU, GPU, and NPU paths where the device supports them, with graceful fallback.
- A built-in Qwen2.5 0.5B entry is always visible, so a working model is one tap away.

### 🔎 Free web search without an API key

PoketPals adds **DuckDuckGo** as a search provider alongside the existing options. It needs no key and no account, so tool-enabled models can look things up without extra setup.

### 🎨 A leaner, chat-first app

This fork trims the parts that got in the way of a simple offline assistant:

- the Pals marketplace and account screens are gone from the main navigation;
- the purchase and account cards are gone from Settings;
- a new accent palette and theme system lets you make the app yours;
- assistant suggestion chips help you get started without writing a perfect prompt.

## Features at a glance

- **On-device chat** — Gemma, Qwen, Phi, Llama, and any other GGUF model you can download.
- **Free hands-free voice** — speech in, spoken reply out, no purchase.
- **On-device speech recognition** — Whisper via whisper.cpp for dictation.
- **Multiple neural TTS engines** — Piper, Kitten, Kokoro, Supertonic, Phonon, and system voices.
- **Low Latency Mode** — Qwen2.5 0.5B plus Piper, tuned for smaller devices.
- **Web search and page reading** — opt-in, with a free DuckDuckGo provider.
- **Model management** — Hugging Face search, downloads, local imports, and metadata.
- **Benchmarking** — measure tokens per second and memory use on your own device.
- **Privacy by default** — no account and no chat uploads.

## Install

### Android (recommended)

1. Open the [latest release](https://github.com/reehazshrestha/PoketPals-AI/releases/latest).
2. Download the `PoketPals-AI-*.apk` file.
3. Allow installation from your browser or file manager when Android asks.
4. Open **PoketPals AI**, download a model (or enable Low Latency Mode), and start chatting.

The release APK targets **arm64-v8a**, which covers essentially every Android phone from the last several years and keeps the download smaller.

> Sideloaded builds are signed with the project's development key. If you previously installed a different build of this fork, uninstall it first if Android reports a signature mismatch.

### Build from source

Requirements: Node.js 20+, Yarn, JDK 17, Android SDK with NDK, and the usual React Native Android toolchain.

```bash
git clone https://github.com/reehazshrestha/PoketPals-AI.git
cd PoketPals-AI
yarn install
yarn android          # debug build on a connected device
```

Release APK:

```bash
cd android
./gradlew assembleProdRelease
```

The APK is written to `android/app/build/outputs/apk/prod/release/`.

## Using the app

1. **Pick a model** — open the menu, go to **Models**, and download one that fits your phone. For older hardware, start with **Qwen2.5 0.5B Instruct** or turn on **Low Latency Mode** in Settings.
2. **Chat** — type a message, or tap the microphone to dictate. Long-press a reply to copy part of it.
3. **Talk hands-free** — tap the voice button in the composer. PoketPals listens, answers, and speaks the reply. No purchase prompt.
4. **Choose a voice** — Settings → **Voice and speech** lets you pick an engine, a voice, and the compute provider (CPU, XNNPACK, or NNAPI).
5. **Go online only when you want** — web search and remote model servers are opt-in. Everything else works in airplane mode.

## Privacy

PoketPals AI is local-first:

- chats, prompts, and documents stay in the app's local database;
- models and voices are downloaded only when you ask for them;
- web search, page reading, remote servers, and online system voices run only when you enable or invoke them;
- there is no account system and no analytics SDK added by this fork.

The app still contains upstream networking for model downloads, optional benchmarking, and optional feedback. Those paths never attach your chat contents.

## Legal

- [Privacy policy](docs/legal/privacy-policy.md)
- [Terms of service](docs/legal/terms-of-service.md)
- [Open-source notices](docs/legal/open-source-notices.md)

The same documents are bundled in the app under **App Info** and work offline.

## Project status

PoketPals AI is an independent community fork, not an official PocketPal release. It is developed Android-first. The iOS project is kept in the repository for upstream compatibility, but iOS builds are not currently produced or tested by this fork.

Expect rough edges. Bug reports and pull requests are welcome at [reehazshrestha/PoketPals-AI](https://github.com/reehazshrestha/PoketPals-AI).

## Credits

PoketPals AI would not exist without the work of the PocketPal community:

- **[PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai)** by Asghar Ghorbani — the upstream project this fork is based on. If you want the original app, store builds, Pals, and PalsHub, use upstream.
- **[llama.cpp](https://github.com/ggml-org/llama.cpp)** and **[llama.rn](https://github.com/mybigday/llama.rn)** — on-device language model inference.
- **[whisper.cpp](https://github.com/ggml-org/whisper.cpp)** and **[whisper.rn](https://github.com/mybigday/whisper.rn)** — speech recognition.
- **[ONNX Runtime](https://onnxruntime.ai/)** — neural text-to-speech inference.
- **Kokoro, Kitten, Supertonic, Piper, and Phonon** — the voice models and runtimes.
- **React Native, React Native Paper, MobX, and WatermelonDB** — the app framework.

The original PocketPal copyright and MIT licence are preserved in [LICENSE](LICENSE). The fork's changes are released under the same MIT licence.

## Licence

MIT. See [LICENSE](LICENSE).

---

<div align="center">

Made for people who want a private AI companion without a subscription.

**[⭐ Star the repo](https://github.com/reehazshrestha/PoketPals-AI)** · **[🐛 Report a bug](https://github.com/reehazshrestha/PoketPals-AI/issues)**

</div>
