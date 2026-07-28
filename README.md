<p align="center">
  <img src="./public/logo.svg" width="96" alt="Kelv red panda logo" />
</p>

<h1 align="center">Kelv AI</h1>

<p align="center">
  <strong>Browser-native interview intelligence for practicing how an answer sounds, lands, and holds up on camera.</strong>
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=sv-mgria_6Q"><strong>Watch the demo</strong></a>
  &middot;
  <a href="#run-locally"><strong>Run locally</strong></a>
  &middot;
  <a href="#signal-runtime"><strong>Explore the runtime</strong></a>
</p>

> Kelv began attracting roughly **300 waitlist users** before we considered making the project open source.

## Built for a capstone, designed as a system

Kelv AI started as a senior-year capstone my friends and I built after noticing that interview preparation was usually split between static question banks and generic, after-the-fact feedback. That misses the real constraint: candidates have to retrieve evidence, structure an answer under pressure, communicate it clearly, and maintain an on-camera presence at the same time.

We treated practice as a multimodal systems problem. Kelv runs a live voice interview, captures browser-local camera and microphone signals, aligns those signals with the conversation, and returns per-question coaching. It is not an employment decision system and does not infer identity, personality, or employability.

## What the product looks like

### 01 / Local interview control room

The direct `/platform` route is a local control surface: start a mock, inspect saved sessions, and focus the next rep without hosted auth or a database.

<img src="./public/readme-dashboard.png" alt="Kelv local interview dashboard" width="100%" />

### 02 / Capture-aware session setup

Before the conversation begins, Kelv prepares role context and verifies the browser capture path used by the interview runtime.

<img src="./public/readme-presession.png" alt="Kelv pre-session interview setup" width="100%" />

### 03 / Evidence-led review

Each mock resolves into question-level coaching and a posture replay surface rather than one opaque overall score.

<img src="./public/readme-results.png" alt="Kelv interview results and posture replay" width="100%" />

## Signal runtime

<img src="./public/kelv-signal-runtime.svg" alt="Kelv browser-native signal runtime architecture" width="100%" />

### Vision: pose tensors, not black-box judgments

The active camera path uses TensorFlow.js with WebGL to run **MoveNet SinglePose Lightning** directly in the browser. `usePoseTracking` periodically samples the webcam stream; `poseDetector` converts MoveNet landmarks into explainable presence evidence such as shoulder alignment, head offset, torso lean, stability, and detector confidence. Those signals are preserved with their reliability rather than treated as unquestionable truth.

The system is intentionally scoped to posture coaching. It does not use the active camera path for identity, emotion, demographic, or hiring inference.

### Voice: recording-backed delivery analysis

The browser retains a local WebM recording and uses the Web Audio pipeline to derive delivery features after the session. Kelv combines timing and transcript evidence with audio measurements such as speech pace, pauses, filler language, RMS energy, pitch contour, and spectral features. ElevenLabs Agents supplies the live conversational layer and transcript events; the browser remains the source of the interview evidence.

### Fusion: question context before coaching

Kelv LENS aligns transcript boundaries, content analysis, posture samples, and voice metrics around each question. It calibrates capture quality, weights available evidence, and produces a normalized `SessionResultV2` with question scores, supporting signals, and one practical next-rep target. Session history, presets, and results are persisted in browser-local storage; no Supabase project, row-level security policy, or hosted login is needed.

### Experimental computer-vision lane

The repository also contains facial-expression and eye-tracking experiments. They are deliberately kept outside the active scoring path and are not presented as a shipped emotion-recognition feature. That separation is important: a coaching signal should remain inspectable, bounded, and easy to reject when capture quality is weak.

## Future research directions

- **Multi-camera posture reconstruction.** A future capture rig could synchronize the built-in webcam with two external viewpoints, triangulate keypoints across views, and use cross-view confidence to reduce occlusion and single-camera ambiguity.
- **Higher-fidelity audio.** Spectral microphones or an external audio interface could provide cleaner source material for voice-quality experiments, enabling more robust prosody and spectral analysis than a laptop microphone alone.

These are intentionally documented as directions, not claimed product capabilities. The current runtime remains browser-first and practical to run with standard camera and microphone permissions.

## Run locally

### Prerequisites

- Node.js 20+
- A modern Chromium-based browser for webcam/microphone access
- An ElevenLabs Agent ID if you want the live voice interviewer; the rest of the local product and deterministic review route can still be explored without it

### Setup

```bash
npm install
cp .env.example .env
```

Set `VITE_ELEVENLABS_AGENT_ID` in `.env` for a live conversation, then start the app:

```bash
npm run dev
```

Open `http://localhost:5173/platform`. Kelv intentionally allows direct local access; interview state is stored in the browser profile that runs it.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local interview platform. |
| `npm test` | Run unit tests. |
| `npm run test:e2e` | Validate the local-first browser journey with Playwright. |
| `npm run capture:readme` | Regenerate the three README product captures with Playwright. |
| `npm run test:prompts` | Evaluate interviewer prompt and context composition tests. |
| `npm run setup:elevenlabs-agent` | Create or update the ElevenLabs Agent configuration from the provided script. |

## Project map

| Area | Responsibility |
| --- | --- |
| `src/hooks/usePoseTracking.ts` | Webcam sampling lifecycle and pose capture orchestration. |
| `src/utils/poseDetector.ts` | MoveNet initialization and posture signal derivation. |
| `src/utils/enhancedSpeech.ts` | Local recording and Web Audio feature extraction. |
| `src/utils/kelvLens.ts` | Reliability-aware coaching signal fusion. |
| `src/components/InterviewProcessing.tsx` | Session assembly and normalized result generation. |
| `src/utils/local-interview.ts` | Browser-local interview persistence and recovery. |
| `e2e/` | Playwright coverage for direct local access and README captures. |

## Boundaries

Kelv is a practice and reflection tool. Camera and microphone data are sensitive, so the active product keeps capture and persistence local to the browser whenever possible. Treat any feedback as coaching evidence for a human to interpret, not a measure of professional worth or a basis for employment decisions.
