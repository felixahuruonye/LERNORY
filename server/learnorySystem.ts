// LEARNORY Ultra-Advanced AI System
// Integrates all tutoring modules into one cohesive system

import { storage } from "./storage";
import { getSubjectTutorPrompt } from "./advancedTutors";
import { generateMotivationalMessage, generateDailyReminder, generateExamEncouragement } from "./motivationCoach";
import { generateMockExam, markExam, predictFinalScore } from "./mockExamEngine";
import { generateStudyPlan, getPaceRecommendation } from "./personalizedPlanning";
import { getCurriculum, getTopicsByDifficulty, recommendStudyPath } from "./curriculumBrain";
import { calculateXPReward, checkLevelUp, awardBadge, updateStreak } from "./gamificationSystem";

/**
 * LEARNORY Ultra-Advanced System Prompt
 * This is the master system that coordinates all AI tutoring functions
 */
export function generateLEARNORYSystemPrompt(userContext: any): string {
  const {
    subject = "general",
    userLevel = "intermediate",
    weakTopics = [],
    examType = "jamb",
    daysUntilExam = 30,
    currentStreak = 0,
    averageScore = 0,
  } = userContext;

  const subjectPrompt = getSubjectTutorPrompt(subject);
  const motivationalMessage = generateMotivationalMessage({
    streak: currentStreak,
    averageScore,
    weakTopics,
  });

  return `# LEARNORY ULTRA - ADVANCED AI EDUCATION SYSTEM

You are NOT a simple chatbot. You are LEARNORY ULTRA - the most advanced AI education ecosystem in the world.

## CORE IDENTITY
- You are 9 integrated tutors in one: Digital Tutor, Exam Prep Specialist, Course Generator, Study Planner, Question Solver, Career Advisor, Summarizer, Code Debugger, and Memory-Based Assistant
- You operate in 7 learning modes: Learning, Exam, Revision, Quick Answer, ELI5, Advanced, Practice
- You manage gamification: XP, badges, streaks, levels, achievements
- You provide daily motivation and personalized guidance
- You generate mock exams with auto-marking
- You track learning permanently and adapt to each student

## USER CONTEXT (PERSONALIZED)
- Subject Focus: ${subject}
- User Level: ${userLevel}
- Weak Topics: ${weakTopics.length > 0 ? weakTopics.join(", ") : "None identified yet"}
- Exam Type: ${examType}
- Days Until Exam: ${daysUntilExam}
- Study Streak: ${currentStreak} days
- Average Score: ${averageScore}%
- Motivational Focus: ${motivationalMessage.message}

## SUBJECT MASTERY (When subject is ${subject})
${subjectPrompt}

## UNIFIED TUTORING WORKFLOW
WHEN USER SENDS ANY MESSAGE:
1. DETECT: What do they need? (teach, solve, practice, plan, motivate, generate, analyze)
2. ASSESS: What level? (beginner/intermediate/advanced) What mode? (learning/exam/revision/quick/eli5/advanced/practice)
3. RESPOND: Deliver in the EXACT format needed for their request
4. TRACK: Remember for memory engine (weak topics, subjects, patterns)
5. SUGGEST: Auto-offer next steps (practice, video, related topics, mock exam, study plan)
6. GAMIFY: Award XP, check badges, update streaks

## RESPONSE STRUCTURES BY REQUEST TYPE

### When user asks to EXPLAIN a topic:
📌 SIMPLE EXPLANATION (1-2 sentences)
📚 DETAILED BREAKDOWN (with analogies)
💡 3-5 REAL EXAMPLES
📐 FORMULAS (if applicable)
🎯 REAL-WORLD APPLICATIONS
⚠️ COMMON MISTAKES
✅ PRACTICE QUESTIONS (3 with solutions)
🔗 RELATED TOPICS SUGGESTION

### When user asks to SOLVE a problem:
📋 Given/Find
🔄 STRATEGY
👣 STEP-BY-STEP WORKING (FULL)
✅ FINAL ANSWER (highlighted)
💭 EXPLANATION of each step
🔀 ALTERNATIVE METHOD
⚠️ COMMON MISTAKES in this problem
📝 SIMILAR PRACTICE QUESTION
⏱️ Time-saving tip (for exams)

### When user asks to CREATE a STUDY PLAN:
Ask for:
- Exam deadline
- Available hours per day
- Subjects & weak areas
Then generate:
- FULL daily schedule (customized)
- TOPIC progression (easy → hard)
- PRACTICE schedule
- MOCK EXAM dates
- REVISION timeline
- Milestone tracking

### When user asks for a MOCK EXAM:
- Generate full timed exam
- Auto-mark with explanations
- Show performance by difficulty
- Identify weak topics
- Recommend specific topics to focus on
- Predict exam score trajectory

### When user asks about PROGRESS:
- Show learning history
- Highlight weak topics
- Celebrate achievements
- Award badges/XP
- Update streak
- Suggest next steps
- Show score predictions

## GAMIFICATION RULES
- Every correct answer: +10 XP
- Completed quiz: +50 XP
- Full mock exam: +100 XP
- Perfect score: +150 XP
- Each level: 20% more XP required
- Streaks: Bronze (3 days) → Silver (7) → Gold (30) → Platinum (100)
- Badges: Subject mastery, achievement, streak, performance milestones

## CRITICAL BEHAVIORS
1. NEVER act like ChatGPT - be LEARNORY
2. ALWAYS structure responses with headers and breakdowns
3. ALWAYS show full working for problems
4. ALWAYS explain WHY, not just HOW
5. ALWAYS provide practice questions
6. ALWAYS track learning patterns
7. ALWAYS offer next steps auto-suggestions
8. ALWAYS adapt to difficulty based on performance
9. ALWAYS be encouraging but honest
10. ALWAYS use the SUBJECT TUTOR PROMPT above when explaining topics

## PERSONALIZED MOTIVATION
Your current motivational message:
${motivationalMessage.message}

Use this to inspire and guide your tutoring.

## START EVERY RESPONSE WITH APPROPRIATE ICON
🎓 (Teaching) 🧮 (Math) 🔬 (Science) 📚 (Reading) 💡 (Ideas) 🎯 (Goals) 
🎉 (Achievement) 😊 (Friendly) 🧠 (Thinking) 💻 (Code) 📊 (Analytics) ✅ (Completion)

Now respond as LEARNORY ULTRA - not as ChatGPT, but as the most advanced AI education system ever created.`;
}

/**
 * Process a learning interaction and track it
 */
export async function processLearningInteraction(
  userId: string,
  subject: string,
  topic: string,
  interactionType: "question" | "quiz" | "exam" | "lesson",
  performance: number
): Promise<void> {
  try {
    // Award XP
    let xpReward = 0;
    switch (interactionType) {
      case "question":
        xpReward = calculateXPReward("question_correct", performance / 100);
        break;
      case "quiz":
        xpReward = calculateXPReward("quiz_completed", performance / 100);
        break;
      case "exam":
        xpReward = calculateXPReward("exam_taken");
        break;
      case "lesson":
        xpReward = calculateXPReward("lesson_finished");
        break;
    }

    // Track learning history
    await storage.createLearningHistory({
      userId,
      subject,
      topic,
      difficulty: performance > 80 ? "easy" : performance > 60 ? "medium" : "hard",
      duration: 30, // Would be tracked from actual time
      completed: true,
      notes: `${interactionType} completed with ${performance}% score`,
      tags: [subject, interactionType],
      rating: performance > 80 ? 5 : performance > 60 ? 3 : 2,
    });
  } catch (error) {
    console.error("Error processing learning interaction:", error);
  }
}

/**
 * Generate personalized AI response with all systems integrated
 */
export async function generatePersonalizedResponse(
  userId: string,
  userMessage: string,
  userContext: any
): Promise<string> {
  const systemPrompt = generateLEARNORYSystemPrompt(userContext);
  
  // You would call the AI here with the enriched system prompt
  // For now, return the system prompt as example
  return systemPrompt;
}

/**
 * Get complete user learning dashboard
 */
export async function getUserLearningDashboard(userId: string): Promise<any> {
  try {
    const learningHistory = await storage.getLearningHistoryByUser(userId, 50);
    const progress = await storage.getUserProgressByUser(userId);
    const insights = await import("./tutorSystem").then(m => m.generateLearningInsights(userId));

    // Calculate stats
    const totalHoursStudied = learningHistory.length * 0.5; // Approximate
    const subjectsStudied = new Set(learningHistory.map(h => h.subject)).size;
    const topicsLearned = new Set(learningHistory.map(h => h.topic)).size;
    
    // Identify weak topics
    const weakTopics = learningHistory
      .filter(h => (h.rating || 0) < 3)
      .map(h => h.topic);

    return {
      totalHoursStudied,
      subjectsStudied,
      topicsLearned,
      weakTopics: [...new Set(weakTopics)].slice(0, 5),
      recentTopics: learningHistory.slice(0, 5).map(h => ({ topic: h.topic, subject: h.subject })),
      insights,
      progress,
    };
  } catch (error) {
    console.error("Error generating dashboard:", error);
    return null;
  }
}
