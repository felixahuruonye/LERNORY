// Motivation Coach
// Provides personalized encouragement and learning insights

export interface MotivationalMessage {
  message: string;
  type: "encouragement" | "reminder" | "tip" | "achievement" | "warning";
  icon: string;
}

/**
 * Generate motivational message based on user performance
 */
export function generateMotivationalMessage(userStats: any): MotivationalMessage {
  const { streak, averageScore, totalQuestionsAttempted, weakTopics, strongTopics, lastStudyTime } = userStats;
  
  // Streak motivation
  if (streak >= 30) {
    return {
      message: `🔥 You've maintained a ${streak}-day study streak! You're unstoppable. Keep crushing it!`,
      type: "achievement",
      icon: "⚡",
    };
  } else if (streak >= 7) {
    return {
      message: `🎯 ${streak} days of consistency! You're building real momentum. Just ${30 - streak} more days for legend status!`,
      type: "encouragement",
      icon: "🚀",
    };
  }
  
  // Performance-based motivation
  if (averageScore >= 90) {
    return {
      message: `💯 Your ${averageScore}% average score is outstanding! You're ready for the exam. Keep focused!`,
      type: "achievement",
      icon: "🏆",
    };
  } else if (averageScore >= 75) {
    return {
      message: `✨ You're at ${averageScore}% - solid progress! One more push to reach 90%+`,
      type: "encouragement",
      icon: "💪",
    };
  } else if (averageScore >= 60) {
    return {
      message: `📈 At ${averageScore}%, you're on the right track. Focus on your weak areas: ${weakTopics.slice(0, 2).join(", ")}`,
      type: "tip",
      icon: "🎯",
    };
  } else {
    return {
      message: `💡 You're at ${averageScore}%. Don't worry - increased focus on ${weakTopics[0]} will boost your score quickly!`,
      type: "reminder",
      icon: "🌟",
    };
  }
}

/**
 * Generate daily study reminder
 */
export function generateDailyReminder(time: Date, userStats: any): MotivationalMessage {
  const hour = time.getHours();
  const { streak, studyGoalToday } = userStats;
  
  let message = "";
  let icon = "";
  
  if (hour < 7) {
    message = `🌅 Early bird! Starting your day strong. Let's get ${studyGoalToday} minutes of quality study in!`;
    icon = "✨";
  } else if (hour < 12) {
    message = `⏰ Good morning! Don't break your ${streak}-day streak. Study session time!`;
    icon = "📚";
  } else if (hour < 17) {
    message = `☀️ Afternoon boost needed! Get some revision done to stay on track.`;
    icon = "💪";
  } else if (hour < 21) {
    message = `🎯 Evening push! Solidify today's learning with a quick ${studyGoalToday}-minute session.`;
    icon = "🔥";
  } else {
    message = `🌙 Night owl studying? Great dedication! Don't overdo it - get some rest too!`;
    icon = "😴";
  }
  
  return {
    message,
    type: "reminder",
    icon,
  };
}

/**
 * Generate exam-specific encouragement
 */
export function generateExamEncouragement(daysUntilExam: number, averageScore: number): MotivationalMessage {
  if (daysUntilExam <= 1) {
    return {
      message: `🎯 EXAM DAY IS HERE! You've prepared well. Trust your training, stay calm, and give your best. You've got this! 💯`,
      type: "encouragement",
      icon: "🏆",
    };
  } else if (daysUntilExam <= 3) {
    return {
      message: `⚡ ${daysUntilExam} days to the exam! Final touches: review weak topics, get good sleep, trust your preparation!`,
      type: "reminder",
      icon: "🚀",
    };
  } else if (daysUntilExam <= 7) {
    return {
      message: `📚 Final week push! You're at ${averageScore}%. One more week of focus can get you to 90%+!`,
      type: "encouragement",
      icon: "💪",
    };
  } else if (daysUntilExam <= 14) {
    return {
      message: `🎓 Two weeks out. ${averageScore}% is great, but let's aim higher! Intensive review time!`,
      type: "tip",
      icon: "🎯",
    };
  } else {
    return {
      message: `You have ${daysUntilExam} days. Your current score is ${averageScore}%. Keep consistent study to reach 350+ on JAMB!`,
      type: "reminder",
      icon: "📈",
    };
  }
}

/**
 * Generate performance-based tips
 */
export function generatePerformanceTip(subject: string, weakAreas: string[]): MotivationalMessage {
  const tips: Record<string, string> = {
    Mathematics: "Focus on formula derivations, not just memorization. Practice past questions with full working shown.",
    Physics: "Draw diagrams for every problem. Physics is about understanding concepts, not just calculations.",
    Chemistry: "Balance equations step-by-step. Know oxidation states. Practice reaction types repeatedly.",
    Biology: "Draw and label diagrams. Learn processes in sequence. Connect structure to function.",
    English: "Read widely. Practice essay structure (intro → 3 points → conclusion). Proofread your work.",
    Government: "Make mind maps of institutions. Know processes and stakeholders. Connect to Nigerian context.",
    Commerce: "Master double-entry bookkeeping. Understand accounting standards. Practice calculations.",
  };
  
  const tip = tips[subject] || "Consistent practice of past questions is your best strategy!";
  
  return {
    message: `💡 TIP FOR ${subject.toUpperCase()}: ${tip}`,
    type: "tip",
    icon: "🎯",
  };
}

/**
 * Celebrate milestones
 */
export function celebrateMilestone(achievement: string): MotivationalMessage {
  const celebrations: Record<string, MotivationalMessage> = {
    "perfect_quiz": {
      message: `🌟 PERFECT SCORE! 100% on this quiz! You've truly mastered this topic!`,
      type: "achievement",
      icon: "🏆",
    },
    "first_week": {
      message: `🎉 You completed your first full week of study! Consistency is key - keep it up!`,
      type: "achievement",
      icon: "💫",
    },
    "subject_mastery": {
      message: `🧠 Subject Mastery Unlocked! You're now an expert in this area!`,
      type: "achievement",
      icon: "⭐",
    },
    "level_up": {
      message: `🚀 LEVEL UP! You've reached a new level. Your efforts are paying off!`,
      type: "achievement",
      icon: "⬆️",
    },
    "badge_earned": {
      message: `🎖️ BADGE EARNED! Another achievement to add to your collection!`,
      type: "achievement",
      icon: "🏅",
    },
  };
  
  return celebrations[achievement] || {
    message: `🎉 Great achievement! Keep this momentum going!`,
    type: "achievement",
    icon: "✨",
  };
}
