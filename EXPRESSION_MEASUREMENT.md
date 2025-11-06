# Hume Expression Measurement Integration

## Overview

Your interview platform now includes **Hume AI's Expression Measurement API**, providing real-time emotional intelligence analysis during interviews. This adds a powerful new dimension to interview feedback by analyzing the candidate's emotional expressions through voice and language.

## Architecture

### Core Components

#### 1. **HumeExpressionMeasurementClient** (`src/utils/humeExpressionMeasurement.ts`)
- WebSocket-based client for real-time expression measurement
- Connects to `wss://api.hume.ai/v0/stream/models`
- Handles three modalities:
  - **Prosody**: Voice emotion analysis (tone, pitch, speaking patterns)
  - **Language**: Text emotion analysis (emotional content of words)
  - **Face**: Facial expression analysis (currently disabled)

**Key Features**:
- Auto-reconnection with exponential backoff
- Keep-alive mechanism (prevents 60-second timeout)
- Audio buffering and chunking (max 5 seconds per chunk)
- Event-driven architecture for real-time results

#### 2. **useExpressionMeasurement Hook** (`src/hooks/useExpressionMeasurement.ts`)
- React hook for managing expression measurement lifecycle
- Automatically buffers audio (sends every 3 seconds)
- Aggregates predictions for analysis
- Provides metrics retrieval and time-range queries

#### 3. **Expression Analytics** (`src/utils/expressionAnalytics.ts`)
- Converts raw emotion scores into actionable insights
- Analyzes:
  - Overall emotional profile
  - Communication style (confidence, enthusiasm, stress, authenticity)
  - Emotional trajectory over time
  - Peak and low moments
- Generates personalized recommendations

### Integration Points

#### In `useRealtimeInterview` Hook:
```typescript
// Initialize expression measurement
const expressionMeasurement = useExpressionMeasurement({
  enabled: enableExpressionMeasurement && provider === 'hume',
  enableProsody: true,  // Voice analysis
  enableLanguage: true, // Text analysis
  enableFace: false     // Video analysis (disabled)
});

// Connect on interview start
await expressionMeasurement.connect();

// Send audio chunks for prosody analysis
expressionMeasurement.sendAudioChunk(audioBuffer);

// Send transcript text for language analysis
expressionMeasurement.sendText(chunk.text);

// Get final metrics on interview end
const metrics = expressionMeasurement.getMetrics();
```

## Data Flow

```
Interview Session
       ↓
User speaks → Audio captured
       ↓
Audio chunks (PCM16, 48kHz) → Expression Measurement API
       ↓
← Prosody predictions (emotions + scores)
       ↓
Transcript generated
       ↓
Text → Expression Measurement API
       ↓
← Language predictions (emotions + scores)
       ↓
Aggregated metrics stored
       ↓
Analytics engine processes
       ↓
Insights + Recommendations generated
```

## Emotion Categories

### Analyzed Emotions

Hume's API can detect **48+ distinct emotions**, including:

**Positive Emotions**:
- Joy, Amusement, Excitement, Contentment
- Satisfaction, Relief, Interest, Admiration
- Pride, Triumph, Ecstasy, Enthusiasm
- Determination, Concentration

**Negative Emotions**:
- Sadness, Fear, Anxiety, Anger
- Disgust, Shame, Guilt, Disappointment
- Distress, Embarrassment, Horror, Pain
- Awkwardness, Confusion

**Confidence Indicators**:
- Confidence, Pride, Determination
- Calmness, Concentration, Satisfaction

**Stress Indicators**:
- Anxiety, Fear, Distress
- Awkwardness, Confusion, Doubt

**Enthusiasm Indicators**:
- Excitement, Joy, Interest
- Admiration, Amusement

## Analytics Output

### Metrics Generated

1. **Overall Emotional Profile**
   - Top 5 dominant emotions with scores
   - Emotional stability (0-1 scale)
   - Positive emotion ratio (0-1 scale)

2. **Communication Style Scores** (0-1 scale)
   - Confidence
   - Enthusiasm
   - Authenticity
   - Stress level

3. **Timeline Analysis**
   - Emotional trajectory: improving / stable / declining
   - Peak moments (top 3 positive moments with timestamps)
   - Low moments (top 3 challenging moments with timestamps)

4. **Personalized Recommendations**
   - Specific, actionable feedback
   - Based on detected patterns
   - Tailored to individual performance

### Example Output

```typescript
{
  overallEmotionalProfile: {
    dominantEmotions: [
      { name: 'Confidence', score: 0.73 },
      { name: 'Interest', score: 0.68 },
      { name: 'Determination', score: 0.61 },
      { name: 'Anxiety', score: 0.42 },
      { name: 'Concentration', score: 0.39 }
    ],
    emotionalStability: 0.78,
    positiveEmotionRatio: 0.71
  },
  communicationStyle: {
    confidence: 0.76,
    enthusiasm: 0.64,
    authenticity: 0.82,
    stress: 0.38
  },
  timelineAnalysis: {
    emotionalTrajectory: 'improving',
    peakMoments: [
      { time: 245, emotion: 'Triumph', score: 0.89 },
      { time: 512, emotion: 'Joy', score: 0.81 },
      { time: 678, emotion: 'Confidence', score: 0.79 }
    ],
    lowMoments: [
      { time: 123, emotion: 'Anxiety', score: 0.67 },
      { time: 389, emotion: 'Confusion', score: 0.54 }
    ]
  },
  recommendations: [
    'Great confidence! Your emotional energy increased as the interview progressed.',
    'Excellent authenticity - your genuine personality came through clearly.',
    'Work on managing initial anxiety. The first few minutes showed higher stress levels.'
  ]
}
```

## Usage Examples

### Enable/Disable Expression Measurement

In `RealtimeInterviewSession.tsx`:

```typescript
const hookOptions = useMemo(() => ({
  setup,
  interviewType: actualInterviewType,
  focusedType,
  mediaStream: stream,
  onComplete: handleComplete,
  onError: handleError,
  provider: 'hume' as const,
  enableExpressionMeasurement: true // Toggle expression measurement
}), [setup, actualInterviewType, focusedType, stream, handleComplete]);
```

### Access Expression Metrics in Interview Completion

```typescript
// In endInterview callback
const expressionMetrics = expressionMeasurement.getMetrics();

// Analyze the data
import { analyzeExpressionMeasurements } from '../utils/expressionAnalytics';
const insights = analyzeExpressionMeasurements(
  expressionMetrics.prosodyPredictions,
  expressionMetrics.languagePredictions
);

console.log('Top emotions:', insights.overallEmotionalProfile.dominantEmotions);
console.log('Confidence score:', insights.communicationStyle.confidence);
console.log('Recommendations:', insights.recommendations);
```

### Query Emotions for Specific Time Range

```typescript
// Get emotions between 2-5 minutes into interview
const startTime = 120; // 2 minutes in seconds
const endTime = 300;   // 5 minutes in seconds

const emotionsInRange = expressionMeasurement.getEmotionsInTimeRange(startTime, endTime);
console.log('Emotions during first behavioral question:', emotionsInRange);
```

## Future Enhancements

### Near-term (Ready to implement)

1. **Feedback UI Integration**
   - Display emotion timeline chart in feedback tab
   - Show dominant emotions per question
   - Visualize emotional trajectory

2. **Per-Question Analysis**
   - Track emotions for each interview question
   - Compare emotional responses across question types
   - Identify which questions caused stress

3. **Real-time Coaching**
   - Show live emotion indicators during practice interviews
   - Alert user when stress levels are high
   - Provide in-the-moment tips

### Long-term (Requires additional work)

4. **Video Expression Analysis**
   - Enable facial expression measurement
   - Capture video frames at regular intervals
   - Combine with voice/text for multi-modal analysis

5. **Benchmarking**
   - Compare candidate emotions to successful interviewees
   - Build emotion profiles for different roles
   - Provide percentile rankings

6. **Machine Learning**
   - Correlate emotional patterns with interview success
   - Predict interview outcomes based on expression data
   - Personalized emotion coaching based on ML models

## Technical Considerations

### Performance

- **Bandwidth**: ~10KB/second for audio + text
- **Latency**: 200-500ms for expression results
- **Connection**: Maintains WebSocket with auto-reconnect
- **Keep-alive**: Pings every 30 seconds to prevent timeout

### Reliability

- **Graceful Degradation**: Interview continues if expression measurement fails
- **Error Handling**: All errors logged but don't interrupt interview
- **Reconnection**: Automatic reconnection with exponential backoff
- **Data Persistence**: Metrics stored in memory, ready for export

### Privacy

- **Data Transmission**: Audio and text sent to Hume API via encrypted WebSocket
- **Storage**: Currently not persisted (only in-memory during interview)
- **User Control**: Can be disabled via `enableExpressionMeasurement: false`

## Troubleshooting

### Expression measurement not connecting

**Check**:
1. `VITE_HUME_API_KEY` is set in `.env.local`
2. Browser console for connection errors
3. Network tab for WebSocket connection status

**Solutions**:
- Verify API key is valid and not expired
- Check firewall/proxy settings for WebSocket connections
- Ensure Hume API is accessible from your network

### No emotion predictions received

**Check**:
1. Audio is being captured (check microphone permissions)
2. Transcript text is being generated
3. Console logs for `[Interview Expression]` messages

**Solutions**:
- Verify audio chunks are being sent (check network tab)
- Ensure transcript chunks are not empty
- Check for errors in expression measurement client

### High latency or delayed results

**Check**:
1. Network connection quality
2. Audio chunk size (should be 2-5 seconds)
3. Number of concurrent connections

**Solutions**:
- Reduce audio buffer interval
- Check network bandwidth
- Ensure only one expression measurement client is active

## API Reference

### HumeExpressionMeasurementClient

```typescript
class HumeExpressionMeasurementClient {
  // Connect to Hume API
  connect(): Promise<void>

  // Disconnect from API
  disconnect(): void

  // Send audio for prosody analysis (PCM16, 48kHz)
  sendAudioChunk(audioData: ArrayBuffer): void

  // Send text for language analysis
  sendText(text: string): void

  // Send image for facial analysis (base64 encoded)
  sendImageFrame(base64Image: string): void

  // Check connection status
  isConnectedToAPI(): boolean

  // Event listeners
  on(event: 'connection.opened', callback: () => void): void
  on(event: 'measurement.prosody', callback: (prediction: ProsodyPrediction) => void): void
  on(event: 'measurement.language', callback: (prediction: LanguagePrediction) => void): void
  on(event: 'error', callback: (error: Error) => void): void

  // Static utilities
  static aggregateEmotions(predictions): Map<string, number>
  static getTopEmotions(emotions, topN): EmotionScore[]
}
```

### useExpressionMeasurement

```typescript
function useExpressionMeasurement(options: {
  enabled?: boolean
  enableProsody?: boolean
  enableLanguage?: boolean
  enableFace?: boolean
  onProsodyMeasurement?: (prediction: ProsodyPrediction) => void
  onLanguageMeasurement?: (prediction: LanguagePrediction) => void
  onError?: (error: Error) => void
}): {
  isConnected: boolean
  isAnalyzing: boolean
  connect: () => Promise<void>
  disconnect: () => void
  sendAudioChunk: (audioData: ArrayBuffer) => void
  sendText: (text: string) => void
  sendImageFrame: (base64Image: string) => void
  getMetrics: () => ExpressionMetrics
  clearMetrics: () => void
  getEmotionsInTimeRange: (startTime: number, endTime: number) => EmotionScore[]
}
```

### Expression Analytics

```typescript
function analyzeExpressionMeasurements(
  prosodyPredictions: ProsodyPrediction[],
  languagePredictions: LanguagePrediction[]
): ExpressionInsights

function formatExpressionInsights(insights: ExpressionInsights): string
```

## Resources

- [Hume AI Documentation](https://dev.hume.ai/)
- [Expression Measurement API](https://dev.hume.ai/docs/expression-measurement/websocket.mdx)
- [Emotion Taxonomy](https://hume.ai/research/)

## Support

For questions or issues with expression measurement:
1. Check browser console for error messages
2. Review this documentation
3. Test with sample interviews to verify setup
4. Check Hume AI status page for API issues
