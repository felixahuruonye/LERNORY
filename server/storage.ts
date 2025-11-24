// Database integration blueprint reference: javascript_database
// Replit Auth integration blueprint reference: javascript_log_in_with_replit
import {
  users,
  courses,
  lessons,
  liveSessions,
  transcripts,
  quizzes,
  quizAttempts,
  chatMessages,
  chatSessions,
  memoryEntries,
  purchases,
  analyticsEvents,
  fileUploads,
  studentProfiles,
  schools,
  studyPlans,
  userProgress,
  codeSnippets,
  examResults,
  generatedWebsites,
  learningHistory,
  generatedImages,
  topicExplanations,
  notifications,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type LiveSession,
  type InsertLiveSession,
  type Transcript,
  type InsertTranscript,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type ChatMessage,
  type InsertChatMessage,
  type ChatSession,
  type InsertChatSession,
  type MemoryEntry,
  type InsertMemoryEntry,
  type Purchase,
  type InsertPurchase,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type FileUpload,
  type InsertFileUpload,
  type StudentProfile,
  type InsertStudentProfile,
  type School,
  type InsertSchool,
  type StudyPlan,
  type InsertStudyPlan,
  type UserProgress,
  type InsertUserProgress,
  type CodeSnippet,
  type InsertCodeSnippet,
  type ExamResult,
  type InsertExamResult,
  type GeneratedWebsite,
  type InsertGeneratedWebsite,
  type LearningHistory,
  type InsertLearningHistory,
  type GeneratedImage,
  type InsertGeneratedImage,
  type TopicExplanation,
  type InsertTopicExplanation,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined>;
  
  // Lesson operations
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Live session operations
  getLiveSession(id: string): Promise<LiveSession | undefined>;
  getLiveSessionsByHost(hostId: string): Promise<LiveSession[]>;
  createLiveSession(session: InsertLiveSession): Promise<LiveSession>;
  updateLiveSession(id: string, updates: Partial<InsertLiveSession>): Promise<LiveSession | undefined>;
  
  // Transcript operations
  getTranscript(id: string): Promise<Transcript | undefined>;
  getTranscriptsBySession(sessionId: string): Promise<Transcript[]>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  
  // Quiz operations
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesByCourse(courseId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  
  // Quiz attempt operations
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  getQuizAttemptsByStudent(studentId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  
  // Chat message operations
  getChatMessagesByUser(userId: string, limit?: number): Promise<ChatMessage[]>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessagesByUser(userId: string): Promise<void>;

  // Chat session operations
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: string): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: string, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(id: string): Promise<void>;
  
  // Memory entry operations
  getMemoryEntriesByUser(userId: string): Promise<MemoryEntry[]>;
  createMemoryEntry(entry: InsertMemoryEntry): Promise<MemoryEntry>;
  
  // Purchase operations
  getPurchase(id: string): Promise<Purchase | undefined>;
  getPurchasesByBuyer(buyerId: string): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchaseStatus(id: string, status: string): Promise<Purchase | undefined>;
  
  // Analytics operations
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  
  // File upload operations
  getFileUpload(id: string): Promise<FileUpload | undefined>;
  getFileUploadsByUser(userId: string): Promise<FileUpload[]>;
  createFileUpload(upload: InsertFileUpload): Promise<FileUpload>;
  updateFileUploadStatus(id: string, status: string, extractedText?: string): Promise<FileUpload | undefined>;

  // Study plan operations
  getStudyPlan(id: string): Promise<StudyPlan | undefined>;
  getStudyPlansByUser(userId: string): Promise<StudyPlan[]>;
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  updateStudyPlan(id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan | undefined>;

  // User progress operations
  getUserProgress(userId: string, subject: string): Promise<UserProgress | undefined>;
  getUserProgressByUser(userId: string): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: string, updates: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;

  // Code snippet operations
  getCodeSnippet(id: string): Promise<CodeSnippet | undefined>;
  getCodeSnippetsByUser(userId: string): Promise<CodeSnippet[]>;
  createCodeSnippet(snippet: InsertCodeSnippet): Promise<CodeSnippet>;
  updateCodeSnippet(id: string, updates: Partial<InsertCodeSnippet>): Promise<CodeSnippet | undefined>;

  // Exam result operations
  getExamResult(id: string): Promise<ExamResult | undefined>;
  getExamResultsByUser(userId: string): Promise<ExamResult[]>;
  createExamResult(result: InsertExamResult): Promise<ExamResult>;

  // Generated website operations
  getGeneratedWebsite(id: string): Promise<GeneratedWebsite | undefined>;
  getGeneratedWebsitesByUser(userId: string): Promise<GeneratedWebsite[]>;
  createGeneratedWebsite(website: InsertGeneratedWebsite): Promise<GeneratedWebsite>;
  updateGeneratedWebsite(id: string, updates: Partial<InsertGeneratedWebsite>): Promise<GeneratedWebsite | undefined>;
  deleteGeneratedWebsite(id: string): Promise<void>;
  toggleFavoriteWebsite(id: string, isFavorite: boolean): Promise<GeneratedWebsite | undefined>;
  incrementViewCount(id: string): Promise<GeneratedWebsite | undefined>;

  // Learning history operations
  createLearningHistory(history: InsertLearningHistory): Promise<LearningHistory>;
  getLearningHistoryByUser(userId: string, limit?: number): Promise<LearningHistory[]>;
  getLearningHistoryBySubject(userId: string, subject: string): Promise<LearningHistory[]>;

  // Generated image operations
  createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage>;
  getGeneratedImagesByUser(userId: string): Promise<GeneratedImage[]>;
  getGeneratedImagesByTopic(userId: string, topic: string): Promise<GeneratedImage[]>;
  deleteGeneratedImage(userId: string, imageId: string): Promise<void>;

  // Topic explanation operations
  createTopicExplanation(explanation: InsertTopicExplanation): Promise<TopicExplanation>;
  getTopicExplanation(userId: string, subject: string, topic: string): Promise<TopicExplanation | undefined>;
  getTopicExplanationsByUser(userId: string): Promise<TopicExplanation[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string, limit?: number): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isPublished, true));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  // Lesson operations
  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId));
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  // Live session operations
  async getLiveSession(id: string): Promise<LiveSession | undefined> {
    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, id));
    return session;
  }

  async getLiveSessionsByHost(hostId: string): Promise<LiveSession[]> {
    return await db.select().from(liveSessions).where(eq(liveSessions.hostId, hostId)).orderBy(desc(liveSessions.startedAt));
  }

  async createLiveSession(session: InsertLiveSession): Promise<LiveSession> {
    const [newSession] = await db.insert(liveSessions).values(session).returning();
    return newSession;
  }

  async updateLiveSession(id: string, updates: Partial<InsertLiveSession>): Promise<LiveSession | undefined> {
    const [updated] = await db
      .update(liveSessions)
      .set(updates)
      .where(eq(liveSessions.id, id))
      .returning();
    return updated;
  }

  // Transcript operations
  async getTranscript(id: string): Promise<Transcript | undefined> {
    const [transcript] = await db.select().from(transcripts).where(eq(transcripts.id, id));
    return transcript;
  }

  async getTranscriptsBySession(sessionId: string): Promise<Transcript[]> {
    return await db.select().from(transcripts).where(eq(transcripts.sessionId, sessionId));
  }

  async createTranscript(transcript: InsertTranscript): Promise<Transcript> {
    const [newTranscript] = await db.insert(transcripts).values(transcript).returning();
    return newTranscript;
  }

  // Quiz operations
  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  // Quiz attempt operations
  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt;
  }

  async getQuizAttemptsByStudent(studentId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.studentId, studentId));
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  // Chat message operations
  async getChatMessagesByUser(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async deleteChatMessagesByUser(userId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  }

  // Chat session operations
  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session;
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db.insert(chatSessions).values(session).returning();
    return newSession;
  }

  async updateChatSession(id: string, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    const [updated] = await db.update(chatSessions).set({ ...updates, updatedAt: new Date() }).where(eq(chatSessions.id, id)).returning();
    return updated;
  }

  async deleteChatSession(id: string): Promise<void> {
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
  }

  // Memory entry operations
  async getMemoryEntriesByUser(userId: string): Promise<MemoryEntry[]> {
    return await db.select().from(memoryEntries).where(eq(memoryEntries.userId, userId)).orderBy(desc(memoryEntries.createdAt));
  }

  async createMemoryEntry(entry: InsertMemoryEntry): Promise<MemoryEntry> {
    const [newEntry] = await db.insert(memoryEntries).values(entry).returning();
    return newEntry;
  }

  // Purchase operations
  async getPurchase(id: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async getPurchasesByBuyer(buyerId: string): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.buyerId, buyerId));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async updatePurchaseStatus(id: string, status: string): Promise<Purchase | undefined> {
    const [updated] = await db
      .update(purchases)
      .set({ paymentStatus: status as any })
      .where(eq(purchases.id, id))
      .returning();
    return updated;
  }

  // Analytics operations
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [newEvent] = await db.insert(analyticsEvents).values(event).returning();
    return newEvent;
  }

  // File upload operations
  async getFileUpload(id: string): Promise<FileUpload | undefined> {
    const [upload] = await db.select().from(fileUploads).where(eq(fileUploads.id, id));
    return upload;
  }

  async getFileUploadsByUser(userId: string): Promise<FileUpload[]> {
    return await db.select().from(fileUploads).where(eq(fileUploads.userId, userId));
  }

  async createFileUpload(upload: InsertFileUpload): Promise<FileUpload> {
    const [newUpload] = await db.insert(fileUploads).values(upload).returning();
    return newUpload;
  }

  async updateFileUploadStatus(id: string, status: string, extractedText?: string): Promise<FileUpload | undefined> {
    const updateData: any = { processingStatus: status };
    if (extractedText) {
      updateData.extractedText = extractedText;
    }
    const [updated] = await db
      .update(fileUploads)
      .set(updateData)
      .where(eq(fileUploads.id, id))
      .returning();
    return updated;
  }

  // Study plan operations
  async getStudyPlan(id: string): Promise<StudyPlan | undefined> {
    const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.id, id));
    return plan;
  }

  async getStudyPlansByUser(userId: string): Promise<StudyPlan[]> {
    return await db.select().from(studyPlans).where(eq(studyPlans.userId, userId));
  }

  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    const [newPlan] = await db.insert(studyPlans).values(plan).returning();
    return newPlan;
  }

  async updateStudyPlan(id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan | undefined> {
    const [updated] = await db.update(studyPlans).set({ ...updates, updatedAt: new Date() }).where(eq(studyPlans.id, id)).returning();
    return updated;
  }

  // User progress operations
  async getUserProgress(userId: string, subject: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(and(eq(userProgress.userId, userId), eq(userProgress.subject, subject)));
    return progress;
  }

  async getUserProgressByUser(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db.insert(userProgress).values(progress).returning();
    return newProgress;
  }

  async updateUserProgress(id: string, updates: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    const [updated] = await db.update(userProgress).set({ ...updates, updatedAt: new Date() }).where(eq(userProgress.id, id)).returning();
    return updated;
  }

  // Code snippet operations
  async getCodeSnippet(id: string): Promise<CodeSnippet | undefined> {
    const [snippet] = await db.select().from(codeSnippets).where(eq(codeSnippets.id, id));
    return snippet;
  }

  async getCodeSnippetsByUser(userId: string): Promise<CodeSnippet[]> {
    return await db.select().from(codeSnippets).where(eq(codeSnippets.userId, userId));
  }

  async createCodeSnippet(snippet: InsertCodeSnippet): Promise<CodeSnippet> {
    const [newSnippet] = await db.insert(codeSnippets).values(snippet).returning();
    return newSnippet;
  }

  async updateCodeSnippet(id: string, updates: Partial<InsertCodeSnippet>): Promise<CodeSnippet | undefined> {
    const [updated] = await db.update(codeSnippets).set({ ...updates, updatedAt: new Date() }).where(eq(codeSnippets.id, id)).returning();
    return updated;
  }

  // Exam result operations
  async getExamResult(id: string): Promise<ExamResult | undefined> {
    const [result] = await db.select().from(examResults).where(eq(examResults.id, id));
    return result;
  }

  async getExamResultsByUser(userId: string): Promise<ExamResult[]> {
    return await db.select().from(examResults).where(eq(examResults.userId, userId)).orderBy(desc(examResults.createdAt));
  }

  async createExamResult(result: InsertExamResult): Promise<ExamResult> {
    const [newResult] = await db.insert(examResults).values(result).returning();
    return newResult;
  }

  // Generated website operations
  async getGeneratedWebsite(id: string): Promise<GeneratedWebsite | undefined> {
    const [website] = await db.select().from(generatedWebsites).where(eq(generatedWebsites.id, id));
    return website;
  }

  async getGeneratedWebsitesByUser(userId: string): Promise<GeneratedWebsite[]> {
    return await db.select().from(generatedWebsites).where(eq(generatedWebsites.userId, userId)).orderBy(desc(generatedWebsites.createdAt));
  }

  async createGeneratedWebsite(website: InsertGeneratedWebsite): Promise<GeneratedWebsite> {
    const [newWebsite] = await db.insert(generatedWebsites).values(website).returning();
    return newWebsite;
  }

  async updateGeneratedWebsite(id: string, updates: Partial<InsertGeneratedWebsite>): Promise<GeneratedWebsite | undefined> {
    const [updated] = await db.update(generatedWebsites).set({ ...updates, updatedAt: new Date() }).where(eq(generatedWebsites.id, id)).returning();
    return updated;
  }

  async deleteGeneratedWebsite(id: string): Promise<void> {
    await db.delete(generatedWebsites).where(eq(generatedWebsites.id, id));
  }

  async toggleFavoriteWebsite(id: string, isFavorite: boolean): Promise<GeneratedWebsite | undefined> {
    const [updated] = await db.update(generatedWebsites).set({ isFavorite, updatedAt: new Date() }).where(eq(generatedWebsites.id, id)).returning();
    return updated;
  }

  async incrementViewCount(id: string): Promise<GeneratedWebsite | undefined> {
    const website = await this.getGeneratedWebsite(id);
    if (!website) return undefined;
    const [updated] = await db.update(generatedWebsites).set({ viewCount: (website.viewCount || 0) + 1, updatedAt: new Date() }).where(eq(generatedWebsites.id, id)).returning();
    return updated;
  }

  // Learning history operations
  async createLearningHistory(history: InsertLearningHistory): Promise<LearningHistory> {
    const [newHistory] = await db.insert(learningHistory).values(history).returning();
    return newHistory;
  }

  async getLearningHistoryByUser(userId: string, limit?: number): Promise<LearningHistory[]> {
    const query = db.select().from(learningHistory).where(eq(learningHistory.userId, userId)).orderBy(desc(learningHistory.createdAt));
    if (limit) return await query.limit(limit);
    return await query;
  }

  async getLearningHistoryBySubject(userId: string, subject: string): Promise<LearningHistory[]> {
    return await db.select().from(learningHistory).where(and(eq(learningHistory.userId, userId), eq(learningHistory.subject, subject))).orderBy(desc(learningHistory.createdAt));
  }

  // Generated image operations
  async createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage> {
    const [newImage] = await db.insert(generatedImages).values(image).returning();
    return newImage;
  }

  async getGeneratedImagesByUser(userId: string): Promise<GeneratedImage[]> {
    return await db.select().from(generatedImages).where(eq(generatedImages.userId, userId)).orderBy(desc(generatedImages.createdAt));
  }

  async getGeneratedImagesByTopic(userId: string, topic: string): Promise<GeneratedImage[]> {
    return await db.select().from(generatedImages).where(and(eq(generatedImages.userId, userId), eq(generatedImages.relatedTopic, topic))).orderBy(desc(generatedImages.createdAt));
  }

  async deleteGeneratedImage(userId: string, imageId: string): Promise<void> {
    await db.delete(generatedImages).where(and(eq(generatedImages.userId, userId), eq(generatedImages.id, imageId)));
  }

  // Topic explanation operations
  async createTopicExplanation(explanation: InsertTopicExplanation): Promise<TopicExplanation> {
    const [newExplanation] = await db.insert(topicExplanations).values(explanation).returning();
    return newExplanation;
  }

  async getTopicExplanation(userId: string, subject: string, topic: string): Promise<TopicExplanation | undefined> {
    const [explanation] = await db.select().from(topicExplanations).where(and(eq(topicExplanations.userId, userId), eq(topicExplanations.subject, subject), eq(topicExplanations.topic, topic)));
    return explanation;
  }

  async getTopicExplanationsByUser(userId: string): Promise<TopicExplanation[]> {
    return await db.select().from(topicExplanations).where(eq(topicExplanations.userId, userId)).orderBy(desc(topicExplanations.generatedAt));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
