# Kelv Feature Backlog (Capstone-Full, Non-UI)

## 1. Objective and Boundaries

### Objective
`features.md` is the single implementation backlog for Kelv product, infrastructure, and research features.

### Boundaries
- This document excludes UI execution tasks.
- UI can appear only as a dependency note (example: `requires supporting UI surface`).
- Horizon is capstone-full, executed in phases: `P0 -> P1 -> P2`.
- This file does not replace `TODO.md`; it is the feature source of truth.
- CV and voice feature expansion should not introduce new paid third-party APIs.

### Assumptions and Defaults
- Active architecture baseline remains: Vapi for live interviewer, Supabase for auth/storage, transcript and posture driven analytics.
- Hume stays excluded from active roadmap and runtime.
- Production readiness is blocked until browser exposed LLM secrets are removed.
- CV default stack remains local/on-device: pose and face landmarks run in-client.
- Voice default stack for analysis remains local/self-hosted: feature extraction and diarization are open-source.

## 2. Current State Baseline (Implemented / Partial / Missing)

### Implemented
- Live interview flow with Vapi (`setup -> interview -> processing -> results`).
- Transcript and posture based processing pipeline.
- Per-question analytics and saved session retrieval path.
- Local plus Supabase persistence fallback for session history.

### Partial
- Prompt architecture is not fully category and phase driven.
- Scoring outputs are not schema locked end-to-end.
- Drill recommendations exist but are not tightly bound to weakest question and repeated gap patterns.
- Presence/CV coverage exists but stack is not formally consolidated to one supported path with reliability SLOs.
- Session contract exists in practice but not unified as a strict `SessionResultV2`.
- Voice metrics exist but are not yet validated against a paper-backed metric protocol.

### Missing
- Transcript/diarization benchmark gate with vendor decision record.
- Server side LLM boundary for scoring and feedback generation.
- Pre-mortem/checklist/reflection loop.
- Adaptive interviewer policy based on response quality feedback loop.
- Technical interview specialization tracks.
- Fairness/auditability workflow and counterfactual bias evaluation.
- Prompt/scoring regression harness with eval gates.
- A documented no-new-API protocol for CV and voice signal reliability.

## 3. Phased Feature Backlog (P0 / P1 / P2)

### Feature Entry Template
- `Feature ID`:
- `Problem`:
- `User Outcome`:
- `Current Status`: `implemented | partial | missing`
- `Acceptance Criteria`:
- `Dependencies`:
- `Source refs`:

### P0 (Shipping Foundation)

#### P0-F01: Prompt Architecture V2
- `Feature ID`: `P0-F01`
- `Problem`: Interviewer behavior is not consistently role-aware, category-aware, and phase-aware.
- `User Outcome`: Interview sessions feel realistic and context-aware across behavioral, technical, situational, leadership, and communication categories.
- `Current Status`: `partial`
- `Implementation note`: `buildInterviewPromptContext`, `buildInterviewerSystemPrompt`, and `buildVapiInterviewContext` now produce Vapi-ready prompt variables from JD/resume context.
- `Acceptance Criteria`:
  - Prompt spec defines global contract, category overlays, and session phase logic.
  - Runtime context includes role, industry, level, resume summary, JD summary, category, and phase.
  - At least 90% of audited follow-up turns reference prior candidate content instead of generic branching.
- `Dependencies`: `P0-F03`
- `Source refs`: `Resource #2`, `Resource #6`, `research_brief.md`, `TODO.md`

#### P0-F02: Structured Scoring Pipeline
- `Feature ID`: `P0-F02`
- `Problem`: Scoring and coaching are not schema-locked across per-question and session outputs.
- `User Outcome`: Every completed session returns consistent, machine-safe scoring and coaching payloads.
- `Current Status`: `partial`
- `Implementation note`: `SessionResultV2` now has runtime validation before processing output is returned and when saved records are hydrated.
- `Implementation note`: The feedback prompt now consumes scoring context, practice plans, and LENS signals; local deterministic coaching is used as a fallback if the API call fails.
- `Acceptance Criteria`:
  - Question and session outputs validate against explicit schemas before persistence.
  - Invalid model output triggers controlled retry and explicit error state (no silent partial save).
  - 95% or more completed sessions generate both per-question and session-level artifacts.
- `Dependencies`: `P0-F04`, `P0-F05`
- `Source refs`: `research_brief.md`, `ARCHITECTURE.md`, `TODO.md`

#### P0-F03: Open-Source Voice Stack Decision (Benchmark Gate)
- `Feature ID`: `P0-F03`
- `Problem`: Voice pipeline dependencies are split and not locked to a no-new-API strategy.
- `User Outcome`: Voice stack is selected by measured quality and reliability using only open-source/self-hosted components.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - Benchmark corpus and scoring protocol are defined and versioned (`WER`, diarization error proxy, latency, CPU/GPU cost).
  - Candidate stack is benchmarked: `faster-whisper or whisper.cpp` (ASR), `pyannote` (diarization), `VAD` layer (`rVAD` or statistical/neural baseline), optional denoise (`RNNoise`).
  - Decision record includes thresholds and fallback trigger rules for constrained hardware.
- `Dependencies`: none
- `Source refs`: `Resource #2`, `Resource #6`, `research_brief.md`, `Whisper arXiv 2212.04356`, `pyannote arXiv 1911.01255`, `rVAD arXiv 1906.03588`, `RNNoise arXiv 1709.08243`

#### P0-F04: Server-side LLM Boundary
- `Feature ID`: `P0-F04`
- `Problem`: Browser-exposed LLM key path is a production security blocker.
- `User Outcome`: User data and API credentials are handled through server-side execution only.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - No client code initializes LLM SDK with `dangerouslyAllowBrowser`.
  - Scoring/feedback requests route through authenticated server endpoint(s).
  - Secret scanning/build checks show zero browser-exposed LLM credentials.
- `Dependencies`: none
- `Source refs`: `ARCHITECTURE.md`, `TODO.md`, `research_brief.md`

#### P0-F05: Unified SessionResultV2 Contract
- `Feature ID`: `P0-F05`
- `Problem`: Processing, save/load, and results rely on loosely-coupled shapes and ad-hoc hydration.
- `User Outcome`: Session data is consistent across pipeline stages and history replay.
- `Current Status`: `partial`
- `Acceptance Criteria`:
  - `SessionResultV2` is the canonical contract across processing, persistence, and results rendering.
  - Legacy session adapter maps older payloads into V2 deterministically.
  - Save-load roundtrip tests pass for transcript, timing, posture, per-question data, and practice plan.
- `Dependencies`: `P0-F02`
- `Source refs`: `ARCHITECTURE.md`, `TODO.md`

#### P0-F06: Targeted Drill Prescription Engine
- `Feature ID`: `P0-F06`
- `Problem`: Next-step coaching is not fully tied to weakest question and repeated failure patterns.
- `User Outcome`: Users get one concrete, high-leverage next rep after each session.
- `Current Status`: `partial`
- `Acceptance Criteria`:
  - Every session outputs `weakest_question_id`, `primary_gap`, and `next_rep`.
  - Repeated gap detection uses trailing session window and updates practice plan priority.
  - Practice plan persists with session record and can be fetched in history context.
- `Dependencies`: `P0-F02`, `P0-F05`
- `Source refs`: `Resource #3`, `Resource #4`, `TODO.md`, `research_brief.md`

#### P0-F07: CV Stack Consolidation for Presence
- `Feature ID`: `P0-F07`
- `Problem`: Presence scoring relies on posture signals without one formally supported CV path and reliability target.
- `User Outcome`: Presence metrics are stable, explainable, and degrade gracefully when camera data is unavailable.
- `Current Status`: `partial`
- `Acceptance Criteria`:
  - One supported CV pipeline is documented as source of truth (`BlazePose` for body landmarks, `Face Mesh` for head and face stability cues).
  - Capture reliability metrics are recorded (`init success`, `sample coverage`, `fallback rate`).
  - When camera/posture unavailable, explicit fallback path is used and labeled in results metadata.
- `Dependencies`: `P0-F05`
- `Source refs`: `Resource #4`, `Resource #6`, `ARCHITECTURE.md`, `BlazePose arXiv 2006.10204`, `Face Mesh arXiv 1907.06724`

#### P0-F08: Kelv LENS v1 (Local Evidence and Neural Signals)
- `Feature ID`: `P0-F08`
- `Problem`: CV and voice signals are computed independently and can overreact to noisy frames/chunks.
- `User Outcome`: Users get reliability-aware feedback that is stable and actionable under real interview conditions.
- `Current Status`: `partial`
- `Implementation note`: `buildKelvLensSignals` now fuses recording-backed audio metrics when available, transcript-derived voice fallbacks, local posture/CV sample coverage, tracking-loss diagnostics, and reliability flags into `SessionResultV2.signal_fusion`.
- `Acceptance Criteria`:
  - Introduce reliability-weighted fusion for each scoring window (`content`, `delivery`, `presence`).
  - Emit per-window confidence score and reason flags (`low_light`, `mic_noise`, `short_utterance`, `tracking_loss`).
  - Final session scores must include both raw metric values and reliability-adjusted values.
- `Dependencies`: `P0-F03`, `P0-F05`, `P0-F07`
- `Source refs`: `Resource #1`, `Resource #4`, `Resource #5`, `Resource #6`

### P1 (Capability Expansion)

#### P1-F01: Pre-mortem, Checklist, Reflection Loop
- `Feature ID`: `P1-F01`
- `Problem`: Sessions end at scoring instead of preparing users for known failure scenarios.
- `User Outcome`: Users leave each session with failure-prevention checklist and reflection prompt.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - Output includes pre-mortem risk list, checklist, and reflection prompt per session.
  - Checklist items map directly to identified weak-point categories.
  - Completion markers can be tied to subsequent session outcomes.
- `Dependencies`: `P0-F02`, `P0-F06`
- `Source refs`: `Resource #3`, `research_brief.md`

#### P1-F02: Adaptive Interviewer Policy
- `Feature ID`: `P1-F02`
- `Problem`: Interview difficulty/follow-up depth does not fully adapt to candidate profile and live answer quality.
- `User Outcome`: Interview path adjusts in real time based on observed performance.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - Runtime policy adjusts follow-up type and challenge level from profile and recent answer quality.
  - Adaptive decisions are logged in session metadata for auditability.
  - Manual replay of sample transcripts reproduces deterministic policy branches.
- `Dependencies`: `P0-F01`, `P0-F05`
- `Source refs`: `Resource #2`, `Resource #6`, `PHASE_2_SUMMARY.md`

#### P1-F03: Speech Coaching Expansion
- `Feature ID`: `P1-F03`
- `Problem`: Delivery coaching is useful but not comprehensive for pacing, vocal variety, and warm-up carryover.
- `User Outcome`: Users receive concrete speaking guidance linked to measurable delivery signals.
- `Current Status`: `partial`
- `Acceptance Criteria`:
  - Delivery analysis includes pacing variability, filler density, vocal variety, and pitch stability.
  - Speech feature extraction protocol is standardized to `openSMILE` style descriptors and `eGeMAPS`-aligned aggregates.
  - Warm-up completion state can be correlated with delivery outcomes in session metadata.
  - Speech coaching recommendations are generated per-question and session-level.
- `Dependencies`: `P0-F02`, `P0-F05`
- `Source refs`: `Resource #5`, `PHASE_2_SUMMARY.md`, `research_brief.md`, `openSMILE MM 2010`, `GeMAPS/eGeMAPS IEEE 2015`

#### P1-F04: Technical Interview Specialization
- `Feature ID`: `P1-F04`
- `Problem`: Technical interviews need role-aware specialization beyond generic question handling.
- `User Outcome`: Technical candidates practice category-appropriate scenarios and are scored on technical criteria.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - Role tracks define question families and scoring rubrics (example: SWE backend, PM technical, data roles).
  - Technical scoring includes tradeoffs, correctness framing, and system constraints where applicable.
  - Practice plans can target technical sub-skills.
- `Dependencies`: `P0-F01`, `P0-F02`, `P1-F02`
- `Source refs`: `Resource #2`, `Resource #6`, `research_brief.md`

### P2 (Trust and Governance)

#### P2-F01: Fairness and Auditability Layer
- `Feature ID`: `P2-F01`
- `Problem`: Score changes are not fully traceable and fairness checks are not explicit.
- `User Outcome`: Scoring rationale is inspectable and bias-sensitive checks are part of pipeline governance.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - Every session stores score rationale artifacts linked to metric components.
  - Bias-sensitive variance checks run on protected-attribute proxy slices where legally/ethically applicable.
  - Audit record schema is persisted with threshold outcomes.
- `Dependencies`: `P0-F02`, `P0-F05`
- `Source refs`: `Resource #7`, `research_brief.md`

#### P2-F02: Counterfactual Bias Evaluation Workflow
- `Feature ID`: `P2-F02`
- `Problem`: Model behavior under protected-attribute perturbation is not measured.
- `User Outcome`: Team can quantify whether outcomes drift due to sensitive attribute changes.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - Counterfactual test set and perturbation method are defined.
  - Evaluation reports include trait/score deltas under controlled counterfactual changes.
  - Release gate fails if fairness thresholds are exceeded.
- `Dependencies`: `P2-F01`
- `Source refs`: `Resource #7`

#### P2-F03: Prompt and Scoring Regression Harness
- `Feature ID`: `P2-F03`
- `Problem`: Prompt/scoring edits can regress realism and reliability without controlled evals.
- `User Outcome`: Prompt and scoring updates ship only when eval suites pass.
- `Current Status`: `missing`
- `Acceptance Criteria`:
  - Eval suites cover prompt realism, scoring consistency, and drill recommendation quality.
  - CI or release pipeline enforces pass thresholds before deployment.
  - Eval history is retained for trend analysis across prompt/scoring versions.
- `Dependencies`: `P0-F01`, `P0-F02`
- `Source refs`: `research_brief.md`, `TODO.md`

## 4. Planned Interfaces and Data Contracts

```ts
export interface InterviewPromptContext {
  role: string;
  industry: string;
  level: 'entry' | 'mid' | 'senior' | 'executive';
  category: 'behavioral' | 'technical' | 'situational' | 'leadership' | 'communication';
  resume_summary: string;
  jd_summary: string;
  session_phase: 'opening' | 'calibration' | 'core' | 'pressure' | 'candidate_questions' | 'close';
}
```

```ts
export interface QuestionEvaluation {
  question_id: string;
  category: string;
  content_score: number;   // 0-100
  delivery_score: number;  // 0-100
  presence_score: number;  // 0-100
  evidence_gaps: string[];
  next_rep: string;
}
```

```ts
export interface PracticePlan {
  weak_point: string;
  drill_type: string;
  repetition_target: number;
  completion_criteria: string;
}
```

```ts
export interface SessionResultV2 {
  transcript: Array<{
    role: 'assistant' | 'user' | 'system';
    content: string;
    timestamp: string;
  }>;
  timing: {
    duration_sec: number;
    speaking_rate_wpm?: number;
    filler_word_count?: number;
    hesitation_index?: number;
  };
  posture_summary?: {
    sample_count: number;
    overall_score: number;
    shoulder_alignment: number;
    head_position: 'centered' | 'forward' | 'tilted';
    time_in_good_posture: number;
  };
  per_question_results: QuestionEvaluation[];
  overall_scores: {
    content: number;
    delivery: number;
    presence: number;
    overall: number;
  };
  recommended_drills: PracticePlan[];
  processing_metadata: {
    pipeline_version: string;
    transcript_vendor: 'openai' | 'self_hosted_whisper' | 'hybrid';
    used_fallback: boolean;
    reliability_flags: string[];
  };
}
```

```ts
export interface FairnessAuditRecord {
  score_rationale: string[];
  protected_attribute_checks: Array<{
    attribute: string;
    cohort_a: string;
    cohort_b: string;
    delta: number;
  }>;
  variance_thresholds: {
    warning: number;
    fail: number;
  };
}
```

## 5. Source Traceability Matrix (#1-#7)

| Resource | Core finding | Backlog mapping |
|---|---|---|
| #1 | Identity vs reputation gap in interview performance | `P0-F01`, `P0-F02`, `P0-F06` |
| #2 | Realistic AI interviewer, adaptive flow, technical prep effectiveness | `P0-F01`, `P0-F03`, `P1-F02`, `P1-F04` |
| #3 | Pre-mortem and failure prevention improve stress performance | `P0-F06`, `P1-F01` |
| #4 | Multimodal analysis, per-question feedback, confidence and behavior analytics | `P0-F02`, `P0-F07`, `P1-F03` |
| #5 | Speaking quality framework (pace, fillers, vocal delivery) matters | `P1-F03`, `P0-F02` |
| #6 | Adaptive multimodal interview analysis with profile context | `P0-F01`, `P0-F03`, `P1-F02`, `P1-F04` |
| #7 | Bias and transparency risks in AI video interview systems | `P2-F01`, `P2-F02`, `P2-F03` |

### Paper Anchors for CV and Voice (No-New-API Direction)
- `BlazePose`: https://arxiv.org/abs/2006.10204
- `Face Mesh`: https://arxiv.org/abs/1907.06724
- `Whisper`: https://arxiv.org/abs/2212.04356
- `pyannote.audio diarization`: https://arxiv.org/abs/1911.01255
- `RNNoise hybrid DSP + DL denoise`: https://arxiv.org/abs/1709.08243
- `rVAD`: https://arxiv.org/abs/1906.03588
- `CREPE pitch tracking`: https://arxiv.org/abs/1802.06182
- `GeMAPS/eGeMAPS`: https://ieeexplore.ieee.org/document/7160715
- `openSMILE`: https://mediatum.ub.tum.de/doc/1082431/file.pdf

## 6. Dependency Order and Milestones

### Execution Order (No Missing Prerequisites)
1. `M0`: `P0-F03` transcript benchmark gate and vendor decision.
2. `M1`: `P0-F04` server-side boundary for LLM calls.
3. `M2`: `P0-F05` `SessionResultV2` contract and adapters.
4. `M3`: `P0-F01` prompt architecture v2 with context contract.
5. `M4`: `P0-F02` structured scoring pipeline.
6. `M5`: `P0-F06` targeted drill prescription.
7. `M6`: `P0-F07` CV consolidation and reliability instrumentation.
8. `M7`: `P0-F08` reliability-weighted fusion (`Kelv LENS v1`).
9. `M8`: P1 feature group in sequence (`F01 -> F02 -> F03 -> F04`).
10. `M9`: P2 governance group in sequence (`F01 -> F02 -> F03`).

### Test Plan

#### Document Quality Checks
- Every Professional Resource (#1 to #7) maps to at least one feature.
- Every feature includes measurable acceptance criteria.
- No UI execution tasks appear in backlog items.
- No duplicate feature IDs across phases.

#### Backlog Correctness Checks
- P0 dependencies are executable in listed order without unresolved contracts.
- Security blockers are explicit and marked as production gates.
- Prompt and scoring work includes eval gate requirements before release.

#### Consistency Checks Against Current Repo State
- Hume remains excluded from active feature roadmap.
- Vapi plus transcript/posture baseline remains default until benchmarked decision changes it.
- Existing architecture assumptions align with `ARCHITECTURE.md`.

## 7. Definition of Done by Phase

### P0 Done
- `P0-F01` through `P0-F08` are complete and acceptance criteria pass.
- Browser-exposed LLM key path is removed.
- `SessionResultV2` is used end-to-end for new sessions.
- Every completed session yields deterministic next drill prescription.
- CV and voice scoring additions use no new paid external APIs.

### P1 Done
- Users receive pre-mortem, checklist, and reflection outputs.
- Interviewer adapts difficulty and follow-up behavior using live performance signals.
- Delivery coaching includes expanded speech metrics and recommendation logic.
- Technical specialization tracks are active with role-aware scoring.

### P2 Done
- Fairness/audit records are generated for scored sessions under configured policy.
- Counterfactual bias workflow runs and enforces configured thresholds.
- Prompt/scoring regression harness gates releases with stored evaluation history.
