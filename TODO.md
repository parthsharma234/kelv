# Kelv AI Shipping Plan

## Objective

Finish the product loop today.

Kelv should let a user:

1. Set up an interview.
2. Run the interview live.
3. Process the session without Hume.
4. See useful results and next-step coaching.
5. Return to a dashboard that feels intentional, not generic.

## Non-Negotiables

- Hume is no longer allowed in the active product path.
- We ship the strongest version of the current product, not a wider product.
- Dashboard UI must stop looking like a default AI/SaaS template.
- Existing user edits in the repo are preserved while we clean up around them.

## Product Decision

### Replace Hume now

Current reality:

- The live interview flow already centers on Vapi.
- Post-processing still depends on Hume batch.
- Some old realtime Hume code still exists in the codebase.

Same-day decision:

- Remove Hume from the shipped path.
- Use transcript-driven analytics plus the metrics we already control.
- Keep posture, pacing, filler-word, transcript, rubric, and coaching layers.
- Defer any emotion-analysis replacement until after the core loop is stable.

Immediate replacement approach:

- Source of truth for content feedback: interview transcript.
- Source of truth for delivery feedback: speaking-rate, pauses, filler words, interruptions, posture snapshots, session timing.
- Source of truth for coaching: OpenAI-generated recommendations from transcript + structured metrics.

## Today Plan

### Step 1 - Freeze scope

Deliverable:

- One clear shipped flow: setup -> interview -> processing -> results -> history.

Tasks:

- Cut anything that does not strengthen the current loop.
- Mark technical interviews, emotion replacement, and advanced fairness work as after-today unless needed for the shipped loop.
- Treat polish as scoped polish, not feature creep.

### Step 2 - Remove Hume from the active architecture

Deliverable:

- No shipped screen depends on Hume APIs or Hume result objects.

Tasks:

- Find every import and runtime dependency for:
  - `humeBatchClient.ts`
  - `humeRealtime.ts`
  - `humeSystemPrompt.ts`
  - `useRealtimeInterview.ts`
  - `useRealtimeInterview.simple.ts`
  - `RealtimeInterviewSession.tsx`
  - `RealtimeTranscript.tsx`
  - `RealtimeAnalyticsDisplay.tsx`
- Remove Hume from `InterviewProcessing.tsx`.
- Replace any `humeData` assumptions in results rendering.
- Decide whether old Hume files are:
  - deleted now, or
  - quarantined behind a clearly dead legacy path.

Definition of done:

- Active interview path works without Hume credentials, Hume SDKs, or Hume response data.

### Step 3 - Rebuild processing around data we actually own

Deliverable:

- Processing completes reliably from Vapi transcript + local session metrics.

Tasks:

- Audit what Vapi already returns for transcript and timestamps.
- Define one normalized session result shape.
- Feed that shape into:
  - analytics engine
  - per-question breakdown
  - ideal-answer comparison
  - coaching summary
- Replace emotion-heavy scoring with categories we can defend:
  - clarity
  - structure
  - concision
  - relevance
  - confidence signals
  - speaking habits
  - posture/engagement cues if available

Definition of done:

- A finished session always produces a result object the UI can render.

### Step 4 - Make results honest and complete

Deliverable:

- Results page matches the data pipeline and does not fake unavailable insight.

Tasks:

- Remove placeholders and broken assumptions.
- Keep only metrics we can calculate consistently.
- Show:
  - overall score or score bands
  - strongest answer
  - weakest answer
  - per-question feedback
  - delivery coaching
  - next practice recommendation
- If emotion analysis is gone, do not leave dead labels behind.

Definition of done:

- A user can finish a session and understand exactly what went wrong and what to practice next.

### Step 5 - Make dashboard history real

Deliverable:

- Dashboard can show previous interview sessions and open their results.

Tasks:

- Finish the "view past results" path.
- Ensure session metadata is stored and recoverable.
- Decide minimum useful history fields:
  - role/company target
  - date
  - overall score
  - top weakness
  - recommended next drill
- Add empty states that still feel intentional.

Definition of done:

- The dashboard is not just a launchpad; it becomes a progress surface.

### Step 6 - Redesign dashboard UI so it stops feeling AI-generated

Deliverable:

- Dashboard feels like a product with a point of view.

Dribbble patterns worth borrowing:

- Large anchor panel instead of uniform card soup.
- Strong contrast with one warm or electric accent.
- Editorial hierarchy: one clear headline, one subhead, one dominant chart area.
- Fewer widgets, more breathing room.
- Data modules with distinct shapes and weight, not identical boxes.
- Activity timeline or session feed as a vertical narrative element.

Kelv dashboard direction:

- Keep a dark base, but avoid flat black everywhere.
- Use a restrained palette:
  - deep charcoal base
  - bone/off-white text
  - one electric accent for progress
  - one warm accent for warnings or coaching
- Make the hero panel about interview readiness or recent progress.
- Use asymmetry:
  - wide primary insight area
  - narrow side rail for next actions
  - one section that feels like a command center, not an admin panel
- Reduce repetitive cards.
- Replace generic AI copy with sharper product language:
  - "Next weak point"
  - "Last interview trend"
  - "Practice target"
  - "Delivery issue"

Concrete UI tasks:

- Rework `PlatformDashboard.tsx` layout hierarchy.
- Audit spacing, border radius, shadows, and panel repetition.
- Introduce a more deliberate type scale and section rhythm.
- Remove decorative noise that does not help decisions.
- Make mobile layout intentional, not just stacked.

Definition of done:

- The first screen looks like a crafted interview-performance product, not a generated SaaS starter.

### Step 7 - Cleanup pass

Deliverable:

- Smaller, clearer codebase with less dead product history.

Tasks:

- Remove dead Hume-era code from active imports.
- Consolidate duplicated analytics/result types.
- Rename vague utilities and props.
- Reduce oversized components where possible.
- Remove stale comments and abandoned UI states.
- Make env var usage explicit and current.

Definition of done:

- Another engineer can see the current architecture in one pass.

### Step 8 - Security and production sanity

Deliverable:

- No obviously unsafe browser-side secret usage remains in the planned shipped version.

Tasks:

- Audit browser-exposed API keys.
- Move any required LLM processing behind a server boundary if possible.
- If full migration cannot happen today, document the exact risk and isolate it.

Definition of done:

- We are not pretending a prototype security model is production-ready.

### Step 9 - QA and ship checklist

Deliverable:

- One clean, demo-ready product path.

Tasks:

- Run one full happy-path session.
- Run one edge case:
  - missing resume
  - missing JD
  - short interview
  - failed processing retry
- Verify dashboard, results, and history all connect.
- Check copy consistency.
- Check mobile and desktop layouts.
- Remove obvious console noise and broken loading states.

Definition of done:

- We can demo Kelv end-to-end without explaining around broken pieces.

## Research Notes To Preserve

These should shape the shipped product, but not expand scope today.

### Source-driven product ideas worth keeping

- Identity vs. reputation gap:
  - Help users see how they think they came across vs. how they likely came across.
- Failure scenario planning:
  - Add pre-mortem, checklist, and reflection loops.
- Per-question analytics:
  - Show weak-answer patterns, not just one final score.
- Speaking coaching:
  - Keep filler words, pacing, vocal habits, and warm-up guidance.
- Adaptive interviews:
  - Profile-aware follow-ups are high value once the base loop is stable.
- Fairness:
  - Evaluation explanations and bias checks matter, but should be implemented deliberately.

## New Technology Research

Only research what helps the shipping path or the immediate post-today roadmap.

### P0 research

- Best no-Hume stack for transcript and voice-quality processing:
  - Vapi-native transcript only
  - Deepgram
  - AssemblyAI
  - OpenAI audio/transcription path
- Best way to store completed session summaries and history.
- Best server-side pattern for LLM feedback generation.

### After-today research

- Emotion or prosody analysis alternatives that are production-safe.
- Better technical interview question generation/evaluation.
- Fairness and auditability patterns for interview scoring.

## Cleanup List

### Product cleanup

- Remove claims in UI that the product cannot support reliably.
- Align marketing copy with the shipped feature set.
- Make the dashboard and results language more concrete and less generic.

### Code cleanup

- Remove dead Hume code from active paths.
- Centralize session result typing.
- Simplify analytics flow and prop chains.
- Trim large components with mixed responsibilities.

### UX cleanup

- Stop repeating identical cards and panels.
- Use stronger empty states and loading states.
- Tighten CTA hierarchy so every screen has one main action.

### Documentation cleanup

- Add one short architecture note:
  - active interview flow
  - processing flow
  - session storage flow
- Document what was removed with Hume and what replaced it.

## Order Of Execution

1. Remove Hume from the shipped flow.
2. Normalize the replacement processing pipeline.
3. Fix results so they reflect real data.
4. Make dashboard history work.
5. Redesign the dashboard UI.
6. Clean up dead code and misleading copy.
7. QA the entire loop and ship.

## Design References

- Dribbble - Dark Mode Productivity Dashboard - Smart Focus & Analytics UI:
  https://dribbble.com/shots/26483779-Dark-Mode-Productivity-Dashboard-Smart-Focus-Analytics-UI
- Dribbble - Modern Productivity Dashboard UI:
  https://dribbble.com/shots/25678009-Modern-Productivity-Dashboard-UI
- Dribbble - Analytics Dashboard UI - Modern Data Visualization:
  https://dribbble.com/shots/26348311-Analytics-Dashboard-UI-Modern-Data-Visualization

## Final Constraint

The goal is not to make Kelv look more advanced than it is.

The goal is to make Kelv tighter, sharper, more honest, and fully demoable today.
