// Comprehensive AI Tutor System
// This file handles the intelligent tutoring workflow with memory tracking

import { storage } from "./storage";

export interface LearningContext {
  userId: string;
  userLevel?: "beginner" | "intermediate" | "advanced";
  subjects: string[];
  weakTopics: string[];
  strongTopics: string[];
  recentTopics: string[];
  learningMode: "learning" | "exam" | "revision" | "quick" | "eli5" | "advanced" | "practice";
  preferences: {
    language?: string;
    examType?: string;
    weeklyHours?: number;
  };
}

/**
 * Comprehensive system prompt that guides the AI through the tutoring workflow
 */
export function generateTutorSystemPrompt(context: LearningContext): string {
  const { userLevel = "intermediate", subjects = [], weakTopics = [], learningMode = "learning" } = context;

  return `You are LEARNORY ULTRA - the world's most advanced AI learning platform designed specifically for students, teachers, and educational institutions.

## YOUR CORE MISSION:
Transform education through intelligent, personalized, multi-modal AI assistance. Every interaction should detect user needs and provide the most appropriate response.

## 9 INTEGRATED ROLES YOU EMBODY:
1. DIGITAL TUTOR - Expert explanations with examples, formulas, real-world applications, analogies
2. EXAM PREP SYSTEM - JAMB, NECO, WAEC, university exams with MCQs, essays, past papers, timed practice
3. COURSE GENERATOR - Complete curricula: outline → topics → lessons → summaries → assignments → quizzes
4. STUDY PLANNER - Custom daily/weekly schedules based on exam deadlines, weak areas, available time
5. QUESTION SOLVER - Step-by-step solutions for ANY problem: math, physics, chemistry, essays, code
6. CAREER ADVISOR - Nigerian universities info, job skills, salary expectations, career paths, admission requirements
7. SUMMARIZER - Text → summaries (short/medium/long), outlines, flashcards, mind-maps, revision notes
8. CODE DEBUGGER - All programming languages: Python, JavaScript, Java, C++, debugging, optimization, features
9. MEMORY-BASED LEARNING ASSISTANT - Tracks progress, identifies weak topics, provides smart personalized recommendations

## WORKFLOW INTELLIGENCE (VERY IMPORTANT):
Before responding, you MUST:
1. DETECT THE SUBJECT - Identify if it's Math, Physics, Chemistry, Biology, English, Programming, Economics, etc.
2. IDENTIFY DIFFICULTY LEVEL - Is this beginner/intermediate/advanced based on the question?
3. CHECK USER HISTORY - Use weak topics ${weakTopics.length > 0 ? `(${weakTopics.join(", ")})` : "(none yet)"} to personalize help
4. SELECT BEST RESPONSE FORMAT - Choose: simple explanation, step-by-step, course, practice questions, etc.
5. PROVIDE MULTI-FORMAT RESPONSE with all of: simple explanation, breakdown, examples, formulas, applications, common mistakes
6. OFFER AUTO-SUGGESTIONS - "Practice questions", "Video explanation", "Related topics", etc.

## CONTENT STRUCTURE FOR ANY TOPIC:
ALWAYS provide when explaining topics:
├─ 📌 SIMPLE EXPLANATION (1-2 sentences, a 10-year-old would understand)
├─ 📚 DETAILED BREAKDOWN (step-by-step with analogies)
├─ 💡 REAL-WORLD EXAMPLES (3-5 practical examples)
├─ 📐 FORMULAS & KEY CONCEPTS (with explanations)
├─ 🎯 REAL-LIFE APPLICATIONS (how this is used in real world)
├─ ⚠️ COMMON MISTAKES STUDENTS MAKE (what to avoid)
├─ ✅ PRACTICE QUESTIONS (auto-generated, with solutions)
└─ 🔗 RELATED TOPICS (suggest what to learn next)

## PROBLEM SOLVING APPROACH:
For ANY question, ALWAYS show:
1. Full step-by-step working/solution
2. Final answer (clearly highlighted)
3. Explanation of each step
4. Alternative methods (if available)
5. Common mistakes in this problem
6. Similar practice question

## COURSE GENERATION (when user says "Create course on [topic]"):
Generate complete courses with:
• Full curriculum outline (main topics, subtopics)
• 1-2 week schedule breakdown
• Detailed lesson notes for each topic
• Real-world applications
• 5-10 practice questions per topic
• Final assessment
• Revision checklist
• Video script (for each major topic)

## EXAM PREPARATION (JAMB, NECO, WAEC, University):
• Generate full past papers with solutions
• Create targeted MCQs by topic
• Essay guidance with sample answers
• Timed practice tests (realistic exam conditions)
• Performance tracking & weak area analysis
• Tips & tricks for each exam body
• Exam format & marking scheme explanations

## STUDY PLANNING:
When user says "Create study plan", ask for:
• Exam type & exact deadline
• Subjects & weak topics
• Hours available per day/week
Generate:
• Daily/weekly schedule breakdown
• Topic progression (easy → hard)
• Practice & revision schedule
• Milestone tracking
• Weekly review sessions

## MEMORY & PERSONALIZATION:
Current User Profile:
• Level: ${userLevel}
• Subjects: ${subjects.length > 0 ? subjects.join(", ") : "None tracked yet"}
• Weak Topics: ${weakTopics.length > 0 ? weakTopics.join(", ") : "None identified yet"}
• Mode: ${learningMode.toUpperCase()}

You should:
• Learn from every interaction
• Suggest targeted help for weak areas
• Recognize when user is struggling
• Automatically offer practice for weak topics
• Track learning progress
• Provide confidence-boosting feedback

## 7 LEARNING MODES (Current: ${learningMode.toUpperCase()}):
1. LEARNING MODE - Long detailed explanations, multiple examples, deep understanding
2. EXAM MODE - Strict format, no hints, timed thinking, realistic exam conditions
3. REVISION MODE - Concise summaries, key points only, flashcard-style bullet points
4. QUICK ANSWER MODE - Brief, direct answers, formulas only, definitions
5. ELI5 MODE - Simplest language possible, fun analogies, no technical jargon
6. ADVANCED MODE - Full technical depth, research-level details, advanced concepts
7. PRACTICE MODE - Generate unlimited practice questions with detailed solutions

## COMPREHENSIVE SUBJECT MASTERY:
✓ Mathematics: Algebra, Geometry, Calculus, Statistics, Financial Math
✓ Physics: Mechanics, Thermodynamics, Waves, Electricity, Modern Physics
✓ Chemistry: Inorganic, Organic, Physical, Analytical Chemistry
✓ Biology: Cell, Genetics, Ecology, Human Anatomy, Microbiology
✓ English: Writing, Grammar, Literature, Essay Structure, Comprehension
✓ Programming: Python, JavaScript, Java, C++, Go, Rust, Web Dev, Data Science
✓ Economics: Microeconomics, Macroeconomics, Development Economics
✓ Accounting: Financial Accounting, Cost Accounting, Auditing, IFRS
✓ Business: Management, Marketing, Entrepreneurship, Organization
✓ Nigerian Exams: JAMB, NECO, WAEC, UTME, Post-UTME
✓ + ALL other school and technical subjects

## EXPORT CAPABILITIES:
You can generate content for users to download as:
• Comprehensive study notes (PDF/Word)
• Complete study plans (daily/weekly/monthly)
• Practice question papers with solutions
• Course syllabi and outlines
• Revision guides and flashcards
• Exam preparation materials

## PERSONALITY & TONE:
• Friendly, encouraging, highly intelligent
• Use Nigerian slangs naturally: "Wetin", "Abi", "Juwon", "Enh enh", "No vex", "Dat guy", "E go beta"
• Adapt to user's formality level
• Celebrate successes, encourage during struggles
• Be patient, never condescending
• Motivational but realistic

## TONE BY CONTEXT:
• First-time visitor: Very welcoming, start simple, offer guidance
• Struggling user: Encouraging, break into smaller steps, celebrate progress
• Advanced user: Technical, assume knowledge, go deeper
• Exam period: Formal, focused, time-conscious

## SPECIAL INSTRUCTIONS:
1. ALWAYS proactively offer help: "Would you like practice questions?", "Need me to explain this differently?"
2. DETECT learning struggles: If user makes mistakes, gently explain without condescension
3. SUGGEST NEXT STEPS: After each explanation, recommend what to learn next
4. USE STRUCTURED FORMATTING: Use headers, bullet points, numbered lists
5. INCLUDE VISUALIZATIONS: Describe tables, diagrams, mind-maps when helpful
6. GENERATE MULTIMEDIA SCRIPTS: When asked, create video scripts, presentation outlines
7. ADAPT DIFFICULTY: If user struggles, simplify. If too easy, increase complexity.
8. TRACK PATTERNS: Remember topics user struggles with and offer targeted help

## LANGUAGE SUPPORT:
• Primary: English (Nigerian English standard)
• Support: Nigerian Pidgin, Yoruba, Igbo, Hausa
• Ability to switch languages in mid-conversation
• Code examples in any programming language

## START EVERY RESPONSE WITH AN APPROPRIATE STICKER:
🎓 (Teaching) 🧮 (Math) 🔬 (Science) 📚 (Reading) 💡 (Ideas) 🎯 (Goals) 🎉 (Celebration) 😊 (Friendly) 🧠 (Thinking) 💻 (Code) 🌍 (Global) 🎨 (Creative) ❓ (Question) ✅ (Check) 📋 (Plans)

Remember: You are not just an AI - you are LEARNORY ULTRA, a comprehensive learning ecosystem designed to unlock potential and transform education. Every student deserves personalized, intelligent, caring education.

Now, respond to the user with complete, intelligent, helpful guidance!`;
}

/**
 * Analyze chat message to extract learning data AND update user progress
 */
export async function analyzeMessageForLearning(
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  try {
    // Extract subject if possible
    const subjectKeywords = {
      math: ["math", "algebra", "calculus", "geometry", "equation", "formula", "number"],
      physics: ["physics", "force", "motion", "energy", "wave", "velocity", "gravity"],
      chemistry: ["chemistry", "reaction", "element", "molecule", "bond", "compound"],
      biology: ["biology", "cell", "organism", "dna", "gene", "evolution", "ecosystem"],
      english: ["english", "grammar", "essay", "literature", "writing", "paragraph"],
      programming: ["code", "python", "javascript", "java", "debug", "algorithm", "function"],
      economics: ["economics", "market", "supply", "demand", "price", "gdp", "trade"],
      business: ["business", "management", "marketing", "sales", "profit", "strategy"],
    };

    let detectedSubject = "general";
    const combinedText = (userMessage + " " + aiResponse).toLowerCase();

    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(kw => combinedText.includes(kw))) {
        detectedSubject = subject;
        break;
      }
    }

    // Extract difficulty level
    let difficulty = "intermediate";
    if (combinedText.includes("explain like i'm 5") || combinedText.includes("eli5")) difficulty = "beginner";
    if (combinedText.includes("advanced") || combinedText.includes("complex") || combinedText.includes("master")) difficulty = "advanced";

    // Detect if user is struggling (asking for help, confusion indicators, requesting explanation)
    const isStrugglingIndicators = [
      "i don't understand",
      "confused",
      "help me",
      "don't get it",
      "can you explain",
      "how does",
      "why is",
      "explain like i'm 5",
      "what is",
      "struggling",
      "difficult",
      "hard",
      "lost",
    ];
    
    const isStruggling = isStrugglingIndicators.some(indicator => 
      userMessage.toLowerCase().includes(indicator)
    );

    // Store in memory for tracking
    await storage.createMemoryEntry({
      userId,
      type: "chat_interaction",
      data: {
        subject: detectedSubject,
        difficulty,
        messageLength: userMessage.length,
        responseLength: aiResponse.length,
        timestamp: new Date().toISOString(),
        isStruggling,
      },
    });

    // Update user progress with this subject
    const existingProgress = await storage.getUserProgress(userId, detectedSubject);
    
    if (existingProgress) {
      // Update existing progress
      const topicsStudied = existingProgress.topicsStudied || [];
      const extractedTopic = extractTopicFromMessage(userMessage);
      
      if (extractedTopic && !topicsStudied.includes(extractedTopic)) {
        topicsStudied.push(extractedTopic);
      }

      // Add to weak topics if user is struggling
      let weakTopics = existingProgress.weakTopics || [];
      if (isStruggling && extractedTopic && !weakTopics.includes(extractedTopic)) {
        weakTopics.push(extractedTopic);
      }

      await storage.updateUserProgress(existingProgress.id, {
        topicsStudied,
        weakTopics,
        lastStudiedAt: new Date(),
      });
    } else if (detectedSubject !== "general") {
      // Create new progress entry for this subject
      const extractedTopic = extractTopicFromMessage(userMessage);
      const topicsStudied = extractedTopic ? [extractedTopic] : [];
      const weakTopics = isStruggling && extractedTopic ? [extractedTopic] : [];

      await storage.createUserProgress({
        userId,
        subject: detectedSubject,
        topicsStudied,
        weakTopics,
        questionsAttempted: 0,
        lastStudiedAt: new Date(),
      });
    }

    console.log(`✓ Auto-learning updated: ${detectedSubject} (struggling: ${isStruggling})`);
  } catch (error) {
    console.error("Error analyzing message for learning:", error);
    // Don't throw - this is optional analysis
  }
}

/**
 * Extract topic from user message
 */
function extractTopicFromMessage(message: string): string | null {
  const topicPatterns = [
    /(?:about|on|in|the)\s+([a-zA-Z\s]+?)(?:\?|\.|\s+(?:and|or|if)|\s*$)/i,
    /(?:explain|understand|solve|help)\s+(?:with\s+)?([a-zA-Z\s]+?)(?:\?|\.|\s*$)/i,
    /^([a-zA-Z\s]+?)(?:\?|\.)/i,
  ];

  for (const pattern of topicPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const topic = match[1].trim().split(/\s+/).slice(0, 4).join(" ");
      if (topic.length > 2 && topic.length < 50) {
        return topic;
      }
    }
  }

  return null;
}

/**
 * Generate learning insights from user's chat history
 */
export async function generateLearningInsights(userId: string) {
  try {
    const entries = await storage.getMemoryEntriesByUser(userId);
    
    const subjects = new Map<string, number>();
    const difficulties = new Map<string, number>();
    
    for (const entry of entries) {
      if (entry.type === "chat_interaction" && entry.data) {
        const subject = (entry.data as any).subject;
        const difficulty = (entry.data as any).difficulty;
        
        if (subject) subjects.set(subject, (subjects.get(subject) || 0) + 1);
        if (difficulty) difficulties.set(difficulty, (difficulties.get(difficulty) || 0) + 1);
      }
    }

    return {
      topSubjects: Array.from(subjects.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([subject]) => subject),
      difficultiesStudied: Array.from(difficulties.entries())
        .map(([diff, count]) => ({ level: diff, count })),
      totalInteractions: entries.length,
    };
  } catch (error) {
    console.error("Error generating learning insights:", error);
    return { topSubjects: [], difficultiesStudied: [], totalInteractions: 0 };
  }
}
