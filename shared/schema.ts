import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'teacher', 'admin', 'lecturer', 'school']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'paused', 'ended']);
export const quizDifficultyEnum = pgEnum('quiz_difficulty', ['easy', 'medium', 'hard']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);
export const learningModeEnum = pgEnum('learning_mode', ['learning', 'exam', 'revision', 'quick', 'eli5', 'advanced', 'practice']);
export const examTypeEnum = pgEnum('exam_type', ['waec', 'neco', 'jamb', 'university', 'custom']);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('student').notNull(),
  schoolId: varchar("school_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Schools table (multi-tenant)
export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).unique(),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true, createdAt: true });
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

// Student profiles
export const studentProfiles = pgTable("student_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  weakTopics: text("weak_topics").array(),
  completedCourses: text("completed_courses").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({ id: true, createdAt: true });
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type StudentProfile = typeof studentProfiles.$inferSelect;

// Courses
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  syllabus: jsonb("syllabus"),
  price: decimal("price", { precision: 10, scale: 2 }).default('0'),
  isPublished: boolean("is_published").default(false).notNull(),
  schoolId: varchar("school_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Lessons
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content").notNull(),
  transcriptId: varchar("transcript_id"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Live sessions
export const liveSessions = pgTable("live_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  status: sessionStatusEnum("status").default('active').notNull(),
  participants: text("participants").array(),
  settings: jsonb("settings"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const insertLiveSessionSchema = createInsertSchema(liveSessions).omit({ id: true, startedAt: true, endedAt: true });
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;
export type LiveSession = typeof liveSessions.$inferSelect;

// Transcripts
export const transcripts = pgTable("transcripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => liveSessions.id, { onDelete: 'cascade' }),
  segments: jsonb("segments").notNull(),
  audioUrl: text("audio_url"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({ id: true, createdAt: true });
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;

// Quizzes/Exams
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  difficulty: quizDifficultyEnum("difficulty").default('medium').notNull(),
  timeLimit: integer("time_limit"),
  questions: jsonb("questions").notNull(),
  rubric: jsonb("rubric"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id),
  answers: jsonb("answers").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  feedback: jsonb("feedback"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Chat Sessions (for organizing conversations into chat history)
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  mode: varchar("mode", { length: 50 }).default('chat'), // chat, writing, coding, image
  isBookmarked: boolean("is_bookmarked").default(false),
  messageCount: integer("message_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true, updatedAt: true, messageCount: true });
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

// Memory entries (student performance tracking)
export const memoryEntries = pgTable("memory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemoryEntrySchema = createInsertSchema(memoryEntries).omit({ id: true, createdAt: true });
export type InsertMemoryEntry = z.infer<typeof insertMemoryEntrySchema>;
export type MemoryEntry = typeof memoryEntries.$inferSelect;

// Purchases (marketplace)
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default('pending').notNull(),
  paystackReference: varchar("paystack_reference", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, createdAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

// Analytics events
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data"),
  schoolId: varchar("school_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, createdAt: true });
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// File uploads
export const fileUploads = pgTable("file_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  processingStatus: varchar("processing_status", { length: 50 }).default('pending').notNull(),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({ id: true, createdAt: true });
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;

// Study Plans
export const studyPlans = pgTable("study_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  subjects: text("subjects").array().notNull(),
  examType: examTypeEnum("exam_type"),
  deadline: timestamp("deadline"),
  hoursPerDay: integer("hours_per_day"),
  weakAreas: text("weak_areas").array(),
  schedule: jsonb("schedule"), // Daily breakdown
  progress: jsonb("progress"), // Tracking completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlans.$inferSelect;

// User Progress & Learning History
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar("subject", { length: 100 }).notNull(),
  topicsStudied: text("topics_studied").array(),
  weakTopics: text("weak_topics").array(),
  strongTopics: text("strong_topics").array(),
  questionsAttempted: integer("questions_attempted").default(0),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).default('0'),
  learningMode: learningModeEnum("learning_mode").default('learning'),
  preferredLanguage: varchar("preferred_language", { length: 50 }).default('English'),
  lastStudiedAt: timestamp("last_studied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// Code Snippets & Debugging
export const codeSnippets = pgTable("code_snippets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }),
  language: varchar("language", { length: 50 }).notNull(),
  code: text("code").notNull(),
  debugged: boolean("debugged").default(false),
  explanation: text("explanation"),
  fixedCode: text("fixed_code"),
  issues: jsonb("issues"), // Array of issues found
  learnings: text("learnings"), // Key points from debugging
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCodeSnippetSchema = createInsertSchema(codeSnippets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCodeSnippet = z.infer<typeof insertCodeSnippetSchema>;
export type CodeSnippet = typeof codeSnippets.$inferSelect;

// Exam Results & Performance Tracking
export const examResults = pgTable("exam_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  examName: varchar("exam_name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 100 }),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  score: decimal("score", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in minutes
  answers: jsonb("answers"), // User's answers with explanations
  topicsStrong: text("topics_strong").array(),
  topicsWeak: text("topics_weak").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExamResultSchema = createInsertSchema(examResults).omit({ id: true, createdAt: true });
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;
export type ExamResult = typeof examResults.$inferSelect;

// Generated Websites
export const generatedWebsites = pgTable("generated_websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  htmlCode: text("html_code").notNull(),
  cssCode: text("css_code").notNull(),
  jsCode: text("js_code"),
  previewUrl: text("preview_url"),
  tags: text("tags").array(),
  isFavorite: boolean("is_favorite").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGeneratedWebsiteSchema = createInsertSchema(generatedWebsites).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertGeneratedWebsite = z.infer<typeof insertGeneratedWebsiteSchema>;
export type GeneratedWebsite = typeof generatedWebsites.$inferSelect;

// Learning History - Track user's learning activities
export const learningHistory = pgTable("learning_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  difficulty: varchar("difficulty", { length: 50 }),
  duration: integer("duration"), // in minutes
  completed: boolean("completed").default(false),
  notes: text("notes"),
  rating: integer("rating"), // 1-5 user satisfaction rating
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLearningHistorySchema = createInsertSchema(learningHistory).omit({ id: true, createdAt: true });
export type InsertLearningHistory = z.infer<typeof insertLearningHistorySchema>;
export type LearningHistory = typeof learningHistory.$inferSelect;

// Generated Images - Store AI-generated images with metadata
export const generatedImages = pgTable("generated_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  context: varchar("context", { length: 100 }), // 'explain', 'course', 'custom'
  relatedTopic: varchar("related_topic", { length: 255 }),
  imageData: jsonb("image_data"), // base64 or image metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).omit({ id: true, createdAt: true });
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;

// Topic Explanations - Store detailed topic explanations for reference
export const topicExplanations = pgTable("topic_explanations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  simpleExplanation: text("simple_explanation"),
  detailedBreakdown: text("detailed_breakdown"),
  examples: jsonb("examples"), // Array of examples
  formulas: jsonb("formulas"), // Array of formulas
  realLifeApplications: jsonb("real_life_applications"), // Array of applications
  commonMistakes: jsonb("common_mistakes"), // Array of mistakes
  practiceQuestions: jsonb("practice_questions"), // Array of questions
  imageUrl: text("image_url"),
  difficulty: varchar("difficulty", { length: 50 }),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const insertTopicExplanationSchema = createInsertSchema(topicExplanations).omit({ id: true, generatedAt: true });
export type InsertTopicExplanation = z.infer<typeof insertTopicExplanationSchema>;
export type TopicExplanation = typeof topicExplanations.$inferSelect;

// Relations
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  courses: many(courses),
  chatMessages: many(chatMessages),
  chatSessions: many(chatSessions),
  memoryEntries: many(memoryEntries),
  purchases: many(purchases),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  lessons: many(lessons),
  quizzes: many(quizzes),
  purchases: many(purchases),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  createdBy: one(users, {
    fields: [lessons.createdById],
    references: [users.id],
  }),
}));

export const liveSessionsRelations = relations(liveSessions, ({ one, many }) => ({
  host: one(users, {
    fields: [liveSessions.hostId],
    references: [users.id],
  }),
  transcripts: many(transcripts),
}));

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  session: one(liveSessions, {
    fields: [transcripts.sessionId],
    references: [liveSessions.id],
  }),
  createdBy: one(users, {
    fields: [transcripts.createdById],
    references: [users.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  createdBy: one(users, {
    fields: [quizzes.createdById],
    references: [users.id],
  }),
  attempts: many(quizAttempts),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  student: one(users, {
    fields: [quizAttempts.studentId],
    references: [users.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  buyer: one(users, {
    fields: [purchases.buyerId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [purchases.courseId],
    references: [courses.id],
  }),
}));
