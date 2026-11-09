# PoketPals AI — Privacy Policy

**Last updated: 9 November 2026**

PoketPals AI is a free, open-source Android app that runs language models on your
phone. This policy explains what stays on your device, what leaves it, and what
you control. It covers the PoketPals AI app and its repository at
https://github.com/reehazshrestha/PoketPals-AI.

PoketPals AI is a fork of PocketPal AI. It is not operated by, endorsed by, or
supported by the PocketPal AI maintainers.

## The short version

- No account is required.
- Chats, pal instructions, memories, and model files stay on your device.
- There is no analytics, advertising, tracking, or telemetry.
- Network requests happen only when you download a model, use web search, send
  optional feedback, or connect a service you chose.

## Data stored on your device

The app stores the following locally:

- chat sessions and messages
- pals, system prompts, and memories you create
- downloaded model files and voice files
- app settings, theme choices, and onboarding state
- API keys and access tokens you enter, held in the operating system's secure
  storage where available

This data is not sent to the PoketPals AI project. Removing the app or clearing
its data removes it, except for files you exported yourself.

## Network requests

The app talks to the internet only for the features you invoke:

- **Model downloads.** Requests go directly to Hugging Face
  (huggingface.co). Hugging Face receives standard request data such as your IP
  address. If you add a Hugging Face token, it is sent to Hugging Face with
  those requests.
- **Web search and page reading.** If you enable Internet Search and run a
  search, your query is sent to the provider you selected (for example Tavily,
  Brave, Exa, Firecrawl, Parallel, You.com, or DuckDuckGo). If a pal reads a
  page, the page is fetched by the provider or by the app's default reader
  (r.jina.ai). Those services receive the query or URL under their own privacy
  policies. Keys and queries are never routed through the PoketPals AI project.
- **Optional feedback.** The feedback form sends the text you choose to submit
  to the project's feedback endpoint (Firebase Functions). Do not include
  secrets or sensitive personal data.
- **Services you configure.** If you connect a remote model server, sign in with
  Google or Apple, or enable another integration, the app contacts that service
  directly. Its privacy policy applies.
- **Optional monetization.** The fork builds with no ads and no tracking. If a
  build includes Google Play billing for optional support, Google processes the
  purchase.

The app does not sell data and does not share data with advertisers or data
brokers.

## Permissions

The app requests permissions only when a feature needs them:

- **Camera and microphone** for voice conversation, dictation, and scanning a
  model-server QR code.
- **Notifications** for download progress and reminders.
- **Storage or file access** when you import or export chats and models.

You can deny or revoke any permission in Android settings. Features that need a
denied permission will not work.

## Third-party components

PoketPals AI bundles open-source libraries, model runtimes, and optional voice
models. Their licenses and attributions are listed in App Info → Open-source
notices. Model files are downloaded from their publishers and may carry their
own licenses or acceptable-use terms; check the model card before use.

## Children

PoketPals AI is not directed at children under 13. The app does not knowingly
collect personal information from anyone. Because chats stay on the device, the
project cannot access them.

## Your choices

- Keep the app offline: do not download models or enable search.
- Revoke network access for the app in Android settings.
- Delete individual chats, exported files, or all app data.
- Use the app without providing an email address or account.

## Changes

We may update this policy when the app changes. The date at the top shows the
current version. Material changes will be noted in the repository's release
notes.

## Contact

For privacy questions, open an issue at
https://github.com/reehazshrestha/PoketPals-AI/issues. Do not post secrets or
personal data in a public issue.
