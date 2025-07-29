#!/usr/bin/env node

/**
 * Fix Missing Database Tables
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const sql = async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    console.log('Creating missing system_logs table...');
    
    // Create system_logs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✓ system_logs table created successfully');
    
    // Check if other required tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'vendors', 'deals', 'deal_claims', 'wishlists', 'help_tickets')
    `);
    
    console.log('✓ Existing tables:', result.rows.map(r => r.table_name));
    
    pool.end();
    console.log('Database schema fix completed!');
    
  } catch (error) {
    console.error('Database schema fix failed:', error);
    process.exit(1);
  }
};

sql();