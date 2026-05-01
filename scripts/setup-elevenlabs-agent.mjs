import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const ENV_LOCAL_PATH = path.join(ROOT, '.env.local');
const API_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_AGENT_NAME = 'Kelv AI Interviewer';
const INTERVIEWER_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'cjVigY5qzO86Huf0OWal';
const INTERVIEWER_TTS_MODEL_ID = 'eleven_flash_v2';
const WHITEBOARD_TOOL_CONFIGS = [
  {
    type: 'client',
    name: 'openWhiteboard',
    description: 'Open a client-side whiteboard surface for coding, system design, product case, or data case reasoning.',
    expects_response: true
  },
  {
    type: 'client',
    name: 'captureWhiteboardState',
    description: 'Ask the client app to capture the current whiteboard state for the current interview question.',
    expects_response: true
  },
  {
    type: 'client',
    name: 'markWhiteboardMilestone',
    description: 'Mark candidate progress on the client-side whiteboard, such as requirements, approach, edge cases, or tests.',
    expects_response: true
  },
  {
    type: 'client',
    name: 'closeWhiteboard',
    description: 'Close the client-side whiteboard surface when the reasoning segment is complete.',
    expects_response: true
  }
];

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const skipTools = args.has('--skip-tools');
const printConfig = args.has('--print-config') || args.has('--dry-run');

main().catch((error) => {
  console.error(`[elevenlabs-setup] ${error.message}`);
  process.exit(1);
});

async function main() {
  const env = loadEnv();
  const apiKey =
    process.env.ELEVENLABS_API_KEY ||
    env.ELEVENLABS_API_KEY ||
    process.env.VITE_ELEVENLABS_API_KEY ||
    env.VITE_ELEVENLABS_API_KEY;
  const existingAgentId = process.env.VITE_ELEVENLABS_AGENT_ID || env.VITE_ELEVENLABS_AGENT_ID;

  if (printConfig) {
    console.log('[elevenlabs-setup] Config preview only. No ElevenLabs API calls will be made.');
    console.log(JSON.stringify(buildAgentPayload([]), null, 2));
    return;
  }

  if (!apiKey) {
    throw new Error([
      'Missing ELEVENLABS_API_KEY.',
      'Add it to .env or .env.local, then rerun: npm run setup:elevenlabs-agent',
      'Do not use a VITE_ prefix for the private API key.'
    ].join('\n'));
  }

  if (!process.env.ELEVENLABS_API_KEY && !env.ELEVENLABS_API_KEY && (process.env.VITE_ELEVENLABS_API_KEY || env.VITE_ELEVENLABS_API_KEY)) {
    console.warn('[elevenlabs-setup] Using VITE_ELEVENLABS_API_KEY as a fallback.');
    console.warn('[elevenlabs-setup] Rename it to ELEVENLABS_API_KEY later so the private key is not exposed to browser code.');
  }

  let toolIds = [];
  if (!skipTools) {
    toolIds = await createWhiteboardTools(apiKey);
  }

  if (existingAgentId && !force) {
    console.log(`[elevenlabs-setup] Existing VITE_ELEVENLABS_AGENT_ID found: ${maskId(existingAgentId)}`);
    await updateAgent(apiKey, existingAgentId, toolIds);
    console.log('[elevenlabs-setup] Repaired existing Kelv ElevenLabs agent config.');
    console.log('[elevenlabs-setup] Restart npm run dev so Vite uses the repaired agent.');
    return;
  }

  const agentId = await createAgent(apiKey, toolIds);
  updateEnvFile(ENV_PATH, {
    VITE_ELEVENLABS_AGENT_ID: agentId
  });

  console.log(`[elevenlabs-setup] Created Kelv ElevenLabs agent: ${maskId(agentId)}`);
  console.log('[elevenlabs-setup] Wrote VITE_ELEVENLABS_AGENT_ID to .env.');
  console.log('[elevenlabs-setup] Restart npm run dev so Vite picks up the new env value.');
}

async function createWhiteboardTools(apiKey) {
  const ids = [];
  for (const tool of WHITEBOARD_TOOL_CONFIGS) {
    try {
      const existingToolId = await findExistingToolId(apiKey, tool.name);
      if (existingToolId) {
        ids.push(existingToolId);
        console.log(`[elevenlabs-setup] Reusing client tool: ${tool.name}`);
        continue;
      }

      const response = await elevenLabsRequest(apiKey, '/convai/tools', {
        method: 'POST',
        body: {
          tool_config: {
            type: 'client',
            name: tool.name,
            description: tool.description,
            expects_response: tool.expects_response
          }
        }
      });

      if (response.id) ids.push(response.id);
      console.log(`[elevenlabs-setup] Registered client tool: ${tool.name}`);
    } catch (error) {
      console.warn(`[elevenlabs-setup] Tool registration skipped for ${tool.name}: ${error.message}`);
      console.warn('[elevenlabs-setup] Continuing with prompt/runtime clientTools. The app can still run.');
      return [];
    }
  }

  return ids;
}

async function findExistingToolId(apiKey, toolName) {
  try {
    const response = await elevenLabsRequest(
      apiKey,
      `/convai/tools?search=${encodeURIComponent(toolName)}&page_size=100&types=client`,
      { method: 'GET' }
    );

    const match = (response.tools || []).find((tool) => tool?.tool_config?.name === toolName);
    return typeof match?.id === 'string' ? match.id : null;
  } catch (error) {
    console.warn(`[elevenlabs-setup] Could not check existing tool ${toolName}: ${error.message}`);
    return null;
  }
}

async function createAgent(apiKey, toolIds) {
  const response = await elevenLabsRequest(apiKey, '/convai/agents/create?enable_versioning=true', {
    method: 'POST',
    body: buildAgentPayload(toolIds)
  });

  if (!response.agent_id || typeof response.agent_id !== 'string') {
    throw new Error('ElevenLabs did not return an agent_id.');
  }

  return response.agent_id;
}

async function updateAgent(apiKey, agentId, toolIds) {
  await elevenLabsRequest(apiKey, `/convai/agents/${encodeURIComponent(agentId)}?enable_versioning_if_not_enabled=true`, {
    method: 'PATCH',
    body: buildAgentPayload(toolIds)
  });
}

function buildAgentPayload(toolIds) {
  const prompt = [
    'You are Kelv, a realistic AI interviewer for interview practice.',
    'Use the runtime interview context below whenever it is present. If runtime overrides and dynamic variables disagree, follow the most specific JD/resume context.',
    'Runtime role: {{role}}',
    'Runtime industry: {{industry}}',
    'Runtime level: {{experience_level}}',
    'Runtime category: {{interview_category}}',
    'Runtime job description summary: {{job_description}}',
    'Runtime resume summary: {{resume}}',
    'Runtime interview blueprint: {{interview_blueprint}}',
    'Runtime interviewer prompt: {{interviewer_system_prompt}}',
    'Sound like an older, seasoned interviewer: measured, direct, and professionally skeptical. Be warm enough to keep the candidate comfortable, but do not be casual, bubbly, or overly encouraging.',
    'Your voice should feel like a real person on a live interview call, not a chatbot. Use contractions, slight imperfections, and natural pacing. Keep most turns to one or two short paragraphs.',
    'Do not sound like you are following a rubric out loud. The rubric is internal. The candidate should hear a human interviewer who is listening, reacting, and deciding where to probe.',
    'Keep a stricter bar than a coaching bot. Challenge vague claims, ask for specifics, and move on when an answer is exhausted.',
    'Opening behavior: the first question is always a normal human check-in: ask how they are doing today. Listen to the answer and respond to it specifically before moving on.',
    'Small talk is controlled and brief. After the candidate answers the check-in, respond like a real interviewer in one sentence, then take control of the agenda. Do not ask the candidate what they want to talk about, what part of the role excites them, or what they want you to press on.',
    'If the candidate asks how you are, answer briefly: "I am doing well, thanks. I have your resume and the job description in front of me, so I am going to start with your background and then move into role situations." Then ask the first background question.',
    'The first real interview question must use the resume and JD context. Ask them to pick a relevant experience from their background, explain what was happening, what they personally owned, and how it connects to this role.',
    'Do not jump from "how are you" into a generic STAR prompt. Use a natural bridge after the check-in, such as "I have your resume here, so I want to anchor this in your actual background."',
    'Conversation state machine: CHECK_IN -> BACKGROUND_ANCHOR -> EVIDENCE_PROBE -> ROLE_SITUATION -> RESUME_DEEP_DIVE -> CANDIDATE_QUESTION -> CLOSE. Do not skip BACKGROUND_ANCHOR after the check-in.',
    'CHECK_IN state: only ask how they are doing today. If they answer and ask how you are, answer in one short clause, then move immediately to BACKGROUND_ANCHOR.',
    'BACKGROUND_ANCHOR state: mention that you have the resume and job description, name the JD role, and ask for one relevant background example. This is mandatory even when the candidate seems ready.',
    'EVIDENCE_PROBE state: if the answer lacks personal ownership, metrics/scope, customer/stakeholder context, tradeoff, or outcome, ask exactly one targeted follow-up for the missing item. Do not ask a new lead question until the gap is handled or the candidate clearly cannot answer.',
    'If the candidate says "you are supposed to be interviewing me", "just ask the question", or challenges your small talk, do not over-apologize. Say "Fair point" or "You are right", then immediately ask the BACKGROUND_ANCHOR question.',
    'Never ask these agenda-setting questions: "what part of the role are you most interested in", "what excites you about the role", "what do you want to dive into", "what do you want me to press on", or "what would you like to discuss". Those are candidate-led and make the interview feel fake.',
    'Good opening after check-in example: "I am doing well, thanks. I have your resume and the {{role}} job description in front of me, so I will start with your background. Pick one experience that connects to this role. What was happening, what did you personally own, and what changed?"',
    'For situational answers, verify sequence, first action, stakeholder wording, risk tradeoff, escalation threshold, and what would make the candidate change course.',
    'If the candidate dodges twice or gives a rehearsed answer with no evidence, be harsher but still professional: say the answer is too general and ask for the actual example.',
    'Avoid assistant phrasing such as "please provide more specific details", "can you elaborate", "can you give me more concrete details", "that is definitely important", or repeated "can you describe". Prefer spoken interviewer phrasing: "Give me the actual example", "What exactly did you do?", "What changed?", or "What did you say to them?"',
    'Throughout the interview, react to what the candidate actually said. Use short, varied transitions: "Okay, I follow", "That is the headline", "Let me stop you there for a second", "I am going to push on that", "That part is still vague", "Good, now the harder part."',
    'Avoid repeating the same transition. Avoid formal filler like "Thank you for sharing" and "That is a valuable insight."',
    'Speak like a person: use short acknowledgements, plain words, and natural transitions. Avoid corporate phrases like "excellent response" or "thank you for sharing" unless they genuinely fit.',
    'Do not fill space with praise. Avoid generic validation like "excellent response", "great answer", "glad to hear that", or "thank you for sharing" unless the candidate earned it with specific evidence.',
    'Do not soften weak or incomplete answers with phrases like "that is a good approach", "that is a start", or "that is definitely important" before challenging them. If evidence is missing, say what is missing and ask the next probe.',
    'Reference the candidate role and JD naturally. Do not ask generic questions when the JD provides a specific role. If the JD role conflicts with the resume, interview for the JD role and use the resume only as evidence to probe transferable experience.',
    'Ask one question at a time.',
    'Do not interrupt after a few words. Wait until the candidate has given a complete answer before replying.',
    'If the transcript is only a tiny fragment such as "uh", "yes", "I", or one incomplete phrase, treat it as partial audio and wait.',
    'If the latest user transcript is "...", ".", punctuation-only, or clearly not an answer, use the skip_turn system tool instead of replying.',
    'Only say "I did not catch that, take your time and repeat the answer" if the candidate has been silent for a while after an invalid fragment.',
    'If the candidate clearly says they are done, wants to stop, has no more to add, or the interview has reached a natural close after the planned coverage, give one brief closing sentence and use the end_call system tool.',
    'Probe vague answers for proof, ownership, metrics, tradeoffs, and outcomes.',
    'For technical, architecture, product, or data reasoning, use the available whiteboard client tools when visual thinking would improve the evaluation.',
    'Do not score the candidate out loud during the live interview. Save evaluation for the post-session report.'
  ].join('\n');

  return {
    name: DEFAULT_AGENT_NAME,
    tags: ['kelv', 'capstone', 'interview-practice'],
    conversation_config: {
      asr: {
        quality: 'high',
        provider: 'elevenlabs',
        user_input_audio_format: 'pcm_16000'
      },
      turn: {
        mode: 'turn',
        turn_timeout: 18,
        initial_wait_time: 2.2,
        silence_end_call_timeout: -1,
        soft_timeout_config: {
          timeout_seconds: -1,
          message: 'Take your time.'
        },
        turn_eagerness: 'patient',
        spelling_patience: 'auto',
        speculative_turn: false,
        retranscribe_on_turn_timeout: true
      },
      tts: {
        model_id: INTERVIEWER_TTS_MODEL_ID,
        voice_id: INTERVIEWER_VOICE_ID,
        agent_output_audio_format: 'pcm_16000',
        optimize_streaming_latency: 3,
        stability: 0.72,
        speed: 0.92,
        similarity_boost: 0.86,
        style: 0.12,
        use_speaker_boost: true
      },
      conversation: {
        max_duration_seconds: 1800,
        client_events: [
          'audio',
          'agent_response',
          'agent_response_correction',
          'agent_chat_response_part',
          'interruption',
          'user_transcript',
          'conversation_initiation_metadata',
          'client_tool_call',
          'vad_score',
          'asr_initiation_metadata'
        ]
      },
      vad: {
        background_voice_detection: false
      },
      agent: {
        first_message: "Hi, I'm Kelv. Before we get into the interview itself, how are you doing today?",
        language: 'en',
        disable_first_message_interruptions: true,
        prompt: {
          prompt,
          llm: 'gpt-4o-mini',
          temperature: 0.45,
          max_tokens: 900,
          tools: [
            ...WHITEBOARD_TOOL_CONFIGS,
            {
              type: 'system',
              name: 'skip_turn',
              description: 'Use this when the user transcript is empty, punctuation-only, an ellipsis, or an incomplete fragment. Do not advance the interview.'
            },
            {
              type: 'system',
              name: 'end_call',
              description: 'End the interview only when the candidate explicitly says they are done or wants to stop, or after the planned interview coverage has naturally concluded. Before ending, give one concise closing sentence and do not provide a score.'
            }
          ]
        }
      }
    },
    platform_settings: {
      auth: {
        enable_auth: false,
        allowlist: []
      },
      overrides: {
        conversation_config_override: {
          agent: {
            first_message: true,
            language: true,
            prompt: {
              prompt: true
            }
          }
        }
      }
    }
  };
}

async function elevenLabsRequest(apiKey, endpoint, options) {
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const text = await response.text();
      const data = text ? safeJsonParse(text) : {};

      if (!response.ok) {
        const details = data?.detail || data?.message || text || response.statusText;
        const error = new Error(`ElevenLabs API ${response.status}: ${formatApiError(details)}`);
        error.status = response.status;

        if (attempt < maxAttempts && isRetryableElevenLabsError(error)) {
          console.warn(`[elevenlabs-setup] ${error.message}; retrying (${attempt}/${maxAttempts})...`);
          await sleep(600 * attempt);
          continue;
        }

        throw error;
      }

      return data;
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts && isRetryableElevenLabsError(error)) {
        console.warn(`[elevenlabs-setup] ${error.message}; retrying (${attempt}/${maxAttempts})...`);
        await sleep(600 * attempt);
        continue;
      }

      break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('ElevenLabs request failed.');
}

function isRetryableElevenLabsError(error) {
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status);
  return message.includes('fetch failed') ||
    message.includes('network') ||
    status === 429 ||
    (status >= 500 && status < 600);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadEnv() {
  return {
    ...parseEnvFile(ENV_PATH),
    ...parseEnvFile(ENV_LOCAL_PATH)
  };
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf8');
  const entries = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function updateEnvFile(filePath, updates) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const lines = existing.split(/\r?\n/);
  const usedKeys = new Set();

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match) return line;

    const key = match[1];
    if (!(key in updates)) return line;

    usedKeys.add(key);
    return `${key}=${updates[key]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!usedKeys.has(key)) nextLines.push(`${key}=${value}`);
  }

  const normalized = nextLines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
  fs.writeFileSync(filePath, `${normalized}\n`, 'utf8');
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function formatApiError(details) {
  if (typeof details === 'string') return details;
  return JSON.stringify(details);
}

function maskId(value) {
  if (!value || value.length < 10) return '[set]';
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
