# Kelv Active Architecture

## Shipped flow

Kelv now ships on a single active path:

1. `PlatformDashboard` launches the ElevenLabs interview flow.
2. `VoiceInterviewSession` collects transcript, duration, posture samples, local recording, and whiteboard tool requests.
3. `InterviewProcessing` builds:
   - overall interview metrics
   - per-question analysis
   - a normalized saved result payload
4. `InterviewResults` renders transcript-backed coaching and saved history can reopen the same payload later.

## Hume removal

Hume is no longer part of the active shipped flow.

What replaced it:

- Content scoring: transcript structure, specificity, and quantified impact.
- Delivery scoring: transcript timing, filler words, cadence proxy, and hesitation proxy.
- Presence scoring: posture samples when available, otherwise limited timing-based fallback.

The old Hume/realtime interview files were removed from the active codebase.

## ElevenLabs voice runtime

ElevenLabs is now the active live interviewer runtime.

What it owns:

- realtime agent conversation
- user and agent transcript events
- first interviewer message
- runtime prompt override
- client-tool calls for whiteboard surfaces

What remains local:

- Kelv LENS audio/posture analysis
- recording capture for local voice metrics
- per-question scoring
- session result normalization
- Supabase/local persistence

## Saved session contract

Saved platform sessions now persist:

- transcript
- duration
- metrics
- per-question analysis
- posture data
- job context
- processing source
- voice provider
- whiteboard requests

Local storage keys:

- `kelv-interview-history`
- `kelv-platform-results`

Supabase writes are attempted when configured, but local storage remains the fallback source of truth for reopening platform sessions on the same machine.

## Current risk

`openAIFeedback.ts` still uses a browser-exposed API key path.

That is acceptable for demo use only.
It is not acceptable for production.

The required next step is to move feedback generation behind a server boundary and remove browser-side secret usage.
