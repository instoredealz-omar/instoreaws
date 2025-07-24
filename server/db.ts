import { config } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Load environment variables
config();

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available, if not try to construct it from individual vars
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.trim() === '') {
  // Try reading directly from .env file if environment variables are empty
  try {
    const fs = require('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      if (line.startsWith('DATABASE_URL=')) {
        databaseUrl = line.split('=')[1];
        break;
      }
    }
  } catch (e) {
    console.log('Could not read .env file:', e);
  }
}

if (!databaseUrl || databaseUrl.trim() === '') {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
