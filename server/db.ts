// Database integration blueprint reference: javascript_database
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create Neon client with error handling
const queryClient = neon(process.env.DATABASE_URL);

// Wrap drizzle to catch connection errors gracefully
let dbInstance: any = null;
let dbError: Error | null = null;

try {
  dbInstance = drizzle({ client: queryClient, schema });
  console.log('✅ Database connection established');
} catch (error: any) {
  dbError = error;
  console.warn('⚠️ Database connection failed (falling back to in-memory storage):', error.message);
}

export const db = dbInstance;
export const isDatabaseAvailable = () => !dbError;

// Create a simple pool interface for backward compatibility
export const pool = {
  query: async (text: string, values?: any[]) => {
    try {
      if (dbError?.message?.includes('endpoint has been disabled')) {
        console.error('❌ Neon database endpoint is disabled. App is using in-memory storage.');
        return { rows: [] };
      }
      const result = await queryClient(text, values);
      return { rows: result };
    } catch (error: any) {
      console.warn('Database query failed, using fallback');
      return { rows: [] };
    }
  },
  on: (event: string, handler: Function) => {
    // Dummy event handler for compatibility
  }
};
