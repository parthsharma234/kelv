# Kelv Backend Implementation Notes

## Latest Voice Runtime Update

The active live interview provider is now ElevenLabs, not Vapi. See `elevenlabs.md` for the full migration handoff, changed files, prompt/blueprint contracts, whiteboard tool contract, environment setup, and verification results.

Current active flow:

```text
VoiceInterviewSession
  -> useElevenLabsInterview
  -> ElevenLabs Conversation.startSession
  -> transcript, duration, postureData, recordingBlob, jobContext.blueprint, whiteboardRequests
  -> InterviewProcessing
  -> buildSessionResultV2
  -> savePlatformInterviewResult
```

## Summary

This backend pass added a typed, non-UI session pipeline around the current live interview flow.

The product still runs on the existing path:

1. ElevenLabs captures the live interview transcript.
2. `InterviewProcessing` computes transcript/posture metrics.
3. The new backend layer builds a canonical `SessionResultV2`.
4. Persistence stores the legacy payload plus V2 metadata for future UI and backend work.

No new paid CV or voice APIs were added.

## What Changed

### Canonical Session Contract

Added `src/types/sessionResult.ts`.

New exported contracts:

- `InterviewPromptContext`
- `QuestionEvaluation`
- `PracticePlan`
- `SignalReliability`
- `SessionResultV2`
- `SessionResultBuildInput`

`SessionResultV2` is now the backend-facing shape for completed interviews. It carries normalized transcript, timing, posture summary, per-question evaluations, adjusted scores, recommended drills, reliability metadata, and processing metadata.

### Prompt Architecture Backend

Added `src/utils/promptArchitecture.ts`.

This module builds a stable prompt context from role, industry, seniority, category, resume, and job description fields.

It includes:

- deterministic level normalization (`entry`, `mid`, `senior`, `executive`)
- category inference (`behavioral`, `technical`, `situational`, `leadership`, `communication`)
- session phase normalization
- system prompt builder for realistic interviewer behavior

This is ready for the Vapi prompt handoff. The UI does not need to own prompt decisions.

### Vapi Context Integration

Added `src/utils/interviewContext.ts`.

The live Vapi flow now derives interview context from the job description and resume before the call starts. It builds:

- role
- industry
- experience level
- interview category
- prompt context
- interviewer system prompt
- Vapi template variables

Updated `src/hooks/useVapiInterview.ts` to pass these values through `assistantOverrides.variableValues` and send the generated interviewer prompt as a runtime system message. This preserves the current Vapi + `.env` setup while making the interviewer more realistic and context-aware.

Updated `src/components/Platform/VapiInterviewSession.tsx` so completed sessions save the derived job context instead of hard-coding `Software Engineer`.

### Reliability-Aware Signal Layer

Added `src/utils/signalReliability.ts`.

This is the first implementation of the Kelv LENS idea from `features.md`: local reliability scoring for transcript, delivery, and presence signals.

It emits:

- `overall_confidence`
- `content_confidence`
- `delivery_confidence`
- `presence_confidence`
- reason flags such as `short_transcript`, `tracking_loss`, `speech_timing_missing`, `unstable_timing`
- scoring windows with confidence metadata

It also includes `applyReliabilityAdjustment`, which pulls scores toward a conservative baseline when the evidence is weak.

### Kelv LENS Voice/CV Fusion

Added `src/utils/kelvLens.ts`.

Kelv LENS means **Local Evidence-Normalized Signals**. It is the internal no-new-API signal system for voice and computer vision. It does not call Hume or any new paid provider.

Current LENS inputs:

- local recorded audio blob when available, analyzed with browser-side audio features
- transcript-derived WPM, fillers, pause score, articulation proxy, and tonal variety as fallback
- local posture/CV output from the existing MoveNet path, including sample count and sample coverage
- reliability flags from `signalReliability`

Current LENS outputs:

- `voice.pace_score`
- `voice.filler_control`
- `voice.pause_control`
- `voice.articulation_proxy`
- `voice.audio_source`
- `voice.clarity_score`
- `voice.fluency_score`
- `vision.posture_score`
- `vision.head_centering`
- `vision.visual_stability`
- `vision.sample_count`
- `vision.sample_coverage`
- `vision.tracking_loss_rate`
- `fused.delivery_presence_score`
- `fused.interview_readiness_signal`
- `fused.coaching_focus`
- `fused.reliability_weight`

`SessionResultV2.signal_fusion` now carries this object. Supabase/local persistence stores it as `signal_fusion` in session metadata.

Updated `src/components/Platform/InterviewProcessing.tsx` to analyze `recordingBlob` through `analyzeEnhancedVoiceMetrics` when a recording is present. If audio decoding fails, the enhanced speech analyzer falls back to transcript-derived voice metrics.

Updated `src/components/Platform/VapiInterviewSession.tsx` to preserve posture sample count and raw posture samples, so LENS can report CV coverage instead of treating posture as one aggregate score.

### Practice Plan Engine

Added `src/utils/practicePlan.ts`.

This converts weakest-question and session-level weaknesses into a concrete `PracticePlan`.

Example drill types:

- `delivery-control`
- `evidence-building`
- `answer-structure`
- `presence-reset`
- `pressure-recovery`
- `focused-answer-rewrite`

Each plan includes weak point, drill type, repetition target, completion criteria, source question, and priority.

Added `src/utils/practicePlanProgress.ts`.

This evaluates whether practice reps actually satisfy the recommended drill. Example pass conditions:

- delivery control: 110-160 WPM and 2 or fewer fillers
- evidence building: measurable outcome or content score above threshold
- answer structure: STAR structure or content score above threshold
- presence reset: posture above 75 and centered head position
- pressure recovery: framing sentence plus delivery score above threshold

This gives the UI agent a real progress model instead of a static checklist.

### Feedback Coaching System

Updated `src/utils/openAIFeedback.ts`.

The feedback generator now receives transcript pairs plus optional score context:

- overall metrics
- per-question analysis
- recommended practice plan
- Kelv LENS signal fusion

The prompt now forces:

- question-number references
- transcript-backed strengths
- prioritized critical improvements
- no invented achievements or fake metrics
- concrete suggested answer rewrites
- drill-style next steps with pass conditions

If OpenAI feedback fails, Kelv returns deterministic local coaching instead of leaving the user with an empty feedback state.

Updated `src/components/Platform/InterviewResults.tsx` to pass metrics, per-question analysis, practice plan, and LENS signals into feedback generation.

### Regression Harness

Added `src/utils/evaluationFixtures.ts` and `src/utils/benchmarkHarness.ts`.

The harness runs deterministic interview fixtures through the full scoring pipeline and checks score bands, reliability flags, required drill types, and LENS output presence.

### SessionResultV2 Adapter

Added `src/utils/sessionResultAdapter.ts`.

This module builds the canonical result from existing pipeline artifacts:

- transcript
- duration
- `InterviewMetrics`
- `PerQuestionAnalysis`
- posture data
- processing source

It also exposes `extractSessionResultV2` so saved records can be hydrated consistently from local storage or Supabase metadata.

### SessionResultV2 Validation

Added `src/utils/sessionResultValidation.ts`.

`buildSessionResultV2` now validates the canonical payload before returning it. `extractSessionResultV2` validates saved/hydrated V2 payloads and returns `null` for malformed historical records instead of passing corrupted data to the UI.

Validated fields include:

- transcript roles, content, and timestamps
- timing duration
- per-question score ranges
- overall score ranges
- reliability confidence ranges
- transcript vendor metadata
- processing metadata

## Pipeline Wiring

### Processing

Updated `src/components/Platform/InterviewProcessing.tsx`.

After existing analytics and per-question analysis run, the processing step now builds:

- `sessionResultV2`
- `practicePlan`
- `signalReliability`
- `signalFusion`

These are passed forward with the existing result payload.

### Persistence

Updated `src/utils/supabase-interview.ts`.

Local storage now keeps the full payload, including `sessionResultV2`.

Supabase `session_metadata` now includes:

- `practice_plan`
- `signal_reliability`
- `signal_fusion`
- `session_result_v2`

Saved history uses `sessionResultV2.overall_scores.overall` when available, falling back to legacy `metrics.overallScore`.

`getInterviewById` now hydrates:

- `practicePlan`
- `signalReliability`
- `sessionResultV2`

This gives the UI agent stable objects to render without reverse-engineering backend calculations.

## Data Flow

```text
VapiInterviewSession
  -> transcript, duration, postureData, jobContext
  -> buildVapiInterviewContext
  -> Vapi variableValues + runtime system prompt
  -> InterviewProcessing
  -> AnalyticsEngine.process
  -> PerQuestionAnalytics.process
  -> buildSessionResultV2
  -> savePlatformInterviewResult
  -> local storage + Supabase session_metadata
  -> getInterviewById
  -> UI can read legacy fields or sessionResultV2
```

## UI Agent Contract

The UI agent should prefer `sessionData.sessionResultV2` when present.

Important fields:

```ts
sessionData.sessionResultV2.overall_scores
sessionData.sessionResultV2.per_question_results
sessionData.sessionResultV2.recommended_drills
sessionData.sessionResultV2.signal_reliability
sessionData.sessionResultV2.signal_fusion
sessionData.practicePlan
sessionData.signalReliability
sessionData.signalFusion
```

Use `practicePlan[0]` or `sessionResultV2.recommended_drills[0]` for the main next-action surface.

Use `signalReliability.reason_flags` to explain limited confidence states without pretending the signal is stronger than it is.

Use `signalFusion.fused.coaching_focus` for the delivery/presence coaching card. Use `signalFusion.fused.interview_readiness_signal` as a compact readiness label.

### UI Rendering Priorities

The UI should present the data in this order of importance:

1. `sessionResultV2.overall_scores.overall` and the role-specific score breakdown.
2. `signalFusion.fused.interview_readiness_signal` plus `signalFusion.fused.coaching_focus`.
3. `practicePlan[0]` or `sessionResultV2.recommended_drills[0]` as the main next-action card.
4. `signalReliability.reason_flags` so weak-signal sessions are explained honestly.
5. `questionFeedback` for answer-by-answer coaching.

### Recommended UI Surfaces

The results screen should expose these panels or cards:

- `Overview`: overall score, role label, readiness signal, and session confidence.
- `Storyline`: per-question performance and weakest-question target.
- `Coach Synthesis`: the long-form feedback summary and top strengths/improvements.
- `Answer-by-Answer`: expandable cards using `questionFeedback`.
- `Next Practice`: the first drill from `practicePlan` with pass criteria.
- `Kelv LENS`: one compact section for voice and CV fusion metrics.
- `Signal Quality`: reason flags, sample coverage, and any fallback notes.

The UI should not invent new data models. It should map directly to existing contracts and only derive presentation state.

### UI Field Map

Use these fields directly:

```ts
sessionData.sessionResultV2.overall_scores.overall
sessionData.sessionResultV2.overall_scores.content
sessionData.sessionResultV2.overall_scores.delivery
sessionData.sessionResultV2.overall_scores.presence
sessionData.sessionResultV2.per_question_results
sessionData.sessionResultV2.recommended_drills
sessionData.sessionResultV2.signal_reliability
sessionData.sessionResultV2.signal_fusion
sessionData.practicePlan
sessionData.signalReliability
sessionData.signalFusion
sessionData.metrics
sessionData.perQuestionAnalysis
sessionData.jobContext
```

Preferred fallbacks:

- `practicePlan[0]` if the session V2 drill list is empty.
- `perQuestionAnalysis.weakestQuestion` if `questionFeedback` is unavailable.
- `signalFusion.fused.coaching_focus` if the long-form feedback has not loaded yet.
- `signalReliability.reason_flags` if the session score feels too strong for the evidence.

### UI Behavior Notes

- Keep the feedback tab visible even when the API call fails, using deterministic fallback coaching.
- Show `audio_source` so the user knows whether LENS used recording-backed audio or transcript fallback.
- Show `sample_coverage` and `tracking_loss_rate` in the presence section instead of a single posture score only.
- Treat `interview_readiness_signal` as a compact label, not a replacement for detailed scores.
- Surface `practicePlan` as a repeatable drill, not as a one-time recommendation.
- Preserve the current homepage assets and only update the dashboard/results surfaces that consume the new contracts.

## Tests Added

Added `src/utils/sessionResultAdapter.test.ts`.

Coverage:

- builds a canonical V2 session result
- includes per-question evaluations
- includes reliability metadata
- includes practice plan
- marks low-reliability sessions with reason flags

Added `src/utils/promptArchitecture.test.ts`.

Coverage:

- prompt context normalization
- category-specific interviewer prompt content
- deterministic defaults for category and seniority

Added `src/utils/interviewContext.test.ts`.

Coverage:

- derives role, industry, seniority, and category from JD/resume text
- produces Vapi-ready variables including `interviewer_system_prompt`
- falls back to stable defaults when documents are thin

Added `src/utils/sessionResultValidation.test.ts`.

Coverage:

- accepts complete `SessionResultV2` payloads
- rejects invalid scores and unsupported transcript vendors

Added `src/utils/kelvLens.test.ts`.

Coverage:

- fuses local voice and CV signals into readiness output
- uses recording-backed voice metrics when available
- flags missing CV signal without failing voice analysis

Added `src/utils/benchmarkHarness.test.ts`.

Coverage:

- runs deterministic fixtures through analytics, per-question scoring, V2 result generation, drills, and LENS

Added `src/utils/practicePlanProgress.test.ts`.

Coverage:

- marks drills complete only when enough reps satisfy pass criteria
- keeps drills in progress when reps miss criteria

Added `src/utils/openAIFeedback.test.ts`.

Coverage:

- verifies the feedback prompt requires evidence, no invented facts, and drill-oriented next steps
- verifies deterministic feedback produces usable coaching without an API response

## Verification

Commands run:

```bash
npm test
npm run build
```

Results:

- `npm test`: 10 test files passed, 21 tests passed.
- `npm run build`: passed.

Build warnings:

- Large JS chunk warning remains.
- Browserslist data is stale.

These warnings existed outside this backend implementation and do not block the new pipeline.

## Backend Follow-Up Order

1. Add a real self-hosted voice benchmark harness for Whisper/pyannote/VAD options.
2. Add prompt/scoring regression fixtures for common interview categories.
3. Build a non-UI drill completion tracker around `PracticePlan`.
4. Add database migration docs if Supabase schema needs first-class columns instead of `session_metadata` storage.
5. Revisit server-side LLM boundaries only if the project deployment plan changes.
