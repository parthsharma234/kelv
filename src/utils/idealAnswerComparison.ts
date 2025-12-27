/**
 * Ideal Answer Comparison System
 *
 * This module provides functionality to compare user answers against ideal reference answers
 * using semantic similarity and keyword extraction.
 */

// --- TYPES ---
export interface IdealAnswer {
  questionPattern: RegExp; // Pattern to match questions
  idealText: string; // Reference answer
  keyPoints: string[]; // Critical points that should be mentioned
  category: 'behavioral' | 'technical' | 'situational';
  industry?: string; // Optional industry-specific answer
}

export interface AnswerComparisonResult {
  similarityScore: number; // 0-100
  missingKeyPoints: string[];
  coveredKeyPoints: string[];
  feedback: string;
}

// --- IDEAL ANSWER DATABASE ---
/**
 * Database of ideal answers for common interview questions
 * This will be expanded over time with more questions and industries
 */
export const IDEAL_ANSWERS: IdealAnswer[] = [
  // BEHAVIORAL QUESTIONS
  {
    questionPattern: /tell me about yourself|introduce yourself|walk me through your (resume|background)/i,
    idealText: "I'm a [role] with [X years] of experience in [industry/domain]. In my current role at [company], I've [key achievement]. I specialize in [2-3 key skills], and I'm particularly passionate about [what drives you]. I'm excited about this opportunity because [connection to role].",
    keyPoints: [
      "Professional background summary",
      "Quantified achievements",
      "Relevant skills",
      "Connection to the role"
    ],
    category: 'behavioral'
  },
  {
    questionPattern: /tell me about a time (when|you) (failed|made a mistake|struggled)/i,
    idealText: "In my previous role, I was leading a project to implement [system/feature]. I underestimated the complexity of [specific challenge], which resulted in missing our deadline by [timeframe]. I took ownership immediately, communicated transparently with stakeholders, and developed a recovery plan. I learned to [specific lesson], and since then I've implemented [preventive measure]. This experience made me a more [positive outcome].",
    keyPoints: [
      "Specific situation described",
      "Ownership of mistake",
      "Actions taken to resolve",
      "Lesson learned",
      "How behavior changed going forward"
    ],
    category: 'behavioral'
  },
  {
    questionPattern: /tell me about a time (when|you) (succeeded|achieved|led|overcame|solved)/i,
    idealText: "At [company], I noticed [problem/opportunity]. I took initiative to [action], which involved [specific steps]. I collaborated with [team/stakeholders] to [what you did together]. The result was [quantified outcome: X% improvement, $Y saved, Z users impacted]. This taught me [key learning] and demonstrated my ability to [relevant skill].",
    keyPoints: [
      "Clear situation setup",
      "Specific task/challenge",
      "Detailed actions taken",
      "Quantified results",
      "Skills demonstrated"
    ],
    category: 'behavioral'
  },
  {
    questionPattern: /tell me about a time (when|you) worked (with|in) a (team|group|cross-functional)/i,
    idealText: "I worked with a cross-functional team of [roles] to deliver [project]. My role was [your responsibility]. I contributed by [specific contributions], and I helped resolve conflicts by [conflict resolution approach]. We successfully delivered [outcome] on time, and I learned the importance of [teamwork lesson].",
    keyPoints: [
      "Team composition described",
      "Your specific role",
      "Collaboration examples",
      "Handling challenges/conflicts",
      "Team outcomes"
    ],
    category: 'behavioral'
  },
  {
    questionPattern: /why do you want (this job|to work here|to join)/i,
    idealText: "I'm excited about this opportunity for three main reasons: First, [company mission/product alignment]. Second, [specific skill/technology you want to use]. Third, [growth/learning opportunity]. I've been following [company] because of [specific achievement/product], and I believe my background in [relevant experience] would allow me to contribute immediately to [specific team/project].",
    keyPoints: [
      "Company-specific research",
      "Alignment with role",
      "Skills match",
      "Genuine enthusiasm",
      "What you can contribute"
    ],
    category: 'behavioral'
  },

  // TECHNICAL QUESTIONS (Software Engineering)
  {
    questionPattern: /(explain|describe|what is) (rest|restful) (api|apis)/i,
    idealText: "REST is an architectural style for building APIs that use HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources. A RESTful API is stateless, meaning each request contains all necessary information. Resources are identified by URIs, and responses typically use JSON. For example, GET /users/123 retrieves user 123, while POST /users creates a new user. REST emphasizes scalability through caching and layered architecture.",
    keyPoints: [
      "HTTP methods explained",
      "Stateless nature",
      "Resource-based design",
      "JSON responses",
      "Scalability benefits"
    ],
    category: 'technical'
  },
  {
    questionPattern: /(explain|describe|what is) (object|oop|object-oriented)/i,
    idealText: "Object-Oriented Programming is a paradigm based on four pillars: Encapsulation (bundling data and methods), Abstraction (hiding complexity), Inheritance (reusing code through parent-child relationships), and Polymorphism (objects behaving differently based on context). For example, a 'Vehicle' class can be extended by 'Car' and 'Truck' classes, each with specific implementations of a 'move()' method.",
    keyPoints: [
      "Four pillars mentioned",
      "Encapsulation explained",
      "Inheritance example",
      "Polymorphism example",
      "Real-world analogy"
    ],
    category: 'technical'
  },

  // SITUATIONAL QUESTIONS
  {
    questionPattern: /what would you do if (you )?disagree(d)? (with|your)/i,
    idealText: "I would first seek to understand their perspective fully by asking clarifying questions. I'd present my viewpoint with supporting data or reasoning, focusing on the shared goal rather than personal preferences. If we still disagree, I'd propose we test both approaches with a small experiment or seek input from another team member. Ultimately, I respect that my manager makes the final call, and I'd commit to executing their decision with full effort while documenting learnings for future reference.",
    keyPoints: [
      "Listen and understand first",
      "Present data-driven argument",
      "Propose objective resolution",
      "Respect authority",
      "Commit to final decision"
    ],
    category: 'situational'
  },
  {
    questionPattern: /how would you (handle|deal with|manage) (tight|impossible) deadline/i,
    idealText: "I'd immediately assess what's truly essential versus nice-to-have, then communicate transparently with stakeholders about what's realistic. I'd break the work into phases, delivering an MVP first, then iterating. I'd look for opportunities to parallelize work or bring in additional resources. Throughout, I'd maintain clear communication about progress and risks. If the deadline is genuinely impossible, I'd present alternative timelines with trade-offs clearly explained.",
    keyPoints: [
      "Prioritization mentioned",
      "Stakeholder communication",
      "Phased delivery approach",
      "Resource management",
      "Transparency about constraints"
    ],
    category: 'situational'
  }
];

// --- SIMILARITY CALCULATION ---

/**
 * Calculate semantic similarity between user answer and ideal answer
 *
 * Note: This is a simplified implementation using keyword matching and structure analysis.
 * For production, consider using embeddings (OpenAI API, sentence-transformers, etc.)
 */
export class IdealAnswerComparator {

  /**
   * Find the best matching ideal answer for a given question
   */
  static findIdealAnswer(questionText: string, category?: 'behavioral' | 'technical' | 'situational'): IdealAnswer | null {
    for (const ideal of IDEAL_ANSWERS) {
      if (ideal.questionPattern.test(questionText)) {
        // If category is specified, only return if it matches
        if (category && ideal.category !== category) continue;
        return ideal;
      }
    }
    return null;
  }

  /**
   * Compare user answer against ideal answer and generate feedback
   */
  static compareAnswer(
    userAnswer: string,
    idealAnswer: IdealAnswer
  ): AnswerComparisonResult {
    const userLower = userAnswer.toLowerCase();

    // Check which key points are covered
    const coveredKeyPoints: string[] = [];
    const missingKeyPoints: string[] = [];

    idealAnswer.keyPoints.forEach(keyPoint => {
      // Simple keyword matching - check if key concepts from the key point appear in answer
      const keywords = this.extractKeywords(keyPoint);
      const isCovered = keywords.some(keyword => userLower.includes(keyword.toLowerCase()));

      if (isCovered) {
        coveredKeyPoints.push(keyPoint);
      } else {
        missingKeyPoints.push(keyPoint);
      }
    });

    // Calculate similarity score based on:
    // 1. Key points coverage (70% weight)
    // 2. Length appropriateness (15% weight)
    // 3. Structure indicators (15% weight)

    const keyPointsCoverage = (coveredKeyPoints.length / idealAnswer.keyPoints.length) * 70;

    const userWordCount = userAnswer.split(/\s+/).length;
    const lengthScore = this.calculateLengthScore(userWordCount) * 15;

    const structureScore = this.calculateStructureScore(userAnswer) * 15;

    const similarityScore = Math.min(100, Math.round(keyPointsCoverage + lengthScore + structureScore));

    // Generate feedback
    const feedback = this.generateFeedback(similarityScore, missingKeyPoints, coveredKeyPoints);

    return {
      similarityScore,
      missingKeyPoints,
      coveredKeyPoints,
      feedback
    };
  }

  /**
   * Extract key words from a key point description
   */
  private static extractKeywords(keyPoint: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about'];
    return keyPoint
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !commonWords.includes(word) && word.length > 2);
  }

  /**
   * Calculate score based on answer length
   */
  private static calculateLengthScore(wordCount: number): number {
    // Ideal answer length: 60-150 words
    if (wordCount >= 60 && wordCount <= 150) return 1.0;
    if (wordCount >= 40 && wordCount < 60) return 0.7;
    if (wordCount > 150 && wordCount <= 200) return 0.8;
    if (wordCount < 40) return Math.max(0.2, wordCount / 40 * 0.7);
    return 0.5; // Too long
  }

  /**
   * Calculate structure score based on STAR method indicators
   */
  private static calculateStructureScore(answer: string): number {
    const lowerAnswer = answer.toLowerCase();
    let score = 0;

    // Check for STAR indicators
    const starIndicators = [
      ['situation', 'context', 'background'],
      ['task', 'challenge', 'goal', 'problem'],
      ['action', 'did', 'implemented', 'created', 'developed'],
      ['result', 'outcome', 'achieved', 'improved', '%', 'increased', 'decreased']
    ];

    starIndicators.forEach(indicators => {
      if (indicators.some(word => lowerAnswer.includes(word))) {
        score += 0.25; // Each STAR component = 25%
      }
    });

    return score;
  }

  /**
   * Generate human-readable feedback
   */
  private static generateFeedback(
    score: number,
    missingKeyPoints: string[],
    coveredKeyPoints: string[]
  ): string {
    if (score >= 80) {
      return `Excellent answer! You covered ${coveredKeyPoints.length} key points effectively.`;
    } else if (score >= 60) {
      return `Good answer, but consider adding: ${missingKeyPoints.slice(0, 2).join(', ')}.`;
    } else if (score >= 40) {
      return `Your answer needs more detail. Missing key elements: ${missingKeyPoints.slice(0, 3).join(', ')}.`;
    } else {
      return `This answer needs significant improvement. Focus on including: ${missingKeyPoints.join(', ')}.`;
    }
  }

  /**
   * Batch process multiple questions
   */
  static batchCompare(questions: Array<{ questionText: string; userAnswer: string }>): AnswerComparisonResult[] {
    return questions.map(({ questionText, userAnswer }) => {
      const idealAnswer = this.findIdealAnswer(questionText);
      if (!idealAnswer) {
        return {
          similarityScore: 0,
          missingKeyPoints: [],
          coveredKeyPoints: [],
          feedback: 'No ideal answer reference available for this question type.'
        };
      }
      return this.compareAnswer(userAnswer, idealAnswer);
    });
  }
}
