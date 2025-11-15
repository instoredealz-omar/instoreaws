import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from 'dotenv';

neonConfig.webSocketConstructor = ws;

// Load .env file, but don't override existing environment variables
// This allows Replit secrets to take precedence
config({ override: false });

// Get DATABASE_URL, prioritizing the environment variable
let databaseUrl = process.env.DATABASE_URL;

// If DATABASE_URL contains the old neondb_owner credentials, it means .env is overriding
// In this case, we need to construct the URL from individual PG* variables if they exist
if (databaseUrl && databaseUrl.includes('neondb_owner')) {
  console.warn('[DATABASE] Warning: .env file contains old database credentials');
  console.warn('[DATABASE] Please update your .env file with the Replit database credentials');
  console.warn('[DATABASE] You can find them in Tools > Database > Commands > Environment variables');
  
  // Try to construct from individual PG* variables if they exist
  const { PGUSER, PGPASSWORD, PGHOST, PGDATABASE, PGPORT } = process.env;
  if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
    databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT || 5432}/${PGDATABASE}?sslmode=require`;
    console.log('[DATABASE] Constructed DATABASE_URL from PG* environment variables');
  }
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
