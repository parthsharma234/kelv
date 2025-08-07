import { RealtimeTranscriptItem } from '../types/interview';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface TranscriptAnalysisSegment {
  id: string;
  timestamp: number;
  speaker: 'user' | 'assistant';
  text: string;
  analysis?: TranscriptFeedback;
  questionContext?: string;
  duration?: number;
}

export interface TranscriptFeedback {
  overall: string;
  strengths: string[];
  improvements: string[];
  specificComments: CommentAnnotation[];
  scores: {
    clarity: number;
    relevance: number;
    depth: number;
    confidence: number;
    structure: number;
    overall: number;
  };
  category: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  actionableAdvice: string[];
  rewriteSuggestions?: {
    restructure: string;
    concise: string;
  };
}

export interface CommentAnnotation {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  comment: string;
  type: 'strength' | 'improvement' | 'suggestion' | 'concern';
  severity: 'low' | 'medium' | 'high';
}

export interface TranscriptAnalysisResult {
  segments: TranscriptAnalysisSegment[];
  overallAnalysis: {
    totalScore: number;
    averageScores: {
      clarity: number;
      relevance: number;
      depth: number;
      confidence: number;
      structure: number;
    };
    keyStrengths: string[];
    primaryImprovements: string[];
    interviewFlow: string;
    communication: string;
    overallFeedback: string;
  };
  timeline: TimelinePoint[];
}

export interface TimelinePoint {
  timestamp: number;
  type: 'question' | 'response' | 'transition';
  content: string;
  score?: number;
  feedback?: string;
}

export class TranscriptAnalyzer {
  private async analyzeTranscriptSegment(
    userResponse: string,
    questionContext: string,
    interviewType: string,
    previousContext: string = ''
  ): Promise<TranscriptFeedback> {
    const analysisPrompt = `
You are an expert interview coach analyzing a candidate's response in real-time. Provide sophisticated, actionable feedback as if you were adding comments to a Google Doc.

INTERVIEW CONTEXT:
- Interview Type: ${interviewType}
- Question: ${questionContext}
- Previous Context: ${previousContext}

CANDIDATE RESPONSE:
"${userResponse}"

ANALYSIS REQUIREMENTS:

1. DETAILED SCORING (0-10 scale):
   - Clarity: How clear and articulate is the response?
   - Relevance: How well does it answer the question?
   - Depth: How comprehensive and insightful is the content?
   - Confidence: How confident does the candidate sound?
   - Structure: How well-organized is the response?

2. SPECIFIC ANNOTATIONS:
   Identify specific portions of text that demonstrate:
   - Strengths (highlight exceptional parts)
   - Areas for improvement (specific phrases/sections)
   - Suggestions (what could be enhanced)
   - Concerns (red flags or weaknesses)

3. ACTIONABLE FEEDBACK:
   - What the candidate did well
   - Specific improvements needed
   - Concrete advice for next time
   - Industry-specific insights

4. SOPHISTICATED ANALYSIS:
   - Communication patterns
   - Professional presence indicators
   - Technical accuracy (if applicable)
   - Storytelling effectiveness
   - Leadership indicators
   - Problem-solving approach

5. ANSWER REWRITE SUGGESTIONS:
   - Provide a clearer structure recommendation
   - Provide a more concise phrasing

Return your analysis in this exact JSON format:
{
  "overall": "One sentence summary of performance",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "specificComments": [
    {
      "id": "unique_id",
      "startIndex": 0,
      "endIndex": 20,
      "text": "excerpt from response",
      "comment": "specific feedback about this excerpt",
      "type": "strength|improvement|suggestion|concern",
      "severity": "low|medium|high"
    }
  ],
  "scores": {
    "clarity": 8,
    "relevance": 7,
    "depth": 6,
    "confidence": 8,
    "structure": 7,
    "overall": 7
  },
  "category": "excellent|good|fair|needs_improvement",
  "actionableAdvice": ["concrete advice 1", "concrete advice 2"],
  "rewriteSuggestions": {
    "restructure": "here's how to restructure that answer",
    "concise": "try this phrasing instead — it's more concise"
  }
}

IMPORTANT:
- Be specific and actionable, not generic
- Identify exact phrases that work well or need improvement
- Consider industry standards and professional communication
- Provide coaching-level insights
- Be encouraging but honest
- Focus on practical improvements
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert interview coach providing sophisticated, actionable feedback. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No analysis content received');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing transcript segment:', error);
      return this.getDefaultFeedback();
    }
  }

  async analyzeFullTranscript(
    transcript: RealtimeTranscriptItem[],
    interviewType: string = 'general'
  ): Promise<TranscriptAnalysisResult> {
    const segments: TranscriptAnalysisSegment[] = [];
    const timeline: TimelinePoint[] = [];
    
    let currentQuestion = '';
    let userResponseBuffer = '';
    let previousContext = '';
    
    for (let i = 0; i < transcript.length; i++) {
      const item = transcript[i];
      const timestamp = new Date(item.timestamp).getTime();
      
      if (item.speaker === 'assistant') {
        // This is an interviewer question or comment
        currentQuestion = item.text;
        timeline.push({
          timestamp,
          type: 'question',
          content: item.text
        });
        
        // If we have a buffered user response, analyze it
        if (userResponseBuffer.trim()) {
          const analysis = await this.analyzeTranscriptSegment(
            userResponseBuffer,
            currentQuestion,
            interviewType,
            previousContext
          );
          
          const lastUserSegmentIndex = segments.length - 1 - [...segments].reverse().findIndex((s: TranscriptAnalysisSegment) => s.speaker === 'user');
          if (lastUserSegmentIndex >= 0) {
            segments[lastUserSegmentIndex].analysis = analysis;
            segments[lastUserSegmentIndex].questionContext = currentQuestion;
          }
          
          previousContext += `Q: ${currentQuestion}\nA: ${userResponseBuffer}\n`;
          userResponseBuffer = '';
        }
        
        segments.push({
          id: item.id,
          timestamp,
          speaker: 'assistant',
          text: item.text,
          questionContext: currentQuestion
        });
      } else {
        // This is a user response
        userResponseBuffer += item.text + ' ';
        
        segments.push({
          id: item.id,
          timestamp,
          speaker: 'user',
          text: item.text,
          questionContext: currentQuestion
        });
        
        timeline.push({
          timestamp,
          type: 'response',
          content: item.text
        });
      }
    }
    
    // Analyze the final user response if exists
    if (userResponseBuffer.trim() && currentQuestion) {
      const analysis = await this.analyzeTranscriptSegment(
        userResponseBuffer,
        currentQuestion,
        interviewType,
        previousContext
      );
      
      const lastUserSegmentIndex = segments.length - 1 - [...segments].reverse().findIndex((s: TranscriptAnalysisSegment) => s.speaker === 'user');
      if (lastUserSegmentIndex >= 0) {
        segments[lastUserSegmentIndex].analysis = analysis;
        segments[lastUserSegmentIndex].questionContext = currentQuestion;
      }
    }
    
    // Generate overall analysis
    const overallAnalysis = await this.generateOverallAnalysis(segments, interviewType);
    
    return {
      segments,
      overallAnalysis,
      timeline
    };
  }

  private async generateOverallAnalysis(
    segments: TranscriptAnalysisSegment[],
    interviewType: string
  ): Promise<TranscriptAnalysisResult['overallAnalysis']> {
    const userSegments = segments.filter(s => s.speaker === 'user' && s.analysis);
    
    if (userSegments.length === 0) {
      return this.getDefaultOverallAnalysis();
    }
    
    // Calculate average scores
    const averageScores = {
      clarity: 0,
      relevance: 0,
      depth: 0,
      confidence: 0,
      structure: 0
    };
    
    let totalScore = 0;
    
    userSegments.forEach(segment => {
      if (segment.analysis) {
        Object.keys(averageScores).forEach(key => {
          averageScores[key as keyof typeof averageScores] += segment.analysis!.scores[key as keyof typeof segment.analysis.scores];
        });
        totalScore += segment.analysis.scores.overall;
      }
    });
    
    Object.keys(averageScores).forEach(key => {
      averageScores[key as keyof typeof averageScores] = 
        Math.round(averageScores[key as keyof typeof averageScores] / userSegments.length);
    });
    
    totalScore = Math.round(totalScore / userSegments.length);
    
    // Collect all strengths and improvements
    const allStrengths = userSegments.flatMap(s => s.analysis?.strengths || []);
    const allImprovements = userSegments.flatMap(s => s.analysis?.improvements || []);
    
    // Get unique strengths and improvements
    const keyStrengths = [...new Set(allStrengths)].slice(0, 5);
    const primaryImprovements = [...new Set(allImprovements)].slice(0, 5);
    
    const overallAnalysisPrompt = `
Based on this interview performance data, provide a comprehensive overall analysis:

PERFORMANCE DATA:
- Total Score: ${totalScore}/10
- Average Scores: ${JSON.stringify(averageScores)}
- Key Strengths: ${keyStrengths.join(', ')}
- Primary Improvements: ${primaryImprovements.join(', ')}
- Interview Type: ${interviewType}
- Number of Responses: ${userSegments.length}

Provide analysis in this JSON format:
{
  "interviewFlow": "Assessment of how well the conversation flowed",
  "communication": "Overall communication effectiveness analysis",
  "overallFeedback": "Comprehensive feedback and recommendations"
}
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert interview coach providing comprehensive analysis. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: overallAnalysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) {
        const analysis = JSON.parse(content);
        return {
          totalScore,
          averageScores,
          keyStrengths,
          primaryImprovements,
          ...analysis
        };
      }
    } catch (error) {
      console.error('Error generating overall analysis:', error);
    }
    
    return {
      totalScore,
      averageScores,
      keyStrengths,
      primaryImprovements,
      interviewFlow: "Standard interview flow maintained throughout the conversation.",
      communication: "Communication was clear and professional.",
      overallFeedback: "Overall performance shows room for improvement with specific focus areas identified."
    };
  }

  private getDefaultFeedback(): TranscriptFeedback {
    return {
      overall: "Analysis not available",
      strengths: [],
      improvements: [],
      specificComments: [],
      scores: {
        clarity: 5,
        relevance: 5,
        depth: 5,
        confidence: 5,
        structure: 5,
        overall: 5
      },
      category: 'fair',
      actionableAdvice: [],
      rewriteSuggestions: {
        restructure: '',
        concise: ''
      }
    };
  }

  private getDefaultOverallAnalysis(): TranscriptAnalysisResult['overallAnalysis'] {
    return {
      totalScore: 5,
      averageScores: {
        clarity: 5,
        relevance: 5,
        depth: 5,
        confidence: 5,
        structure: 5
      },
      keyStrengths: [],
      primaryImprovements: [],
      interviewFlow: "Analysis not available",
      communication: "Analysis not available",
      overallFeedback: "Analysis not available"
    };
  }
}
