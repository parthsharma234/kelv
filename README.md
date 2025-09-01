# Kelv Realtime Interview

This repository demonstrates a realtime interview agent powered by OpenAI's `gpt-realtime` model.

## Master Prompt

`src/masterprompt/masterPrompt.ts` exports a single, fully authored prompt string with labeled sections:

```
# Role & Objective
# Personality & Tone
# Context
# Reference Pronunciations
# Tools
# Instructions / Rules
# Conversation Flow
# Safety & Escalation
```

The prompt hard-codes speed, language, variety, and instructs the model to infer pronunciations from context. Dynamic depth is controlled via `[Experience: LEVEL]` tags and minute-by-minute `[Elapsed: Xm]` updates.

See [docs/PROMPT_AUTHORING.md](docs/PROMPT_AUTHORING.md) for guidelines.

## Conversation Flow State Machine

`src/utils/conversationFlow.ts` defines a lightweight state machine. Only `greeting` and `closing` are fixed; the middle `open` state branches freely based on interviewer direction, and `follow_up` returns to the previous state after one question.

## Realtime Hook

`useRealtimeInterview.ts` streams `[Experience: LEVEL]` and `[Elapsed: Xm]` to the model each minute, exposes `requestFollowUp(text)` for interviewer-driven prompts, and auto-closes the session when the configured time limit is reached by sending a closing message followed by `finish_session`.

## Termination

Safety triggers in the prompt lead to the required phrase “Thanks for your patience—I’m connecting you with a specialist now,” then calls to `escalate_to_human()` and `finish_session()`.

Run `npm run lint` to check code quality (may emit warnings). No test suite is defined.
