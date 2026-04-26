# Kelv Research Brief

## Runtime Validation

I ran the live app locally and validated the real gated path with the provided account.

What I confirmed:

- Homepage loads at `http://127.0.0.1:4173/`.
- Protected route redirects correctly when unauthenticated.
- The provided account is valid and `is_platform_enabled` is `true`.
- The authenticated user reaches the real dashboard.
- The dashboard launches the live interview setup flow.

Current blocker to a true end-to-end mock interview in this environment:

- The setup screen reaches `VapiInterviewSession`, but the launch button stays disabled at `Waiting for Media...`.
- In this automation environment, camera and microphone access are not being granted, so I cannot complete a real live call from here.

Meaning:

- Auth, routing, dashboard access, and session setup are working.
- A full live interview, processing pass, and results pass still need one real browser session with camera/mic access on your machine.

## What The Sources Actually Demand

### Professional Resource #1

Core idea:

- Candidates have an identity gap: how they think they came across is not how interviewers actually experienced them.

Platform implication:

- Kelv should show "intended signal" vs "observed signal."
- Results should explicitly tell users where confidence, clarity, or assertiveness dropped.

### Professional Resource #2

Core idea:

- AI interviews should feel realistic, role-aware, and adaptive, including technical modes.

Platform implication:

- The interviewer must stop feeling generic.
- Question flow needs category overlays and conditional follow-ups.
- Technical, behavioral, and situational modes need distinct prompt behavior.

### Professional Resource #3

Core idea:

- Pre-mortems, checklists, and reflection loops reduce failure.

Platform implication:

- Kelv should not end at "here is your score."
- Every session should produce:
  - what likely failed
  - a short pre-next-interview checklist
  - a specific reflection prompt

### Professional Resource #4

Core idea:

- Per-question analytics are more useful than one blended score.

Platform implication:

- Strongest answer, weakest answer, and repeated failure patterns need to stay central.
- Ideal-answer comparison should keep growing, especially by interview category.

### Professional Resource #5

Core idea:

- Speaking habits matter: filler words, pacing, vocal energy, and warmth all influence perceived credibility.

Platform implication:

- Kelv needs a stronger speech layer than transcript-only scoring.
- Warm-up, delivery drills, and speaking diagnostics are product-critical, not optional.

### Professional Resource #6

Core idea:

- Better interview systems adapt by profile, role, and response quality.

Platform implication:

- The interviewer should change difficulty, follow-up depth, and pressure based on what the candidate just said.
- Resume and JD context should drive the conversation much harder.

### Professional Resource #7

Core idea:

- Interview scoring needs fairness, transparency, and auditability.

Platform implication:

- Kelv should explain why a score moved.
- Hidden vibe-based grading is a risk.
- Fairness checks belong in the eval pipeline, not just in marketing copy.

## Recommended Technology Direction

## P0 Architecture Decision

Keep this shape:

- Live interviewer: Vapi
- Transcript/scoring/orchestration: OpenAI
- Optional transcript-specialist fallback: AssemblyAI or Deepgram
- Storage and auth: Supabase
- UI coaching layer: existing React app

Do not re-expand the stack unless a feature clearly requires it.

### 1. Live Interview Orchestration

Recommendation:

- Keep Vapi as the live interviewer runtime.

Why:

- Vapi already supports dynamic variables in prompts via `{{variableName}}`, and variable values are passed at call start.
- Vapi also supports workflows for structured conversational routing.
- Vapi knowledge bases can attach resume, JD, and role context through query tools.

What this means for Kelv:

- Resume, JD, role, seniority, interview category, company type, and target rubric should all be injected as variables.
- The interviewer should use workflows for phase transitions:
  - intro
  - warm-up
  - core questions
  - pressure follow-up
  - candidate questions
  - close

Sources:

- Vapi Variables: https://docs.vapi.ai/assistants/dynamic-variables
- Vapi Prompting Guide: https://docs.vapi.ai/prompting-guide
- Vapi Workflows: https://docs.vapi.ai/workflows/quickstart
- Vapi Knowledge Base: https://docs.vapi.ai/knowledge-base

### 2. Structured Scoring And Coaching

Recommendation:

- Use OpenAI Responses API with Structured Outputs for every scored artifact.

Why:

- Kelv should not depend on freeform LLM text for core analytics.
- Structured Outputs let the model return strict JSON-shaped coaching objects.
- That is the right fit for:
  - per-question scoring
  - strengths and weaknesses
  - drill prescriptions
  - reflection prompts
  - category-specific rubrics

What this means for Kelv:

- Every interview result should be schema-locked.
- Parallel tool calls should stay off for schema-critical outputs.
- Scoring and recommendation pipelines should be separated into smaller structured steps, not one giant prompt.

Sources:

- OpenAI Structured Outputs: https://openai.com/index/introducing-structured-outputs-in-the-api/
- OpenAI Responses API: https://platform.openai.com/docs/guides/migrate-to-responses

### 3. Transcript And Speaker Separation

Recommendation:

- First choice: test `gpt-4o-transcribe-diarize`.
- If disfluencies and overlap quality are not good enough, benchmark AssemblyAI next.
- If utterance segmentation and live conversational chunking become the bottleneck, benchmark Deepgram next.

Why:

- OpenAI now offers a transcription model with built-in speaker diarization.
- AssemblyAI explicitly supports:
  - speaker diarization
  - utterances
  - disfluencies
  - crosstalk labeling
- Deepgram explicitly supports:
  - utterances
  - diarization
  - punctuation
  - strong segment-level timing

Recommended practical order:

1. Try OpenAI first because it reduces vendor count.
2. If speech realism features are missing, test AssemblyAI for high-fidelity behavioral delivery analysis.
3. If segmentation speed/turn handling is the issue, test Deepgram.

Sources:

- OpenAI `gpt-4o-transcribe-diarize`: https://platform.openai.com/docs/models/gpt-4o-transcribe-diarize
- AssemblyAI Speaker Diarization: https://www.assemblyai.com/docs/pre-recorded-audio/label-speakers
- AssemblyAI Prompting / Disfluencies: https://www.assemblyai.com/docs/pre-recorded-audio/universal-3-pro/prompting
- Deepgram Utterances: https://developers.deepgram.com/docs/utterances

### 4. Evaluation And Regression Control

Recommendation:

- Use OpenAI Evals for prompt and scoring regression tests before changing interviewer behavior.

Why:

- Kelv is moving toward multiple categories and more realistic prompts.
- That will drift unless every change is evaluated.

Kelv should evaluate:

- behavioral follow-up quality
- technical question realism
- weak-answer detection consistency
- fairness-sensitive outputs
- drill recommendation quality
- tone realism

Sources:

- OpenAI Evals API: https://platform.openai.com/docs/api-reference/evals
- OpenAI Evals Guide: https://platform.openai.com/docs/guides/evals

## Interviewer Prompt Architecture

Kelv should not have one flat interviewer prompt.

It should have:

### Layer 1: Global Interviewer Contract

This defines universal behavior:

- sound like a real interviewer, not a tutor
- do not over-praise weak answers
- ask one question at a time
- interrupt only when realistic
- challenge vague claims
- ask for proof, metrics, ownership, tradeoffs, and outcomes
- vary phrasing naturally
- avoid robotic affirmations
- avoid "great job" unless earned
- stay concise

### Layer 2: Interview Category Overlay

Each category should have its own behavior module.

Behavioral:

- force STAR depth
- probe ownership vs team contribution
- ask for measurable outcome

Technical:

- ask clarifying questions
- pressure on tradeoffs, complexity, failure handling
- escalate from basic correctness to system thinking

System design:

- push scale, constraints, bottlenecks, tradeoffs, recovery, security

Situational:

- force judgment under ambiguity
- ask what they would do first, not just abstract theory

Leadership:

- probe influence, conflict, accountability, escalation, hiring, performance

Culture / fit:

- test motivation, values, and working style without becoming soft or fluffy

### Layer 3: Resume + JD Context

The prompt should know:

- candidate background
- target role
- target industry
- company stage
- expected seniority
- likely interview category weighting

This layer should be injected dynamically through Vapi variables and knowledge retrieval.

### Layer 4: Session Phase Logic

Kelv should move through phases intentionally:

1. Short human opening
2. One easier calibration question
3. Core category questions
4. Pressure follow-up based on actual answer weakness
5. Candidate questions
6. Close

### Layer 5: Scoring Prompt Separate From Interviewer Prompt

Do not let the live interviewer also be the full evaluator.

The evaluator should separately score:

- answer relevance
- structure
- evidence
- clarity
- concision
- delivery
- posture/presence
- category-specific competence

## Realism Requirements

To make Kelv feel more real:

- The interviewer must reference the candidate's actual background.
- Follow-ups must depend on what the user just said, not generic branching.
- Silence handling should feel human:
  - brief pause
  - short challenge
  - "take a moment if you need it"
- Technical prompts should include tradeoffs and constraints.
- Behavioral prompts should force ownership and metrics.
- The interviewer should occasionally push back:
  - "What specifically did you own there?"
  - "How did you measure that?"
  - "What would you do differently now?"

## UI Direction

The homepage is already closer to the right tone than the platform internals.

What needs to change:

### Remove emoji-coded feedback

Current emoji-heavy remnants still exist in:

- `src/components/Platform/InterviewTimeline.tsx`
- `src/utils/recommendations.ts`

That language makes the platform feel less serious and more template-like.

Replace with:

- real icon system
- typography hierarchy
- restrained color coding
- sharper labels

### Make the product voice more distinctive

Kelv should sound like:

- precise
- slightly hard-edged
- performance-focused
- recruiter-adjacent

Not like:

- a motivational coach
- a productivity app
- a generic AI assistant

### Homepage direction

Keep:

- tension
- contrast
- proof-oriented messaging

Change:

- remove decorative or playful icon language
- reduce anything that feels startup-template-ish
- push a more editorial, sharper visual identity

### Platform direction

The dashboard and results pages should feel like an interview command center.

That means:

- fewer soft "AI helper" phrases
- more direct labels like:
  - weak point
  - proof gap
  - delivery issue
  - strongest answer
  - next drill

## What To Integrate Next

### P0

- category-specific interviewer prompts
- structured scoring outputs
- transcript vendor decision
- eval harness for prompt quality
- emoji removal across the platform

### P1

- pre-mortem and checklist modules
- reflection loop after every session
- stronger per-question ideal-answer comparison
- adaptive difficulty and follow-up depth

### P2

- fairness and audit layer
- technical interview specialization
- named speaker logic and better overlap handling

## Immediate Recommendation

If the next move is product quality rather than code cleanup, the order should be:

1. Finalize the interviewer prompt architecture.
2. Choose the transcript/speaker stack.
3. Build evals before expanding categories.
4. Remove emoji-coded product language everywhere.
5. Rework the dashboard and homepage voice to feel sharper and more singular.

## Documents To Remove

These are the most obviously stale after the Hume removal and repeated redesign passes:

- `HUME_SETUP.md`
- `MIGRATION_SUMMARY.md`
- `FIXES_APPLIED.md`
- `PLATFORM_REDESIGN_COMPLETE.md`
- `UI_REDESIGN_COMPLETE.md`
- `SLEEK_REDESIGN_FINAL.md`

## Constraint For The Next Build Pass

Do not widen the product by adding random AI features.

Every new feature should make Kelv better at one of these:

- realism
- diagnosis
- drill prescription
- repeat practice
