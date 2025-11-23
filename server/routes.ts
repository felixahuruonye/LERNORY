// Replit Auth integration blueprint reference: javascript_log_in_with_replit
// WebSocket integration blueprint reference: javascript_websocket
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import os from "os";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  chatWithAI,
  generateLesson,
  generateSyllabus,
  gradeQuiz,
  transcribeAudio,
  generateSpeech,
  summarizeText,
  generateFlashcards,
} from "./openai";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Chat routes
  app.get('/api/chat/messages', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getChatMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/send', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { content } = req.body;

      // Save user message
      await storage.createChatMessage({
        userId,
        role: "user",
        content,
        attachments: null,
      });

      // Get conversation history
      const history = await storage.getChatMessagesByUser(userId, 10);
      const messages = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response
      const aiResponse = await chatWithAI(messages);

      // Save AI response
      await storage.createChatMessage({
        userId,
        role: "assistant",
        content: aiResponse,
        attachments: null,
      });

      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Live Session routes
  app.get('/api/live-sessions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getLiveSessionsByHost(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/live-sessions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { title, settings } = req.body;

      const session = await storage.createLiveSession({
        hostId: userId,
        title,
        status: 'active',
        participants: [userId],
        settings: settings || {},
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch('/api/live-sessions/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const session = await storage.updateLiveSession(id, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Transcript routes
  app.post('/api/transcripts', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId, segments, audioUrl } = req.body;

      const transcript = await storage.createTranscript({
        sessionId,
        segments,
        audioUrl,
        createdById: userId,
      });

      res.json(transcript);
    } catch (error) {
      console.error("Error creating transcript:", error);
      res.status(500).json({ message: "Failed to create transcript" });
    }
  });

  // Lesson routes
  app.get('/api/lessons', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { courseId } = req.query;
      let lessons;

      if (courseId) {
        lessons = await storage.getLessonsByCourse(courseId as string);
      } else {
        lessons = [];
      }

      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post('/api/lessons/generate', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { transcriptText, courseId } = req.body;

      // Use AI to generate structured lesson
      const lessonData = await generateLesson(transcriptText);

      const lesson = await storage.createLesson({
        courseId: courseId || null,
        title: lessonData.title,
        content: lessonData,
        createdById: userId,
      });

      res.json(lesson);
    } catch (error) {
      console.error("Error generating lesson:", error);
      res.status(500).json({ message: "Failed to generate lesson" });
    }
  });

  // Course routes
  app.get('/api/courses', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      let courses;
      if (user?.role === 'teacher' || user?.role === 'lecturer' || user?.role === 'school') {
        courses = await storage.getCoursesByTeacher(userId);
      } else {
        courses = await storage.getAllCourses();
      }

      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, price } = req.body;

      const course = await storage.createCourse({
        teacherId: userId,
        title,
        description,
        price: price || '0',
        syllabus: null,
        isPublished: false,
        schoolId: null,
      });

      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.post('/api/courses/generate-syllabus', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { topic } = req.body;

      // Use AI to generate syllabus
      const syllabus = await generateSyllabus(topic);

      res.json(syllabus);
    } catch (error) {
      console.error("Error generating syllabus:", error);
      res.status(500).json({ message: "Failed to generate syllabus" });
    }
  });

  // Quiz/Exam routes
  app.get('/api/quizzes', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { courseId } = req.query;
      let quizzes;

      if (courseId) {
        quizzes = await storage.getQuizzesByCourse(courseId as string);
      } else {
        quizzes = [];
      }

      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post('/api/quizzes', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId, title, description, difficulty, timeLimit, questions, rubric } = req.body;

      const quiz = await storage.createQuiz({
        courseId,
        title,
        description,
        difficulty: difficulty || 'medium',
        timeLimit,
        questions,
        rubric,
        createdById: userId,
      });

      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.post('/api/quiz-attempts', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { quizId, answers } = req.body;

      // Get quiz for rubric
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Use AI to grade
      const grading = await gradeQuiz(answers, quiz.rubric);

      const attempt = await storage.createQuizAttempt({
        quizId,
        studentId: userId,
        answers,
        score: grading.score.toString(),
        feedback: grading,
      });

      // Track weak topics
      await storage.createMemoryEntry({
        userId,
        type: 'quiz_result',
        data: {
          quizId,
          score: grading.score,
          weakTopics: grading.feedback.filter((f: any) => f.points < f.maxPoints).map((f: any) => f.topic),
        },
      });

      res.json(attempt);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  // File upload routes
  app.post('/api/files/upload', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { fileName, fileType, fileSize, fileUrl } = req.body;

      const upload = await storage.createFileUpload({
        userId,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        processingStatus: 'pending',
        extractedText: null,
      });

      // In a real implementation, you would trigger background processing here
      res.json(upload);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Notes & Export routes
  app.post('/api/notes/summarize', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { text, length } = req.body;

      const summary = await summarizeText(text, length || 'medium');

      res.json({ summary });
    } catch (error) {
      console.error("Error summarizing:", error);
      res.status(500).json({ message: "Failed to summarize" });
    }
  });

  app.post('/api/notes/flashcards', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { text } = req.body;

      const flashcards = await generateFlashcards(text);

      res.json(flashcards);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ message: "Failed to generate flashcards" });
    }
  });

  // Purchase/Marketplace routes
  app.post('/api/purchases', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId, amount } = req.body;

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required for payment" });
      }

      // Create unique reference
      const reference = `LERNORY_${nanoid(16)}`;

      // Create purchase with pending status
      const purchase = await storage.createPurchase({
        buyerId: userId,
        courseId,
        amount,
        paymentStatus: 'pending',
        paystackReference: reference,
      });

      // Initialize Paystack transaction
      try {
        const { initializePayment, convertNairaToKobo } = await import('./paystack');
        const amountInKobo = await convertNairaToKobo(parseFloat(amount));
        
        const paymentInit = await initializePayment(
          user.email,
          amountInKobo,
          reference,
          { courseId, userId, purchaseId: purchase.id }
        );

        res.json({
          purchase,
          authorizationUrl: paymentInit.data.authorization_url,
          accessCode: paymentInit.data.access_code,
          reference: paymentInit.data.reference,
        });
      } catch (paystackError) {
        console.error("Paystack initialization error:", paystackError);
        res.json({
          purchase,
          authorizationUrl: `/marketplace?error=paystack_unavailable`,
          reference,
        });
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  app.post('/api/purchases/verify', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { reference } = req.body;

      // Verify with Paystack API
      try {
        const { verifyPayment } = await import('./paystack');
        const verification = await verifyPayment(reference);

        if (verification.data.status === 'success') {
          // Find and update purchase
          const purchases = await storage.getPurchasesByBuyer(req.user.claims.sub);
          const purchase = purchases.find(p => p.paystackReference === reference);

          if (purchase) {
            await storage.updatePurchaseStatus(purchase.id, 'completed');
            res.json({ success: true, verified: true });
          } else {
            res.status(404).json({ message: "Purchase not found" });
          }
        } else {
          res.json({ success: false, verified: false, status: verification.data.status });
        }
      } catch (paystackError) {
        console.error("Paystack verification error:", paystackError);
        res.status(500).json({ message: "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error verifying purchase:", error);
      res.status(500).json({ message: "Failed to verify purchase" });
    }
  });

  // Analytics routes
  app.post('/api/analytics/event', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { eventType, eventData } = req.body;

      await storage.createAnalyticsEvent({
        userId,
        eventType,
        eventData,
        schoolId: null,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error creating analytics event:", error);
      res.status(500).json({ message: "Failed to create analytics event" });
    }
  });

  // Memory/Performance tracking routes
  app.get('/api/memory/entries', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getMemoryEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching memory entries:", error);
      res.status(500).json({ message: "Failed to fetch memory entries" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket integration for real-time transcription
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    const audioBuffer: Buffer[] = [];

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'audio_chunk' && data.data) {
          // Data comes as data:audio/webm;base64,...
          const base64Data = data.data.split(',')[1];
          if (base64Data) {
            // Collect audio chunks
            audioBuffer.push(Buffer.from(base64Data, 'base64'));

            // Process every few chunks to send back transcripts
            if (audioBuffer.length >= 5) {
              // Combine audio chunks and transcribe
              const combinedAudio = Buffer.concat(audioBuffer);
              
              // Save to temporary file for Whisper API
              const tempDir = os.tmpdir();
              const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);
              
              fs.writeFileSync(tempFile, combinedAudio);
              
              try {
                // Transcribe audio using Whisper API
                const transcription = await transcribeAudio(tempFile);
                
                // Send transcript segment back to client
                ws.send(JSON.stringify({
                  type: 'transcript_segment',
                  data: {
                    speaker: 'Speaker',
                    text: transcription.text,
                    timestamp: Date.now(),
                  },
                }));
                
                // Clean up temp file
                fs.unlinkSync(tempFile);
              } catch (transcriptionError) {
                console.error('Transcription error:', transcriptionError);
                // Send error response
                ws.send(JSON.stringify({
                  type: 'error',
                  data: { message: 'Transcription failed' },
                }));
              }
              
              // Clear audio buffer for next batch
              audioBuffer.length = 0;
            }
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      audioBuffer.length = 0;
    });
  });

  return httpServer;
}
