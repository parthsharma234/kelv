# Hume AI Integration Setup Guide

Your interview platform has been migrated from OpenAI Realtime to **Hume AI's Empathic Voice Interface (EVI)**. This provides better audio quality, natural conversation flow, and emotional intelligence.

## Setup Steps

### 1. Get Hume API Key

1. Go to [https://platform.hume.ai/](https://platform.hume.ai/)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Create a new API key and copy it

### 2. Create EVI Configuration

1. Go to [https://platform.hume.ai/evi/configs](https://platform.hume.ai/evi/configs)
2. Click "Create New Config"
3. Configure the following:

**Basic Settings:**
- **Config Name:** Interview Simulator - Senior Level
- **Voice:** Kelv (your custom voice)
- **First Message:** `So... tell me about yourself.`
- **Disable interruptions during first message:** Unchecked

**System Prompt:**
- Paste the interviewer prompt from your documentation (the long prompt about being a senior hiring manager)

**LLM Configuration:**
- **Provider & Model:** OpenAI GPT-4o (or GPT-4o-mini for cost savings)
- **Temperature:** 0.7
- **Max tokens:** Default or reasonable limit

**Tools:**
- ✅ Enable "End conversation" tool
- ❌ Disable all other tools

4. Save the config and copy the **Config ID**

### 3. Set Environment Variables

Create a file named `.env.local` in the project root:

```env
# Supabase (keep your existing values)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI (keep for legacy support)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Hume AI (NEW - required)
VITE_HUME_API_KEY=your_hume_api_key_from_step1
VITE_HUME_CONFIG_ID=your_hume_config_id_from_step2
```

### 4. Verify Your API Keys

Make sure both keys are properly set:
```bash
# Check that your .env.local has valid values (not the placeholder text)
cat .env.local
```

Your keys should look like:
- `VITE_HUME_API_KEY=hume_xxx...` (actual API key, not "your_hume_api_key_here")
- `VITE_HUME_CONFIG_ID=conf-xxx...` (actual config ID, not "your_hume_config_id_here")

### 5. Restart Your Dev Server

```bash
npm run dev
```

**IMPORTANT**: If you see a WebSocket connection error, it means:
1. API keys are not set correctly in `.env.local`
2. Config ID is invalid or doesn't exist
3. API key doesn't have access to that config

Check the browser console for specific error messages.

## What Changed

### Files Modified:
1. **`src/utils/humeRealtime.ts`** - New Hume AI client (similar API to OpenAI client)
2. **`src/utils/humeExpressionMeasurement.ts`** - NEW: Expression Measurement client for emotional analysis
3. **`src/hooks/useRealtimeInterview.ts`** - Now supports both `provider: 'hume'` and `provider: 'openai'`, plus expression measurement
4. **`src/hooks/useExpressionMeasurement.ts`** - NEW: Hook for managing expression measurement during interviews
5. **`src/components/Platform/RealtimeInterviewSession.tsx`** - Passes `provider: 'hume'` to use Hume AI
6. **`.env.example`** - Added Hume configuration template

### Benefits of Hume AI:
✅ Better audio quality (no pops/artifacts)
✅ Natural turn-taking and interruption handling
✅ Emotional intelligence built-in
✅ Lower latency
✅ More expressive speech
✅ Better alignment with interviewer personality
✅ **NEW: Real-time emotional expression analysis** (voice, text, and facial expressions)

## Expression Measurement (NEW Feature)

Your platform now includes **Hume's Expression Measurement API** for real-time emotional intelligence analysis during interviews.

### What Gets Analyzed:

1. **Prosody (Voice Emotions)**
   - Analyzes vocal patterns, tone, pitch, and speaking rate
   - Detects emotions like confidence, nervousness, enthusiasm
   - Runs continuously during the interview on user's voice

2. **Language (Text Emotions)**
   - Analyzes the emotional content of spoken words
   - Detects emotions from transcript text
   - Identifies emotional language patterns

3. **Face (Facial Expressions)** - Currently disabled
   - Can analyze facial expressions from video
   - Disabled by default (requires video frame processing)
   - Can be enabled in future for visual emotion analysis

### How It Works:

- Expression measurement runs **automatically** during Hume AI interviews
- Audio chunks are sent every 3 seconds for prosody analysis
- Transcript text is sent immediately for language analysis
- Results are logged in real-time to console
- Final aggregated metrics are available at interview completion

### Viewing Expression Data:

Currently, expression measurement data is logged to the browser console:
```
[Interview Expression] Prosody measurement received
[Interview Expression] Language measurement received: "I have five years of experience..."
[Interview] Expression measurement complete: {prosodyCount: 42, languageCount: 38, topEmotions: [...]}
```

### Next Steps for Expression Analytics:

The infrastructure is in place. Future enhancements:
1. Display emotion timeline in interview feedback
2. Show emotional patterns per question
3. Identify moments of high stress/confidence
4. Compare emotional profile to successful candidates
5. Provide coaching on emotional communication

**For detailed information about Expression Measurement**, see [EXPRESSION_MEASUREMENT.md](./EXPRESSION_MEASUREMENT.md):
- Complete architecture documentation
- API reference and usage examples
- Analytics output format
- Integration guide for UI
- Troubleshooting tips

### Switching Back to OpenAI (if needed):
In `src/components/Platform/RealtimeInterviewSession.tsx`, change:
```typescript
provider: 'hume' as const // Use Hume AI
```
to:
```typescript
provider: 'openai' as const // Use OpenAI Realtime
```

## Testing

1. Start an interview
2. Verify audio is clear and natural
3. Test interruptions (speak while AI is talking)
4. Confirm the interviewer follows the prompt correctly

## Troubleshooting

**"Hume API key not configured"**
- Make sure `.env.local` has `VITE_HUME_API_KEY` set
- Restart dev server after adding env variables

**"Hume Config ID not configured"**
- Make sure `.env.local` has `VITE_HUME_CONFIG_ID` set
- Get this from the Hume platform after creating an EVI config

**Audio not working**
- Check browser console for WebSocket errors
- Verify microphone permissions are granted
- Ensure Hume API key is valid

**Interviewer not following prompt**
- Make sure you pasted the full system prompt in the Hume EVI config
- Check that you're using the correct Config ID

## Support

- Hume Docs: [https://docs.hume.ai/](https://docs.hume.ai/)
- Hume Discord: [https://link.hume.ai/discord](https://link.hume.ai/discord)
