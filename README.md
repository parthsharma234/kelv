<p align="center"><img src="./public/logo.svg" width="88" alt="Kelv red panda logo" /></p>

<h1 align="center">Kelv AI</h1>

<p align="center"><strong>A browser-first interview practice system that turns a live conversation into question-level feedback on content, delivery, and posture.</strong></p>

<p align="center"><a href="https://www.youtube.com/watch?v=sv-mgria_6Q"><strong>Watch demo</strong></a> &middot; <a href="#run"><strong>Run locally</strong></a> &middot; <a href="#how-it-works"><strong>How it works</strong></a></p>

> Kelv started as a senior-year capstone built by my friends and me. Before we started thinking about open source, it had roughly **300 people on the waitlist**.

## What it is

Interview prep usually gives you a question list or generic feedback after the fact. We wanted to make the practice session itself useful: run a real conversation, keep the evidence attached to each answer, and show the person exactly what to work on next.

- ElevenLabs Agents handles the live interviewer.
- The browser captures webcam and microphone input with user permission.
- Kelv builds a local `SessionResultV2` with per-question scores, supporting signals, and a practical next rep.

## Product

### Dashboard

`/platform` is deliberately open in local mode. There is no hosted login, Supabase project, or row-level-security setup required to try the product.

<img src="./public/readme-dashboard.png" alt="Kelv local interview dashboard" width="100%" />

### Setup

Before the interview, the user adds job context and grants camera/microphone access. The same browser session owns the capture stream and the local recovery state.

<img src="./public/readme-presession.png" alt="Kelv pre-session setup" width="100%" />

### Review

The review keeps the question, answer, signal quality, and coaching together. That makes a weak score debuggable instead of feeling like a black-box verdict.

<img src="./public/readme-results.png" alt="Kelv interview review" width="100%" />

## How it works

```mermaid
flowchart LR
  User[Candidate] --> App[Kelv browser app]
  App <-->|live conversation events| Agent[ElevenLabs Agent]

  subgraph Local[Local browser boundary]
    Camera[getUserMedia camera] --> Pose[MoveNet pose inference]
    Mic[getUserMedia microphone] --> Audio[WebM recording + Web Audio]
    AgentEvents[Agent transcript events] --> Ledger[Question and answer ledger]
    Pose --> Lens[Kelv LENS]
    Audio --> Lens
    Ledger --> Lens
    Lens --> Result[SessionResultV2]
    Result --> Store[localStorage]
  end
  App --> Camera
  App --> Mic
  App --> AgentEvents
```

**Why browser-first:** interview video and audio are personal, and a capstone did not need a database to prove the feedback loop. The tradeoff is intentional: saved sessions stay in the browser profile that created them instead of following the user across devices.

## Vision

```mermaid
sequenceDiagram
  participant Camera as Webcam stream
  participant MoveNet as MoveNet on WebGL
  participant Sampler as Pose sampler
  participant LENS as Kelv LENS

  Camera->>MoveNet: sampled video frame
  MoveNet->>Sampler: 17 keypoints plus confidence
  Sampler->>Sampler: shoulder angle, head offset, torso lean
  Sampler->>LENS: timestamped posture sample
  LENS->>LENS: down-weight weak or missing capture
  LENS-->>LENS: attach posture evidence to coaching
```

- The active path uses TensorFlow.js, WebGL, and MoveNet SinglePose Lightning; it does not send frames to a video-analysis service.
- `usePoseTracking` and `poseDetector` turn landmarks into simple geometry, then carry detector confidence forward with each sample.
- We chose pose geometry over face or emotion labels because the feedback is easier to inspect: shoulders, head position, torso stability, and how reliable the capture was.

## Voice

```mermaid
flowchart TB
  Recording[Local WebM recording] --> Features[Web Audio feature pass]
  Transcript[ElevenLabs transcript events] --> Boundaries[Question and answer boundaries]
  Features --> Window[Answer-level time window]
  Boundaries --> Window
  Window --> Delivery[pace, pauses, fillers, RMS, pitch, spectral features]
  Delivery --> Coaching[question-level delivery coaching]
```

- Audio alone cannot tell us which answer a pause belongs to; the transcript alone cannot tell us how it was delivered. The answer window is where those two streams meet.
- The feature pass includes speaking pace, silence/pause structure, filler language, RMS energy, pitch contour, and spectral measurements when a recording is available.
- ElevenLabs provides the conversation and transcript events. The recording-backed analysis stays in the browser after the session.

## Scoring

`Kelv LENS` is a reliability-aware fusion step, not a model that guesses whether somebody is employable.

- It aligns content, voice, and posture evidence to a question/answer pair.
- It records weak capture conditions instead of treating every signal as equally trustworthy.
- It returns scores with the evidence that produced them, then picks one concrete practice target for the next session.

## Future plans

We had a few things we wanted to try but could not fit into the capstone timeline.

- **More camera angles.** The idea was to pair the laptop camera with two external cameras, compare pose landmarks across views, and use cross-view confidence to reduce occlusion problems.
- **Better audio.** We also wanted to test an external or spectral microphone. Cleaner source audio would make prosody and spectral measurements more stable than a laptop mic can make them.
- **Face and eye prototypes.** There is exploratory code in the repo, but it is not in the active scoring path. We would only bring it back if it produced specific, explainable coaching—not a vague emotion label.

## Run

**You need:** Node.js 20+, a Chromium-based browser, and an ElevenLabs Agent ID for live voice interviews.

```bash
npm install
cp .env.example .env
# add VITE_ELEVENLABS_AGENT_ID to .env
npm run dev
```

Open `http://localhost:5173/platform`.

| Command | Use |
| --- | --- |
| `npm run dev` | Start the local platform. |
| `npm test` | Run unit tests. |
| `npm run test:e2e` | Run browser tests. |
| `npm run capture:readme` | Regenerate README screenshots. |
| `npm run test:prompts` | Test prompt and context composition. |
| `npm run setup:elevenlabs-agent` | Set up the ElevenLabs Agent. |
