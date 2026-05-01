# ElevenLabs Migration Notes

## Summary

Kelv now uses ElevenLabs as the active live-interview voice runtime. Vapi is removed from the active code path and package dependencies. The existing capstone `.env` style stays intact: the browser uses a public ElevenLabs agent ID through `VITE_ELEVENLABS_AGENT_ID`; no Supabase Edge Function was added.

References used:

- ElevenLabs React SDK: https://elevenlabs.io/docs/eleven-agents/libraries/react
- ElevenLabs JavaScript SDK: https://elevenlabs.io/docs/eleven-agents/libraries/java-script
- ElevenLabs client tools overview: https://help.elevenlabs.io/hc/en-us/articles/34669011018257-How-do-I-use-tools-with-ElevenAgents
- ElevenLabs React SDK v1.0 note: https://elevenlabs.io/blog/elevenagents-react-sdk-v1-0

## Runtime Decision

Use `@elevenlabs/react` and its re-exported client runtime for the live voice interview. The docs state that `startSession` starts the microphone-backed agent session, and public agents can start with an `agentId`. Private agents require a server-generated signed URL or conversation token so the ElevenLabs API key is never exposed to the browser.

Current capstone path:

```env
VITE_ELEVENLABS_AGENT_ID=your_public_elevenlabs_agent_id_here
```

Recommended ElevenLabs agent voice model setting:

```text
eleven_flash_v2
```

Reason: the ElevenLabs Agents API currently rejects English agent creation unless the TTS model is Turbo or Flash v2. Flash v2 is the right default for low-latency live interviewing. Keep `eleven_turbo_v2` as the quality fallback if Flash sounds too clipped.

Recommended Kelv interviewer voice setting:

```text
voice_id=cjVigY5qzO86Huf0OWal
```

Reason: this voice is available in the current ElevenLabs account. The setup script pairs it with slower, steadier TTS settings so Kelv sounds more like a seasoned interviewer than a casual assistant. To use a different account-accessible voice, set `ELEVENLABS_VOICE_ID` before running setup.

## API Setup Script

Kelv can create the ElevenLabs agent without dashboard navigation:

```bash
npm run setup:elevenlabs-agent
```

You can also create the agent automatically before starting Vite:

```bash
npm run dev -- --setup-elevenlabs
```

Force creation of a new agent:

```bash
npm run dev -- --setup-elevenlabs --force-elevenlabs-agent
```

Required local env:

```env
ELEVENLABS_API_KEY=your_private_elevenlabs_api_key_here
```

The script calls:

- `GET /v1/convai/tools` to reuse existing whiteboard tool declarations when rerunning setup.
- `POST /v1/convai/tools` for missing whiteboard client-tool declarations.
- `POST /v1/convai/agents/create?enable_versioning=true` for the Kelv voice shell.
- `PATCH /v1/convai/agents/:agent_id` to repair an existing `.env` agent instead of skipping it.

It writes the returned agent ID into `.env`:

```env
VITE_ELEVENLABS_AGENT_ID=agent_id_here
```

Useful options:

```bash
node scripts/setup-elevenlabs-agent.mjs --force
node scripts/setup-elevenlabs-agent.mjs --skip-tools
npm run setup:elevenlabs-agent:preview
```

The setup script never writes `ELEVENLABS_API_KEY` into frontend code. The runtime app only reads `VITE_ELEVENLABS_AGENT_ID`.

Important runtime settings applied by the script:

- `platform_settings.auth.enable_auth=false` so the browser can use `agentId` directly for this capstone build.
- `platform_settings.overrides.conversation_config_override.agent.prompt.prompt=true` so Kelv can inject the runtime interviewer prompt.
- `platform_settings.overrides.conversation_config_override.agent.first_message=true` so Kelv can personalize the opening.
- `platform_settings.overrides.conversation_config_override.agent.language=true` for SDK compatibility.
- `conversation_config.agent.prompt.tools` includes ElevenLabs `skip_turn` and `end_call` system tools. `end_call` is used when the candidate explicitly wants to stop or the interview reaches a natural close.
- The client uses ElevenLabs WebSocket voice transport to avoid LiveKit/WebRTC disconnects seen in local Windows testing.

## Files Changed

- `package.json` / `package-lock.json`: added `@elevenlabs/react`, removed `@vapi-ai/web`.
- `.env.example`: replaced Hume/Vapi-style voice config with `VITE_ELEVENLABS_AGENT_ID`.
- `scripts/setup-elevenlabs-agent.mjs`: creates the Kelv agent via ElevenLabs API and writes `VITE_ELEVENLABS_AGENT_ID`.
- `src/hooks/useElevenLabsInterview.ts`: new ElevenLabs runtime hook.
- `src/hooks/useVapiInterview.ts`: deleted.
- `src/components/Platform/VoiceInterviewSession.tsx`: renamed/replaced the previous Vapi session component.
- `src/components/Platform/PlatformContainer.tsx`: now launches `VoiceInterviewSession`.
- `src/utils/interviewContext.ts`: replaced Vapi-specific context with provider-neutral `buildVoiceInterviewContext`.
- `src/utils/interviewBlueprint.ts`: new role-aware interview blueprint engine.
- `src/types/interviewIntelligence.ts`: new contracts for question plans, follow-up policy, and whiteboard tools.
- `src/utils/promptArchitecture.ts`: expanded category overlays and blueprint-aware interviewer prompt.
- `src/types/sessionResult.ts`: added richer interview categories and `elevenlabs` transcript vendor support.
- `src/utils/sessionResultAdapter.ts`: new sessions default to `transcript_vendor: 'elevenlabs'`.
- `src/utils/sessionResultValidation.ts`: accepts `elevenlabs`; keeps `vapi` only for historical saved sessions.
- `src/utils/supabase-interview.ts`: persists `voice_provider` and `whiteboard_requests`.
- `ARCHITECTURE.md` / `features.md`: updated active baseline from Vapi to ElevenLabs.

## Live Session Flow

```text
PlatformDashboard
  -> VoiceInterviewSession
  -> useElevenLabsInterview
  -> Conversation.startSession({
       agentId,
       connectionType: 'webrtc',
       dynamicVariables,
       overrides.agent.prompt,
       overrides.agent.firstMessage,
       clientTools
     })
  -> transcript + duration + posture + recording + whiteboardRequests
  -> InterviewProcessing
  -> AnalyticsEngine + PerQuestionAnalytics + Kelv LENS
  -> SessionResultV2
  -> local storage + Supabase metadata
```

## Prompt Architecture

`buildVoiceInterviewContext` now produces:

- `promptContext`: role, industry, level, category, resume summary, JD summary, session phase.
- `blueprint`: track, interview mix, competencies, planned questions, follow-up policy, whiteboard policy, scoring rubric.
- `interviewerSystemPrompt`: full prompt override for ElevenLabs.
- `firstMessage`: realistic opening question.
- `dynamicVariables`: compact values and serialized policies for the ElevenLabs agent.

The interviewer prompt now enforces structured-interview behavior:

- Ask one question at a time.
- Use planned lead questions.
- Follow up when evidence is missing.
- Move on when the competency is covered.
- Do not overpraise weak answers.
- Trigger whiteboard when the question needs visual reasoning.

## Interview Intelligence Engine

`buildInterviewBlueprint` selects an interview track from the role and industry:

- `software_engineering`
- `data_science`
- `product_management`
- `ux_design`
- `sales_customer_success`
- `business_finance`
- `general_professional`

Each blueprint includes behavioral, resume, situational, company-fit, and role-specific technical/case questions. Technical tracks include whiteboard-capable questions for coding, system design, product cases, and data cases.

## Whiteboard Tool Contract

ElevenLabs client tools are registered in `useElevenLabsInterview`:

```ts
openWhiteboard({ question_id, mode, prompt, constraints, expected_sections })
captureWhiteboardState({ question_id })
markWhiteboardMilestone({ question_id, milestone })
closeWhiteboard({ question_id })
```

The hook stores every request in `whiteboardRequests`. The current session component shows a minimal placeholder panel so the flow is testable, but the UI agent should replace it with the real whiteboard surface.

Expected whiteboard modes:

- `coding`: problem restatement, approach, edge cases, complexity, tests.
- `system_design`: requirements, API/data model, architecture, bottlenecks, tradeoffs.
- `product_case`: goal, users, options, metrics, risks.
- `data_case`: question, data needed, method, validation, business readout.

## Data Contract Changes

New session data fields passed into processing/results:

```ts
sessionData.voiceProvider // 'elevenlabs'
sessionData.whiteboardRequests
sessionData.jobContext.blueprint
```

`SessionResultV2.processing_metadata.transcript_vendor` now defaults to:

```ts
'elevenlabs'
```

`vapi` remains accepted only so old saved sessions do not fail validation.

## UI Handoff

The UI agent should wire these surfaces:

- Setup screen should mention ElevenLabs agent readiness and `VITE_ELEVENLABS_AGENT_ID` missing-state copy.
- Live interview should render a proper whiteboard surface when `whiteboardRequests` receives `openWhiteboard`.
- Results should show whether the session used `voiceProvider: 'elevenlabs'`.
- Results should render `jobContext.blueprint.question_plan` to explain why each question was asked.
- Results should keep using `sessionResultV2`, `practicePlan`, `signalReliability`, and `signalFusion`.

## Verification

Commands run:

```bash
npm test
npm run build
```

Result:

- `npm test`: 10 test files passed, 21 tests passed.
- `npm run build`: passed.

Known warnings:

- Vite bundle remains larger than 500 kB after minification.
- Browserslist data is stale.
- NPM audit still reports existing dependency vulnerabilities; I did not run `npm audit fix --force` because that can introduce unrelated breaking changes.
