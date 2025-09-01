# Prompt Authoring Guide

Kelv uses a single master system prompt located at `src/masterprompt/masterPrompt.ts`. The file exports a fully written string that follows this structure:

1. `# Role & Objective` – identity and success criteria.
2. `# Personality & Tone` – friendly, concise, confident; includes speed, language, and variety rules.
3. `# Context` – screen and transcript awareness with `[Elapsed: Xm]` time stamps.
4. `# Reference Pronunciations` – instructs the model to infer pronunciations from context.
5. `# Tools` – `answer(question)`, `escalate_to_human()`, `finish_session()`.
6. `# Instructions / Rules` – dynamic depth via `[Experience: LEVEL]`, follow-up logic, math formatting, no pronouns.
7. `# Conversation Flow` – `greeting → open ↔ follow_up → closing` with sample phrases and exit criteria.
8. `# Safety & Escalation` – triggers, required phrase, and termination sequence.

## Experience Level
`useRealtimeInterview` passes `[Experience: beginner|intermediate|advanced]` in every `session.update`. The model mirrors this depth when answering.

## Time Context
Elapsed minutes are appended as `[Elapsed: Xm]` each minute. The prompt may reference this tag to adjust pacing or trigger the closing phase.

## Pronunciation Inference
Rather than a fixed list, the prompt instructs the model to infer pronunciations from surrounding context and only ask when uncertain.

## Dynamic Flow Configuration
`src/utils/conversationFlow.ts` defines a lightweight state machine. Only `greeting` and `closing` are mandatory; the middle `open` state branches freely based on interviewer direction. `requestFollowUp(text)` lets interviewers inject their own follow-up questions, and the flow returns to the previous state after one.

Maintain this structure when updating the master prompt to ensure consistent realtime behavior.
