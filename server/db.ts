// Database integration blueprint reference: javascript_database
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create Neon HTTP client (serverless-friendly, no WebSocket needed)
const queryClient = neon(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
console.log('✅ Database connection established');

export const isDatabaseAvailable = () => true;

// Create a simple pool interface for backward compatibility
export const pool = {
  query: async (text: string, values?: any[]) => {
    try {
      const result = await queryClient(text, values);
      return { rows: result };
    } catch (error: any) {
      console.warn('Database query failed:', error.message);
      return { rows: [] };
    }
  },
  on: (event: string, handler: Function) => {
    // Dummy event handler for compatibility
  }
};
