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

export const db = drizzle({ client: queryClient, schema });

// Create a simple pool interface for backward compatibility
export const pool = {
  query: async (text: string, values?: any[]) => {
    try {
      const result = await queryClient(text, values);
      return { rows: result };
    } catch (error: any) {
      if (error.message?.includes('endpoint has been disabled')) {
        console.error('❌ Neon database endpoint is disabled. Enable it at https://console.neon.tech');
      }
      throw error;
    }
  },
  on: (event: string, handler: Function) => {
    // Dummy event handler for compatibility
  }
};
