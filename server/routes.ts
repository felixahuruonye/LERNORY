// Replit Auth integration blueprint reference: javascript_log_in_with_replit
// WebSocket integration blueprint reference: javascript_websocket
// Gemini integration blueprint reference: javascript_gemini
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import os from "os";
import path from "path";
// @ts-ignore - multer types not available but package is installed
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  chatWithAI,
  chatWithAISmartFallback,
  generateLesson,
  generateSyllabus,
  gradeQuiz,
  transcribeAudio,
  generateSpeech,
  summarizeText,
  generateFlashcards,
} from "./openai";
import { generateWebsiteWithGemini, explainCodeForBeginners, debugCodeWithLEARNORY, explainTopicWithLEARNORY, generateImageWithLEARNORY, generateSmartChatTitle, analyzeFileWithGeminiVision, searchInternetWithGemini, generateLessonFromTextWithGemini, fixTextWithLEARNORY } from "./gemini";
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

  // Vapi public key endpoint
  app.get('/api/vapi-config', isAuthenticated, (req: Request, res: Response) => {
    try {
      const publicKey = process.env.VAPI_PUBLIC_KEY;
      if (!publicKey) {
        return res.status(500).json({ message: "Vapi not configured" });
      }
      res.json({ publicKey });
    } catch (error) {
      console.error("Error fetching Vapi config:", error);
      res.status(500).json({ message: "Failed to fetch Vapi config" });
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

  // Save message to permanent transcript (used for greetings and system messages)
  app.post('/api/chat/save-message', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId, role, content } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Verify session exists and belongs to user
      const session = await storage.getChatSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Save message to database
      const message = await storage.createChatMessage({
        userId,
        sessionId,
        role: role || "assistant",
        content,
        attachments: null,
      });

      console.log(`✓ Message saved to transcript: ${role} - ${content.substring(0, 50)}`);
      res.json(message);
    } catch (error) {
      console.error("Error saving message:", error);
      res.status(500).json({ message: "Failed to save message" });
    }
  });

  app.post('/api/chat/send', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      let { content, sessionId, includeUserContext } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      console.log("Received message:", content.substring(0, 50));

      // Get user info for personalization
      const user = await storage.getUser(userId);
      const userName = user?.firstName || "Friend";

      // Verify session exists if provided, otherwise create a new one
      if (sessionId) {
        const session = await storage.getChatSession(sessionId);
        if (!session) {
          console.warn("Session not found, creating new session");
          const newSession = await storage.createChatSession({ userId, title: "New Chat", mode: "chat", summary: "" });
          sessionId = newSession.id;
          
          // Send notification for new chat
          try {
            await storage.createNotification({
              userId,
              type: "chat",
              title: "New Chat Started",
              message: `You started a new chat session`,
              icon: "💬",
              actionUrl: `/chat?sessionId=${sessionId}`,
              read: false,
            });
          } catch (err) {
            console.log("Notification skipped");
          }
        }
      }

      // Save user message
      await storage.createChatMessage({
        userId,
        sessionId: sessionId || null,
        role: "user",
        content,
        attachments: null,
      });

      // Get FULL conversation history across ALL sessions for context
      // This allows the AI to remember everything the user has studied and asked about
      const allUserMessages = await storage.getChatMessagesByUser(userId, 500);
      
      // Get current session messages to prioritize recent context
      const currentSessionMessages = sessionId 
        ? await storage.getChatMessagesBySession(sessionId)
        : [];
      
      // Smart memory strategy:
      // 1. Use current session messages as main conversation (prevents greeting loops)
      // 2. Extract key learning topics from OTHER previous sessions
      const otherMessages = allUserMessages.filter(m => !currentSessionMessages.find(sm => sm.id === m.id));
      
      // Build conversation history: ONLY use current session messages
      // DO NOT mix with other sessions - this causes the AI to respond to old patterns instead of current questions
      const history = [
        ...currentSessionMessages
      ];
      
      // Get user memory/progress for context
      const userProgress = await storage.getUserProgressByUser(userId);
      const examResults = await storage.getExamResultsByUser(userId);
      const userMemories = await storage.getMemoryEntriesByUser(userId);
      
      // Extract comprehensive learning history from past sessions
      const extractCrossSesssionMemory = () => {
        const pastUserQuestions = otherMessages
          .filter(m => m.role === "user")
          .map(m => m.content)
          .slice(0, 20); // Get up to 20 past questions
        
        if (pastUserQuestions.length === 0) return "";
        
        // Group questions by length (longer = more specific topics)
        const importantTopics = pastUserQuestions
          .filter(q => q.length > 30 && q.length < 500)
          .slice(0, 10);
        
        if (importantTopics.length === 0) return "";
        
        return `
## LEARNING HISTORY FROM PREVIOUS SESSIONS:
The following topics have been discussed before. If the user asks about any of these or related topics, reference what was previously learned:

${importantTopics.map((topic, i) => `${i + 1}. "${topic.substring(0, 150)}${topic.length > 150 ? '...' : ''}"`).join('\n')}`;
      };
      
      const crossSessionMemory = extractCrossSesssionMemory();
      
      // Build personalized system message with CROSS-SESSION MEMORY INSTRUCTIONS
      let systemMessage = `You are LEARNORY, an advanced AI tutor. You are speaking with ${userName}.

## MEMORY & CONTEXT:
- THIS CONVERSATION has ${history.length} messages so far. Reference and build upon EVERYTHING discussed in this session.
- If the user mentions something they asked about earlier, REMEMBER it and continue from there.
- When the user asks a follow-up, ALWAYS refer back to what was previously discussed.
- Build knowledge progressively within this session.

## CROSS-SESSION LEARNING MEMORY:
${userName} has been learning across multiple sessions. Below is what they have studied in previous sessions.
If they ask about similar topics or reference past conversations, remind them what they learned before and build upon it:
- Subjects studied: ${userProgress.map(p => p.subject).join(", ") || "No specific subjects yet"}
- Topics covered: ${userProgress.flatMap(p => p.topicsStudied || []).slice(0, 15).join(", ") || "Various"}${userProgress.some(p => p.weakTopics?.length) ? '\n- Known weak areas: ' + userProgress.flatMap(p => p.weakTopics || []).slice(0, 10).join(", ") : ''}

## HOW TO RESPOND:
1. READ the entire conversation history above carefully
2. REMEMBER everything discussed so far in THIS session
3. Check if the user is asking about something from their LEARNING HISTORY above - if yes, reference what they learned before
4. If user references previous topics, acknowledge what they learned and build on it
5. ANSWER the current question thoroughly using both session context AND past learning
6. Do NOT apologize for past interactions - just answer the question
7. Do NOT repeat yourself if already explained in this conversation`;
      
      if (crossSessionMemory) {
        systemMessage += crossSessionMemory;
      }
      
      if (examResults.length > 0) {
        const lastExam = examResults[0];
        systemMessage += `\n\n## Recent Performance:
- Last exam: ${lastExam.examName} (${lastExam.score}%)
- Focus on weak areas identified in exams`;
      }
      
      systemMessage += `\n\nYour PRIMARY goal: Answer the current question thoroughly while remembering EVERYTHING from this session AND relevant learning from previous sessions.`;
      
      const messages = [
        { role: "system" as const, content: systemMessage },
        ...history.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ];

      console.log("Getting AI response with", messages.length, "messages (including user context)");
      
      // Enhanced memory logging showing cross-session context
      const crossSessionTopics = otherMessages
        .filter(m => m.role === "user")
        .map(m => m.content.substring(0, 80))
        .slice(0, 8);
      
      console.log("🧠 CROSS-SESSION MEMORY SYSTEM:", {
        "Session ID": sessionId,
        "Current session messages": history.length,
        "User": userName,
        "All previous questions available": otherMessages.filter(m => m.role === "user").length,
        "Subjects previously studied": userProgress.map(p => p.subject).join(", ") || "None yet",
        "Topics covered in previous sessions": userProgress.flatMap(p => p.topicsStudied || []).slice(0, 8).join(", ") || "None",
        "Identified weak areas across all sessions": userProgress.flatMap(p => p.weakTopics || []).join(", ") || "None identified",
        "AI will reference": crossSessionTopics.length > 0 ? "✓ Past questions from other sessions" : "Only current session"
      });

      // Get AI response with smart fallback (Gemini → OpenRouter → OpenAI)
      let aiResponse: string;
      try {
        aiResponse = await chatWithAISmartFallback(messages as any);
        console.log("Got AI response:", aiResponse.substring(0, 150));
        if (!aiResponse || aiResponse.trim() === "") {
          console.warn("Empty AI response!");
          aiResponse = "I received your message but had trouble formulating a response. Please try again.";
        }
      } catch (aiError) {
        console.error("AI API error:", aiError);
        aiResponse = "I'm having trouble connecting to my AI services right now. Please try again in a moment.";
      }

      // Auto-save to memory for AI learning
      try {
        await storage.createMemoryEntry({
          userId,
          type: "chat_interaction",
          data: {
            userMessage: content.substring(0, 500),
            aiResponse: aiResponse.substring(0, 500),
            timestamp: new Date().toISOString(),
          }
        });
        console.log("✓ Memory auto-updated from chat interaction");
      } catch (memErr) {
        console.log("Memory auto-save skipped (non-critical)");
      }

      // Check if user asked for image explanation
      const imageKeywords = ["explain with image", "show me", "visualize", "draw", "illustrate", "with image", "with a picture", "with diagram"];
      const shouldGenerateImage = imageKeywords.some(keyword => content.toLowerCase().includes(keyword));
      
      let attachments: any = null;
      if (shouldGenerateImage) {
        try {
          console.log("🎨 Generating image for chat response...");
          const imagePrompt = `Create a visual representation for: ${aiResponse.substring(0, 200)}`;
          const image = await generateImageWithLEARNORY(imagePrompt);
          
          // Store generated image
          await storage.createGeneratedImage({
            userId,
            prompt: imagePrompt,
            imageUrl: image.url,
            relatedTopic: content.substring(0, 100)
          });
          
          attachments = {
            images: [
              {
                url: image.url,
                title: "Visual Explanation"
              }
            ]
          };
          console.log("✅ Image attached to response");
        } catch (imgErr) {
          console.error("Image generation skipped:", imgErr);
          // Continue without image - not critical
        }
      }
      
      // Save AI response
      await storage.createChatMessage({
        userId,
        sessionId: sessionId || null,
        role: "assistant",
        content: aiResponse,
        attachments,
      });

      // AUTO-LEARNING: Analyze message and automatically update user profile
      if (req.body.autoLearn) {
        try {
          const { analyzeMessageForLearning } = await import("./tutorSystem");
          await analyzeMessageForLearning(userId, content, aiResponse);
          console.log("✓ Auto-learning: User profile updated from conversation");
        } catch (err) {
          console.error("Error in auto-learning:", err);
          // Don't fail the response if analysis fails
        }
      }

      // Generate smart title after both messages for better context
      if (sessionId) {
        try {
          const session = await storage.getChatSession(sessionId);
          if (session && (session.title === "New Chat" || session.title.startsWith("Chat "))) {
            const updatedHistory = await storage.getChatMessagesBySession(sessionId);
            const conversationMessages = updatedHistory.map(msg => ({
              role: msg.role,
              content: msg.content
            }));
            
            const smartTitle = await generateSmartChatTitle(conversationMessages);
            await storage.updateChatSession(sessionId, { title: smartTitle });
            console.log("Updated chat session title to:", smartTitle);
          }
        } catch (titleError) {
          console.error("Error generating smart title:", titleError);
        }
      }

      res.json({ success: true, message: aiResponse });
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
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

  // Memory export/backup routes
  app.get('/api/memory/export', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getChatMessagesByUser(userId);
      const memories = await storage.getMemoryEntriesByUser(userId);
      
      const exportData = {
        exported: new Date().toISOString(),
        user: userId,
        messages: messages.length,
        memories: memories.length,
        data: { messages, memories }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=memory-export.json');
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  app.post('/api/memory/backup', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getChatMessagesByUser(userId);
      const backup = {
        backupId: `backup_${Date.now()}`,
        userId,
        timestamp: new Date().toISOString(),
        messageCount: messages.length
      };
      res.json({ success: true, backup });
    } catch (error) {
      res.status(500).json({ message: "Backup failed" });
    }
  });

  app.delete('/api/memory/clear', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteChatMessagesByUser(userId);
      res.json({ success: true, message: "Memory cleared" });
    } catch (error) {
      res.status(500).json({ message: "Clear failed" });
    }
  });

  // Memory preferences routes
  app.post('/api/memory/preferences', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId, itemKey, value } = req.body;
      
      await storage.createMemoryEntry({
        userId,
        category: categoryId,
        key: itemKey,
        value: value,
        type: 'preference'
      });
      
      res.json({ success: true, message: "Preference saved" });
    } catch (error) {
      console.error("Save preference failed:", error);
      res.status(500).json({ message: "Failed to save preference" });
    }
  });

  app.post('/api/memory/preferences/add', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId, key, value } = req.body;
      
      await storage.createMemoryEntry({
        userId,
        category: categoryId,
        key: key,
        value: value,
        type: 'preference_added'
      });
      
      res.json({ success: true, message: "Item added" });
    } catch (error) {
      console.error("Add item failed:", error);
      res.status(500).json({ message: "Failed to add item" });
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
      const userId = req.user.claims.sub;
      
      // Verify ownership before deleting
      const session = await storage.getChatSession(id);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Delete session messages (memory cleanup happens automatically through cascade)
      const sessionMessages = await storage.getChatMessagesBySession(id);
      console.log(`Deleting ${sessionMessages.length} messages from session ${id}`);

      await storage.deleteChatSession(id);
      res.json({ message: "Chat session deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // Internet search route
  app.post('/api/chat/search', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { query } = req.body;
      if (!query?.trim()) {
        return res.status(400).json({ message: "Search query is required" });
      }

      console.log("🔍 Processing search request:", query);
      const searchResults = await searchInternetWithGemini(query);
      res.json(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Bulk delete chat sessions
  app.post('/api/chat/sessions/bulk-delete', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionIds } = req.body;

      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({ message: "Session IDs are required" });
      }

      let deletedCount = 0;
      for (const sessionId of sessionIds) {
        try {
          const session = await storage.getChatSession(sessionId);
          if (session && session.userId === userId) {
            await storage.deleteChatSession(sessionId);
            deletedCount++;
            console.log(`✓ Deleted session ${sessionId}`);
          }
        } catch (err) {
          console.error(`Error deleting session ${sessionId}:`, err);
        }
      }

      res.json({ 
        message: `Successfully deleted ${deletedCount} chat sessions`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error in bulk delete:", error);
      res.status(500).json({ message: "Failed to delete chat sessions" });
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
      const { description } = req.body;
      
      let analysis = "";
      let extractedText = "";
      let usedApi = "gemini-vision";
      
      console.log(`🔍 Analyzing file: ${originalname} (${mimetype})`);
      
      // Use Gemini Vision to extract content from file
      try {
        const visionResult = await analyzeFileWithGeminiVision(buffer, mimetype, originalname);
        extractedText = visionResult.extractedText;
        
        // Build analysis response combining extracted content with user's request
        const userRequest = description ? `\n\nUser's specific request: ${description}` : "";
        
        // Now use the extracted text with LLM to answer the user's specific question
        if (description && description.trim()) {
          try {
            const llmAnalysis = await chatWithAI([
              {
                role: "user",
                content: `I've extracted the following content from a file:\n\n${extractedText.substring(0, 2000)}\n\nPlease help me with this request about the file:\n${description}`
              }
            ]);
            analysis = llmAnalysis || "File analyzed successfully";
          } catch (llmErr) {
            console.error("LLM analysis failed, using extracted content:", llmErr);
            analysis = `Extracted Content:\n\n${extractedText.substring(0, 1000)}...`;
          }
        } else {
          // If no specific request, just return extracted content
          analysis = extractedText || "File content extracted successfully";
        }
        
        console.log(`✅ File analyzed successfully - extracted ${extractedText.length} chars`);
      } catch (visionErr) {
        console.error("Gemini Vision analysis failed:", visionErr);
        usedApi = "learnory-fallback";
        
        // Fallback to LLM only (less capable but still works)
        try {
          const fileContext = `Analyzing file: ${originalname} (${mimetype})${description ? `\n\nUser request: ${description}` : ""}`;
          analysis = await chatWithAI([
            { role: "user", content: `Please help analyze this file: ${fileContext}` }
          ]);
          analysis = analysis || "File analyzed with LEARNORY";
        } catch (fallbackErr) {
          console.error("Fallback analysis failed:", fallbackErr);
          usedApi = "failed";
          analysis = "Unable to analyze file - please try again";
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
        extractedText: extractedText || analysis,
      });
      
      res.json({ fileRecord, analysis, extractedText, usedApi });
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

      console.log("🔍 LEARNORY AI Debug Started:", debugPrompt.substring(0, 50));
      
      const debugResult = await debugCodeWithLEARNORY(
        website.htmlCode,
        website.cssCode,
        website.jsCode || "",
        debugPrompt
      );

      console.log("✅ Debug complete, checking updates...");

      const htmlUpdated = debugResult.htmlCode !== website.htmlCode;
      const cssUpdated = debugResult.cssCode !== website.cssCode;
      const jsUpdated = (debugResult.jsCode || "") !== (website.jsCode || "");

      await storage.updateGeneratedWebsite(req.params.id, {
        htmlCode: debugResult.htmlCode,
        cssCode: debugResult.cssCode,
        jsCode: debugResult.jsCode,
      });

      console.log("💾 Website saved. Updates:", { html: htmlUpdated, css: cssUpdated, js: jsUpdated });

      res.json({
        success: true,
        updates: {
          html: htmlUpdated,
          css: cssUpdated,
          js: jsUpdated,
        }
      });
    } catch (error) {
      console.error("❌ Debug endpoint error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Debug failed"
      });
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


  // Lesson routes
  app.get('/api/lessons', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { courseId } = req.query;
      let lessons: any[] = [];

      if (courseId) {
        lessons = await storage.getLessonsByCourse(courseId as string);
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
      let quizzes: any[] = [];

      if (courseId) {
        quizzes = await storage.getQuizzesByCourse(courseId as string);
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

  // Generate lesson from text using LEARNORY AI (for manual text entries)
  app.post('/api/generate-lesson-from-text', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { text, recordingId } = req.body;
      
      if (!text?.trim()) {
        return res.status(400).json({ message: "Text is required" });
      }

      console.log("📚 Generating lesson from manual text with LEARNORY AI...");
      const geminiData = await generateLessonFromTextWithGemini(text);

      const lesson = await storage.createGeneratedLesson({
        userId,
        recordingId: recordingId || null,
        title: geminiData.title,
        objectives: geminiData.objectives,
        keyPoints: geminiData.keyPoints,
        summary: geminiData.summary,
        originalText: text,
      });

      console.log("✅ Lesson created and saved:", lesson.id);
      res.json(lesson);
    } catch (error) {
      console.error("Error generating lesson from text:", error);
      res.status(500).json({ message: "Failed to generate lesson" });
    }
  });

  // AI Fix endpoint - Fix text with LEARNORY AI
  app.post('/api/ai-fix-text', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text?.trim()) {
        return res.status(400).json({ message: "Text is required" });
      }

      console.log("🔧 Fixing text with LEARNORY AI...");
      const fixed = await fixTextWithLEARNORY(text);

      res.json(fixed);
    } catch (error) {
      console.error("Error fixing text:", error);
      res.status(500).json({ message: "Failed to fix text" });
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
      const keywordsMatch = response.match(/KEY_WORDS:\s*(.+?)$/);
      if (!keywordsMatch) response.match(/KEY_WORDS:\s*([\s\S]+)$/);

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
      
      // @ts-ignore - Generate image with provided topic as prompt
      const imagePrompt = `${subject} - ${topic}`;
      const image = await generateImageWithLEARNORY(imagePrompt);

      // Store explanation
      // @ts-ignore - Store explanation with available fields
      const stored = await storage.createTopicExplanation({
        userId,
        subject,
        topic,
        explanation: explanation.explanation,
        examples: explanation.examples,
        relatedTopics: explanation.relatedTopics
      });

      // Store image record
      await storage.createGeneratedImage({
        userId,
        prompt: imagePrompt,
        imageUrl: image.url,
        relatedTopic: topic
      });

      // Log learning history
      // @ts-ignore - Create learning history record
      await storage.createLearningHistory({
        userId,
        subject,
        topic
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
        imageUrl: image.url,
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

      console.log(`🗑️ Deleting image ${imageId} for user ${userId}`);
      await storage.deleteGeneratedImage(userId, imageId);
      console.log(`✅ Image ${imageId} deleted successfully`);
      res.json({ message: "Image deleted successfully", id: imageId });
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

  // Learning insights endpoint (for dashboard analytics)
  app.get('/api/learning/insights', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { generateLearningInsights } = await import("./tutorSystem");
      const insights = await generateLearningInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching learning insights:", error);
      res.status(500).json({ message: "Failed to fetch learning insights" });
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
          explanation: e.explanation,
          generatedAt: e.createdAt
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

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getNotificationsByUser(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { type, title, message, icon, actionUrl } = req.body;

      const notification = await storage.createNotification({
        userId,
        type: type || 'system',
        title,
        message,
        icon,
        actionUrl,
        read: false,
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.get('/api/notifications/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error fetching notification:", error);
      res.status(500).json({ message: "Failed to fetch notification" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res: Response) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // LIVE AI Routes
  app.post('/api/live-ai/voice-start', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const conversation = await storage.createVoiceConversation({
        userId,
      });

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error starting voice conversation:", error);
      res.status(500).json({ message: "Failed to start voice conversation" });
    }
  });

  app.post('/api/live-ai/document-upload', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { fileName: bodyFileName, fileType: bodyFileType } = req.body;

      // Get file from upload
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const fileName = bodyFileName || req.file.originalname || 'document';
      const fileType = bodyFileType || req.file.mimetype || 'application/octet-stream';
      const fileSize = req.file.size;

      // Create document record initially with isProcessing=true
      const doc = await storage.createDocumentUpload({
        userId,
        fileName,
        fileType,
        fileUrl: `file://${nanoid()}`,
        fileSize,
        isProcessing: true,
        extractedText: '',
        aiAnalysis: null,
      });

      // Analyze file with Gemini vision in background (non-blocking)
      (async () => {
        try {
          console.log(`🔍 Starting Gemini vision analysis for: ${fileName}`);
          const result = await analyzeFileWithGeminiVision(
            req.file.buffer,
            fileType,
            fileName
          );
          const extractedText = result.extractedText;

          // Update document with extracted content
          console.log(`✅ Updating document with extracted content (${extractedText.length} chars)`);
          await storage.updateDocumentUpload(doc.id, {
            extractedText,
            aiAnalysis: result,
            isProcessing: false,
          });

          console.log(`✅ Gemini vision analysis completed for: ${fileName}`);
        } catch (error) {
          console.error(`❌ Error analyzing file with Gemini vision:`, error);
          // Update to mark processing as failed but keep document
          try {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await storage.updateDocumentUpload(doc.id, {
              isProcessing: false,
              extractedText: 'Analysis failed - please try again',
              aiAnalysis: { error: errorMsg },
            });
          } catch (e) {
            console.error("Could not update document status:", e);
          }
        }
      })();

      res.status(201).json({
        ...doc,
        message: "File uploaded successfully. Analyzing content with Gemini...",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get('/api/live-ai/documents', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const docs = await storage.getDocumentUploadsByUser(userId);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get('/api/live-ai/conversations', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getVoiceConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/live-ai/feature', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { featureType, context } = req.body;

      const feature = await storage.createLiveAiFeature({
        userId,
        featureType,
        context,
        status: 'pending',
      });

      res.status(201).json(feature);
    } catch (error) {
      console.error("Error creating feature:", error);
      res.status(500).json({ message: "Failed to create feature" });
    }
  });

  // Real-time Audio API: Transcribe voice to text
  app.post('/api/audio/transcribe', isAuthenticated, upload.single('audio'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const tempFile = path.join(os.tmpdir(), `voice_${Date.now()}.wav`);
      fs.writeFileSync(tempFile, req.file.buffer);

      try {
        const { text } = await transcribeAudio(tempFile);
        console.log("✓ Transcribed:", text);
        res.json({ text, success: true });
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ 
        message: error?.message || "Transcription failed",
        text: ""
      });
    }
  });

  // Simple transcribe endpoint for Live AI (Whisper)
  app.post('/api/transcribe', upload.single('audio'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const tempFile = path.join(os.tmpdir(), `voice_${Date.now()}.wav`);
      fs.writeFileSync(tempFile, req.file.buffer);

      try {
        const { text } = await transcribeAudio(tempFile);
        console.log("✓ Transcribed:", text);
        res.json({ text, success: true });
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ 
        message: error?.message || "Transcription failed",
        text: ""
      });
    }
  });

  // Real-time Audio API: Convert text to speech
  app.post('/api/audio/speak', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { text, voice = "alloy" } = req.body;

      if (!text?.trim()) {
        return res.status(400).json({ message: "Text is required" });
      }

      // Generate speech using OpenAI TTS
      const audioBuffer = await generateSpeech(text);
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("Speech generation error:", error);
      res.status(500).json({ message: error?.message || "Speech generation failed" });
    }
  });


  // Send notifications for all previous chat history
  app.post('/api/notifications/send-chat-history', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`[Notifications] Fetching chat history for user: ${userId}`);
      
      // Get all chat sessions for user
      const sessions = await storage.getChatSessionsByUser(userId);
      console.log(`[Notifications] Found ${sessions?.length || 0} sessions`);
      
      if (!sessions || sessions.length === 0) {
        console.log(`[Notifications] No sessions found for user`);
        return res.json({ message: "No chat sessions found", count: 0, sessions: [] });
      }

      // Create and store notifications for each chat
      const notificationCount = sessions.length;
      const sessionData: any[] = [];
      
      for (const session of sessions) {
        try {
          const notification = await storage.createNotification({
            userId,
            type: "chat_history" as any,
            title: session.title || "Previous Chat",
            message: `From ${new Date(session.createdAt).toLocaleDateString()}`,
            icon: "💬",
            actionUrl: `/chat?sessionId=${session.id}`,
            read: false,
          });
          console.log(`[Notifications] Created notification for session: ${session.id}`);
          sessionData.push({ id: session.id, title: session.title, createdAt: session.createdAt });
        } catch (err) {
          console.error("Failed to create notification for session:", session.id, err);
        }
      }

      console.log(`[Notifications] Sending ${notificationCount} notifications to client`);
      res.json({ 
        message: `Created ${notificationCount} notifications for chat history`, 
        count: notificationCount,
        sessions: sessionData
      });
    } catch (error) {
      console.error("Error sending chat history notifications:", error);
      res.status(500).json({ message: "Failed to send chat history notifications" });
    }
  });

  // CBT Mode API Routes
  app.get('/api/cbt/exams', isAuthenticated, async (req: any, res: Response) => {
    try {
      const exams = await storage.getAllCbtExams();
      res.json(exams);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Failed to fetch exams' });
    }
  });

  app.post('/api/cbt/sessions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { examId } = req.body;
      
      if (!examId) {
        return res.status(400).json({ message: 'Exam ID is required' });
      }

      const session = await storage.createCbtSession({
        userId,
        examId,
        status: 'in_progress',
      });

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Failed to create session' });
    }
  });

  app.get('/api/cbt/sessions/:sessionId', isAuthenticated, async (req: any, res: Response) => {
    try {
      const session = await storage.getCbtSession(req.params.sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found' });
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Failed to fetch session' });
    }
  });

  app.get('/api/cbt/questions/:examId', isAuthenticated, async (req: any, res: Response) => {
    try {
      const questions = await storage.getCbtQuestions(req.params.examId);
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Failed to fetch questions' });
    }
  });

  app.post('/api/cbt/answers', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { sessionId, questionId, userAnswer, timeSpent } = req.body;
      
      if (!sessionId || !questionId) {
        return res.status(400).json({ message: 'Session ID and Question ID are required' });
      }

      const answer = await storage.createCbtAnswer({
        sessionId,
        questionId,
        userAnswer,
        timeSpent: timeSpent || 0,
        isCorrect: undefined,
      });

      res.json(answer);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Failed to save answer' });
    }
  });

  app.patch('/api/cbt/sessions/:sessionId', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { status, score, totalCorrect, totalAttempted, timeSpent } = req.body;
      
      const session = await storage.updateCbtSession(req.params.sessionId, {
        status: status || undefined,
        score: score !== undefined ? score : undefined,
        totalCorrect,
        totalAttempted,
        timeSpent,
      });

      if (!session) return res.status(404).json({ message: 'Session not found' });
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Failed to update session' });
    }
  });

  // Recording API endpoints
  app.get('/api/recordings', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const recordings = await storage.getRecordingsByUser(userId);
      res.json(recordings);
    } catch (error: any) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ message: error?.message || 'Failed to fetch recordings' });
    }
  });

  app.post('/api/recordings', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { title, audioData, transcript, duration, sessionId } = req.body;

      console.log("Saving recording for user:", userId, "Title:", title, "Transcript length:", transcript?.length);

      if (!title?.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }

      // Ensure transcript is an array
      let transcriptArray = [];
      if (Array.isArray(transcript)) {
        transcriptArray = transcript;
      } else if (typeof transcript === 'string') {
        try {
          transcriptArray = JSON.parse(transcript);
        } catch {
          transcriptArray = [];
        }
      }

      const recording = await storage.createRecording({
        userId,
        sessionId: sessionId || null,
        title,
        audioData: audioData || '',
        transcript: transcriptArray,
        duration: duration || 0,
      });

      console.log("Recording created successfully:", recording.id);
      res.json(recording);
    } catch (error: any) {
      console.error("Error creating recording:", error);
      res.status(500).json({ message: error?.message || 'Failed to save recording' });
    }
  });

  app.delete('/api/recordings/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify recording belongs to user before deleting
      // (In production, add this verification)
      await storage.deleteRecording(id);
      
      res.json({ message: 'Recording deleted successfully' });
    } catch (error: any) {
      console.error("Error deleting recording:", error);
      res.status(500).json({ message: error?.message || 'Failed to delete recording' });
    }
  });

  // Generated Lessons API endpoints
  app.get('/api/generated-lessons', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const lessons = await storage.getGeneratedLessonsByUser(userId);
      res.json(lessons);
    } catch (error: any) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: error?.message || 'Failed to fetch lessons' });
    }
  });

  app.post('/api/generated-lessons', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { title, objectives, keyPoints, summary, recordingId } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }

      const lesson = await storage.createGeneratedLesson({
        userId,
        recordingId: recordingId || null,
        title,
        objectives: objectives || [],
        keyPoints: keyPoints || [],
        summary: summary || '',
      });

      res.json(lesson);
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: error?.message || 'Failed to save lesson' });
    }
  });

  app.delete('/api/generated-lessons/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteGeneratedLesson(id);
      res.json({ message: 'Lesson deleted successfully' });
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: error?.message || 'Failed to delete lesson' });
    }
  });

  return httpServer;
}
