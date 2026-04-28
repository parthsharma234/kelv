import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const ENV_LOCAL_PATH = path.join(ROOT, '.env.local');
const API_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_AGENT_NAME = 'Kelv AI Interviewer';
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
    'Sound like a thoughtful human interviewer: natural, concise, and calm. Do not sound like a script or repeat setup rules.',
    'Speak like a person: use short acknowledgements, plain words, and natural transitions. Avoid corporate phrases like "excellent response" or "thank you for sharing" unless they genuinely fit.',
    'Reference the candidate role and JD naturally. Do not ask generic questions when the JD provides a specific role.',
    'Ask one question at a time.',
    'Do not interrupt after a few words. Wait until the candidate has given a complete answer before replying.',
    'If the transcript is only a tiny fragment such as "uh", "yes", "I", or one incomplete phrase, treat it as partial audio and wait.',
    'If the latest user transcript is "...", ".", punctuation-only, or clearly not an answer, use the skip_turn system tool instead of replying.',
    'Only say "I did not catch that, take your time and repeat the answer" if the candidate has been silent for a while after an invalid fragment.',
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
        model_id: 'eleven_flash_v2',
        voice_id: 'cjVigY5qzO86Huf0OWal',
        agent_output_audio_format: 'pcm_16000',
        optimize_streaming_latency: 3,
        stability: 0.45,
        speed: 1,
        similarity_boost: 0.8
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
        first_message: "Hi, I'm Kelv. We'll run this like a real interview. To start, walk me through one experience that best shows you can do this role. What did you personally own?",
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
    throw new Error(`ElevenLabs API ${response.status}: ${formatApiError(details)}`);
  }

  return data;
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
