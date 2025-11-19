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
  memoryEntries,
  purchases,
  analyticsEvents,
  fileUploads,
  studentProfiles,
  schools,
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
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
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
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
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
}

export const storage = new DatabaseStorage();
