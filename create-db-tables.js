#!/usr/bin/env node

/**
 * Create Missing Database Tables
 */

import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const createTables = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Creating missing database tables...');
    
    // Create system_logs table
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
    console.log('✓ system_logs table created');
    
    // Create pin_attempts table  
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pin_attempts (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER REFERENCES deals(id) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        attempted_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ pin_attempts table created');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('system_logs', 'pin_attempts')
    `);
    
    console.log('✓ Created tables:', result.rows.map(r => r.table_name));
    
    await pool.end();
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Database table creation failed:', error);
    await pool.end();
    process.exit(1);
  }
};

createTables();