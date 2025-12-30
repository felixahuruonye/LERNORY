import { db } from "../../db";
import { chatMessages as messages, chatSessions as conversations } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: string): Promise<any>;
  getAllConversations(): Promise<any[]>;
  createConversation(title: string, userId: string): Promise<any>;
  deleteConversation(id: string): Promise<void>;
  getMessagesByConversation(conversationId: string): Promise<any[]>;
  createMessage(conversationId: string, role: string, content: string, userId: string): Promise<any>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: string) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  },

  async getAllConversations() {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  },

  async createConversation(title: string, userId: string) {
    const [conversation] = await db.insert(conversations).values({ title, userId }).returning();
    return conversation;
  },

  async deleteConversation(id: string) {
    await db.delete(messages).where(eq(messages.sessionId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  },

  async getMessagesByConversation(conversationId: string) {
    return db.select().from(messages).where(eq(messages.sessionId, conversationId)).orderBy(messages.createdAt);
  },

  async createMessage(conversationId: string, role: string, content: string, userId: string) {
    const [message] = await db.insert(messages).values({ sessionId: conversationId, role, content, userId }).returning();
    return message;
  },
};

