// Gamification System
// Tracks XP, badges, streaks, levels, and unlockables

export interface UserGameProfile {
  userId: string;
  totalXP: number;
  level: number;
  currentLevelXP: number;
  maxLevelXP: number;
  streak: number;
  streakLevel: "bronze" | "silver" | "gold" | "platinum";
  badges: Badge[];
  unlockedTools: string[];
  totalQuestionsAnswered: number;
  perfectQuizzes: number;
  subjectMastery: Record<string, number>; // subject -> mastery percentage
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: "subject" | "achievement" | "streak" | "performance";
}

/**
 * Calculate XP reward for an activity
 */
export function calculateXPReward(
  activity: "question_correct" | "quiz_completed" | "exam_taken" | "lesson_finished" | "perfect_score",
  multiplier: number = 1
): number {
  const baseXP: Record<string, number> = {
    question_correct: 10,
    quiz_completed: 50,
    exam_taken: 100,
    lesson_finished: 30,
    perfect_score: 150,
  };
  
  return (baseXP[activity] || 0) * multiplier;
}

/**
 * Check if user should level up
 */
export function checkLevelUp(profile: UserGameProfile): UserGameProfile {
  const nextLevelThreshold = profile.maxLevelXP;
  
  if (profile.currentLevelXP >= nextLevelThreshold) {
    profile.level++;
    profile.currentLevelXP = 0;
    profile.maxLevelXP = Math.floor(nextLevelThreshold * 1.2); // 20% increase per level
  }
  
  return profile;
}

/**
 * Award badge to user
 */
export function awardBadge(
  userId: string,
  profile: UserGameProfile,
  badgeType: string
): { badge: Badge | null; isNew: boolean } {
  const badgeDefinitions: Record<string, Omit<Badge, "unlockedAt">> = {
    math_wizard: {
      id: "math_wizard",
      name: "Math Wizard",
      description: "Answered 100 math questions correctly",
      icon: "🧙‍♂️",
      category: "subject",
    },
    physics_guru: {
      id: "physics_guru",
      name: "Physics Guru",
      description: "Achieved 90%+ in physics exams",
      icon: "⚛️",
      category: "subject",
    },
    week_warrior: {
      id: "week_warrior",
      name: "Week Warrior",
      description: "Maintained a 7-day study streak",
      icon: "⚔️",
      category: "streak",
    },
    month_master: {
      id: "month_master",
      name: "Month Master",
      description: "Maintained a 30-day study streak",
      icon: "👑",
      category: "streak",
    },
    perfect_student: {
      id: "perfect_student",
      name: "Perfect Student",
      description: "Scored 100% on 5 quizzes",
      icon: "⭐",
      category: "achievement",
    },
    consistency_king: {
      id: "consistency_king",
      name: "Consistency King",
      description: "Studied every day for 14 days",
      icon: "👶",
      category: "achievement",
    },
  };

  const badgeDef = badgeDefinitions[badgeType];
  if (!badgeDef) return { badge: null, isNew: false };

  // Check if already have badge
  const existing = profile.badges.find((b) => b.id === badgeType);
  if (existing) return { badge: null, isNew: false };

  const newBadge: Badge = {
    ...badgeDef,
    unlockedAt: new Date(),
  };

  profile.badges.push(newBadge);
  return { badge: newBadge, isNew: true };
}

/**
 * Update streak
 */
export function updateStreak(profile: UserGameProfile, studiedToday: boolean): void {
  if (studiedToday) {
    profile.streak++;
    
    // Update streak level
    if (profile.streak >= 100) {
      profile.streakLevel = "platinum";
    } else if (profile.streak >= 30) {
      profile.streakLevel = "gold";
    } else if (profile.streak >= 7) {
      profile.streakLevel = "silver";
    } else {
      profile.streakLevel = "bronze";
    }
  } else {
    // Break streak if didn't study
    if (profile.streak > 0) {
      profile.streak = 0;
      profile.streakLevel = "bronze";
    }
  }
}

/**
 * Get locked vs unlocked tools
 */
export function getUnlockableTools(): Record<string, { name: string; unlocksAt: number; icon: string }> {
  return {
    video_explanations: {
      name: "Video Explanations",
      unlocksAt: 500,
      icon: "🎥",
    },
    ai_voice_tutor: {
      name: "AI Voice Tutor",
      unlocksAt: 1000,
      icon: "🎤",
    },
    custom_exams: {
      name: "Custom Exams",
      unlocksAt: 200,
      icon: "📝",
    },
    offline_mode: {
      name: "Offline Learning",
      unlocksAt: 300,
      icon: "📱",
    },
    advanced_analytics: {
      name: "Advanced Analytics",
      unlocksAt: 750,
      icon: "📊",
    },
  };
}

/**
 * Check which tools should be unlocked
 */
export function checkUnlockedTools(profile: UserGameProfile): string[] {
  const allTools = getUnlockableTools();
  const unlocked: string[] = [];

  Object.entries(allTools).forEach(([toolId, tool]) => {
    if (profile.totalXP >= tool.unlocksAt) {
      unlocked.push(toolId);
    }
  });

  return unlocked;
}

/**
 * Get user title based on level and achievements
 */
export function getUserTitle(profile: UserGameProfile): string {
  if (profile.level >= 50) return "Legendary Learner";
  if (profile.level >= 40) return "Master Scholar";
  if (profile.level >= 30) return "Expert Tutor";
  if (profile.level >= 20) return "Advanced Learner";
  if (profile.level >= 10) return "Dedicated Student";
  if (profile.level >= 5) return "Enthusiastic Learner";
  return "Aspiring Scholar";
}
