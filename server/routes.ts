// Replit Auth integration blueprint reference: javascript_log_in_with_replit
// WebSocket integration blueprint reference: javascript_websocket
// Gemini integration blueprint reference: javascript_gemini
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import os from "os";
import path from "path";
import multer from "multer";
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
import { generateWebsiteWithGemini, explainCodeForBeginners, debugCodeWithLEARNORY, explainTopicWithLEARNORY, generateImageWithLEARNORY, generateSmartChatTitle } from "./gemini";
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
      const sessionId = req.query.sessionId as string;
      
      const messages = sessionId 
        ? await storage.getChatMessagesBySession(sessionId)
        : await storage.getChatMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/send', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { content, sessionId } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Save user message
      await storage.createChatMessage({
        userId,
        sessionId: sessionId || null,
        role: "user",
        content,
        attachments: null,
      });

      // Get conversation history (last 20 messages for context - includes user's new message)
      const history = sessionId 
        ? await storage.getChatMessagesBySession(sessionId)
        : await storage.getChatMessagesByUser(userId, 20);
      const messages = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response
      const aiResponse = await chatWithAI(messages);

      // Save AI response
      await storage.createChatMessage({
        userId,
        sessionId: sessionId || null,
        role: "assistant",
        content: aiResponse,
        attachments: null,
      });

      // Generate smart title after both messages for better context
      if (sessionId) {
        try {
          const session = await storage.getChatSession(sessionId);
          if (session && (session.title === "New Chat" || session.title.startsWith("Chat "))) {
            // Get the updated history with both user and AI messages
            const updatedHistory = await storage.getChatMessagesBySession(sessionId);
            const conversationMessages = updatedHistory.map(msg => ({
              role: msg.role,
              content: msg.content
            }));
            
            // Generate smart title from full conversation
            const smartTitle = await generateSmartChatTitle(conversationMessages);
            await storage.updateChatSession(sessionId, { title: smartTitle });
            console.log("Updated chat session title to:", smartTitle);
          }
        } catch (titleError) {
          console.error("Error generating smart title:", titleError);
          // Continue even if title generation fails - don't break the chat
        }
      }

      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Clear all chat messages for user
  app.post('/api/chat/clear', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteChatMessagesByUser(userId);
      res.json({ message: "Chat cleared successfully" });
    } catch (error) {
      console.error("Error clearing chat:", error);
      res.status(500).json({ message: "Failed to clear chat" });
    }
  });

  // Chat Session routes
  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getChatSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { title, mode } = req.body;
      const session = await storage.createChatSession({ userId, title: title || "New Chat", mode: mode || "chat", summary: "" });
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.patch('/api/chat/sessions/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const session = await storage.updateChatSession(id, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating chat session:", error);
      res.status(500).json({ message: "Failed to update chat session" });
    }
  });

  app.delete('/api/chat/sessions/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteChatSession(id);
      res.json({ message: "Chat session deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // File upload handler with Gemini API fallback to OpenAI/OpenRouter
  const uploadMulter = multer({ storage: multer.memoryStorage() });
  
  app.post('/api/chat/analyze-file', isAuthenticated, uploadMulter.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.user.claims.sub;
      const { originalname, mimetype, buffer } = req.file;
      
      let analysis = "";
      let usedApi = "gemini";
      
      // Try Gemini first
      try {
        analysis = await explainTopicWithLEARNORY(originalname, originalname);
        analysis = analysis || "File analyzed with Gemini API";
      } catch (geminiErr) {
        console.error("Gemini API failed:", geminiErr);
        usedApi = "openai";
        
        // Fallback to OpenAI
        try {
          analysis = await chatWithAI([
            { role: "user", content: `Please analyze this file (${originalname}) of type ${mimetype}` }
          ]);
          analysis = analysis || "File analyzed with OpenAI";
        } catch (openaiErr) {
          console.error("OpenAI API also failed:", openaiErr);
          usedApi = "failed";
          analysis = "Unable to analyze file - all APIs failed";
        }
      }
      
      // Save file upload record
      const fileRecord = await storage.createFileUpload({
        userId,
        fileName: originalname,
        fileType: mimetype,
        fileSize: buffer.length,
        fileUrl: `/api/uploads/${userId}/${nanoid()}`,
        processingStatus: "completed",
        extractedText: analysis,
      });
      
      res.json({ fileRecord, analysis, usedApi });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  // Website Generator routes
  app.get('/api/websites', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const websites = await storage.getGeneratedWebsitesByUser(userId);
      res.json(websites);
    } catch (error) {
      console.error("Error fetching websites:", error);
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  app.get('/api/websites/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const website = await storage.getGeneratedWebsite(req.params.id);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      await storage.incrementViewCount(req.params.id);
      res.json(website);
    } catch (error) {
      console.error("Error fetching website:", error);
      res.status(500).json({ message: "Failed to fetch website" });
    }
  });

  app.post('/api/websites/generate', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt } = req.body;

      if (!prompt?.trim()) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Generate website using Gemini
      const generated = await generateWebsiteWithGemini(prompt);

      // Save to database
      const website = await storage.createGeneratedWebsite({
        userId,
        title: generated.title,
        description: `Generated from: ${prompt.substring(0, 100)}...`,
        prompt,
        htmlCode: generated.html,
        cssCode: generated.css,
        jsCode: generated.js || "",
        tags: [],
        isFavorite: false,
      });

      res.json(website);
    } catch (error) {
      console.error("Error generating website:", error);
      res.status(500).json({ message: `Failed to generate website: ${error instanceof Error ? error.message : "Unknown error"}` });
    }
  });

  app.patch('/api/websites/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { title, description, htmlCode, cssCode, jsCode, isFavorite } = req.body;
      
      const updated = await storage.updateGeneratedWebsite(req.params.id, {
        ...(title && { title }),
        ...(description && { description }),
        ...(htmlCode && { htmlCode }),
        ...(cssCode && { cssCode }),
        ...(jsCode && { jsCode }),
        ...(isFavorite !== undefined && { isFavorite }),
      });

      if (!updated) {
        return res.status(404).json({ message: "Website not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating website:", error);
      res.status(500).json({ message: "Failed to update website" });
    }
  });

  app.delete('/api/websites/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      await storage.deleteGeneratedWebsite(req.params.id);
      res.json({ message: "Website deleted successfully" });
    } catch (error) {
      console.error("Error deleting website:", error);
      res.status(500).json({ message: "Failed to delete website" });
    }
  });

  app.post('/api/websites/:id/explain', isAuthenticated, async (req: any, res: Response) => {
    try {
      const website = await storage.getGeneratedWebsite(req.params.id);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      const explanation = await explainCodeForBeginners(
        website.htmlCode,
        website.cssCode,
        website.jsCode || ""
      );

      res.json({ explanation });
    } catch (error) {
      console.error("Error explaining code:", error);
      res.status(500).json({ message: `Failed to explain code: ${error instanceof Error ? error.message : "Unknown error"}` });
    }
  });

  app.post('/api/websites/:id/debug', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { debugPrompt } = req.body;
      
      if (!debugPrompt?.trim()) {
        return res.status(400).json({ message: "Debug prompt is required" });
      }

      const website = await storage.getGeneratedWebsite(req.params.id);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Get updated code from LEARNORY AI
      const debugResult = await debugCodeWithLEARNORY(
        website.htmlCode,
        website.cssCode,
        website.jsCode || "",
        debugPrompt
      );

      // Save updated code to database
      const updated = await storage.updateGeneratedWebsite(req.params.id, {
        htmlCode: debugResult.htmlCode,
        cssCode: debugResult.cssCode,
        jsCode: debugResult.jsCode,
      });

      res.json({ 
        htmlCode: debugResult.htmlCode,
        cssCode: debugResult.cssCode,
        jsCode: debugResult.jsCode,
        steps: debugResult.steps
      });
    } catch (error) {
      console.error("Error debugging code:", error);
      res.status(500).json({ message: `Failed to debug code: ${error instanceof Error ? error.message : "Unknown error"}` });
    }
  });

  // Transcribe audio from chat voice input
  app.post('/api/chat/transcribe-voice', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { audioDataUrl } = req.body;
      
      if (!audioDataUrl) {
        return res.status(400).json({ message: "Audio data is required" });
      }

      // Convert data URL to Buffer
      const base64Data = audioDataUrl.split(',')[1];
      if (!base64Data) {
        return res.status(400).json({ message: "Invalid audio data format" });
      }

      const audioBuffer = Buffer.from(base64Data, 'base64');
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `chat_audio_${Date.now()}.webm`);
      
      fs.writeFileSync(tempFile, audioBuffer);
      
      try {
        const transcription = await transcribeAudio(tempFile);
        fs.unlinkSync(tempFile);
        
        res.json({ text: transcription.text });
      } catch (transcriptionError) {
        console.error("Transcription error:", transcriptionError);
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        res.status(500).json({ message: "Transcription failed. Please try again." });
      }
    } catch (error) {
      console.error("Error transcribing voice:", error);
      res.status(500).json({ message: "Failed to process voice input" });
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

  // Setup multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

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

  // Manual transcription endpoint (Whisper API)
  app.post('/api/transcribe', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No audio file provided" });
        return;
      }

      // Save uploaded file to temp location
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `upload_${Date.now()}.webm`);
      fs.writeFileSync(tempFile, req.file.buffer);

      try {
        // Transcribe using Whisper API
        const transcription = await transcribeAudio(tempFile);
        
        // Clean up temp file
        fs.unlinkSync(tempFile);

        res.json({
          text: transcription.text,
          duration: transcription.duration,
        });
      } catch (transcriptionError) {
        console.error('Transcription error:', transcriptionError);
        // Clean up temp file on error
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        res.status(500).json({ message: "Failed to transcribe audio" });
      }
    } catch (error) {
      console.error("Error in transcribe endpoint:", error);
      res.status(500).json({ message: "Failed to process transcription" });
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

  // Generate lesson from transcript
  app.post('/api/generate-lesson', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Transcript text is required" });
      }

      const lesson = await generateLesson(text);
      res.json(lesson);
    } catch (error) {
      console.error("Error generating lesson:", error);
      res.status(500).json({ message: "Failed to generate lesson" });
    }
  });

  // Summarize and correct text using OpenAI
  app.post('/api/summarize-and-correct', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      // Use OpenAI to summarize and correct
      const response = await chatWithAI([
        {
          role: "user",
          content: `Fix spelling and grammar, then summarize in 2-3 sentences. Extract key points.

Text: ${text.slice(0, 500)}

Format your response as:
CORRECTED: [fixed text]
SUMMARY: [2-3 sentences]
KEY_WORDS: [keywords separated by commas]`,
        },
      ]);

      const correctedMatch = response.match(/CORRECTED:\s*([\s\S]*?)(?:\nSUMMARY:|$)/);
      const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?:\nKEY_WORDS:|$)/);
      const keywordsMatch = response.match(/KEY_WORDS:\s*(.+?)$/s);

      const correctedText = correctedMatch ? correctedMatch[1].trim() : text;
      const summary = summaryMatch ? summaryMatch[1].trim() : "";
      const keywords = keywordsMatch ? keywordsMatch[1].trim().split(',').map(k => k.trim()) : [];

      res.json({
        correctedText,
        summary,
        keywords,
      });
    } catch (error) {
      console.error("Error summarizing and correcting:", error);
      res.status(500).json({ message: "Failed to process text" });
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

            // Process every 2 chunks to send back transcripts (faster live preview)
            if (audioBuffer.length >= 2) {
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

  // Topic explanation endpoint
  app.post('/api/explain-topic', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { subject, topic, difficulty = 'medium' } = req.body;

      if (!subject?.trim() || !topic?.trim()) {
        return res.status(400).json({ message: "Subject and topic are required" });
      }

      // Check if already explained
      const existing = await storage.getTopicExplanation(userId, subject, topic);
      if (existing) {
        return res.json(existing);
      }

      // Generate explanation
      const explanation = await explainTopicWithLEARNORY(subject, topic, difficulty);
      
      // Generate image
      const image = await generateImageWithLEARNORY(explanation.imagePrompt);

      // Store explanation
      const stored = await storage.createTopicExplanation({
        userId,
        subject,
        topic,
        simpleExplanation: explanation.simpleExplanation,
        detailedBreakdown: explanation.detailedBreakdown,
        examples: explanation.examples,
        formulas: explanation.formulas,
        realLifeApplications: explanation.realLifeApplications,
        commonMistakes: explanation.commonMistakes,
        practiceQuestions: explanation.practiceQuestions,
        imageUrl: image.imageUrl,
        difficulty
      });

      // Store image record
      await storage.createGeneratedImage({
        userId,
        prompt: explanation.imagePrompt,
        imageUrl: image.imageUrl,
        context: 'explain',
        relatedTopic: topic
      });

      // Log learning history
      await storage.createLearningHistory({
        userId,
        subject,
        topic,
        difficulty,
        completed: true
      });

      res.json(stored);
    } catch (error) {
      console.error("Error explaining topic:", error);
      res.status(500).json({ message: "Failed to explain topic" });
    }
  });

  // Generate custom image endpoint
  app.post('/api/generate-image', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, relatedTopic } = req.body;

      if (!prompt?.trim()) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const image = await generateImageWithLEARNORY(prompt);
      
      const stored = await storage.createGeneratedImage({
        userId,
        prompt,
        imageUrl: image.imageUrl,
        context: 'custom',
        relatedTopic
      });

      res.json(stored);
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  // Get all generated images by user
  app.get('/api/generated-images', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const images = await storage.getGeneratedImagesByUser(userId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching generated images:", error);
      res.status(500).json({ message: "Failed to fetch generated images" });
    }
  });

  // Delete a generated image
  app.delete('/api/generated-images/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const imageId = req.params.id;

      if (!imageId) {
        return res.status(400).json({ message: "Image ID is required" });
      }

      await storage.deleteGeneratedImage(userId, imageId);
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Learning history endpoint
  app.get('/api/learning-history', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const history = await storage.getLearningHistoryByUser(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching learning history:", error);
      res.status(500).json({ message: "Failed to fetch learning history" });
    }
  });

  // Focus areas analysis endpoint
  app.get('/api/focus-areas', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getLearningHistoryByUser(userId, 100);
      
      // Analyze subjects and topics
      const subjectMap = new Map<string, { count: number; topics: string[] }>();
      
      history.forEach((entry: any) => {
        if (!subjectMap.has(entry.subject)) {
          subjectMap.set(entry.subject, { count: 0, topics: [] });
        }
        const data = subjectMap.get(entry.subject)!;
        data.count++;
        if (!data.topics.includes(entry.topic)) {
          data.topics.push(entry.topic);
        }
      });

      const focusAreas = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        topicsLearned: data.count,
        recentTopics: data.topics.slice(-5),
        strength: data.count > 5 ? 'strong' : data.count > 2 ? 'developing' : 'beginner'
      }));

      res.json(focusAreas);
    } catch (error) {
      console.error("Error analyzing focus areas:", error);
      res.status(500).json({ message: "Failed to analyze focus areas" });
    }
  });

  // Export user data endpoint (PDF/JSON)
  app.post('/api/export-data', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { format = 'json', dataType = 'all' } = req.body;

      const history = await storage.getLearningHistoryByUser(userId, 100);
      const explanations = await storage.getTopicExplanationsByUser(userId);
      const user = await storage.getUser(userId);

      const exportData = {
        user: user?.firstName + ' ' + user?.lastName,
        exportedAt: new Date().toISOString(),
        learningHistory: history,
        topicExplanations: explanations.map(e => ({
          subject: e.subject,
          topic: e.topic,
          explanation: e.simpleExplanation,
          generatedAt: e.generatedAt
        }))
      };

      if (format === 'json') {
        res.json(exportData);
      } else {
        // For PDF, return JSON with base64 encoded PDF (can be generated client-side)
        res.json({ ...exportData, format: 'json', note: 'Use client-side PDF generation library' });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  return httpServer;
}
