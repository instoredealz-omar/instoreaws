#!/usr/bin/env node

// Add missing claim code columns to deal_claims table
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);

async function addClaimCodeColumns() {
  console.log('🔧 Adding claim code columns to deal_claims table...');
  
  try {
    // Add the missing columns
    await sql`
      ALTER TABLE deal_claims 
      ADD COLUMN IF NOT EXISTS claim_code TEXT,
      ADD COLUMN IF NOT EXISTS code_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS vendor_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP
    `;
    
    console.log('✅ Successfully added claim code columns to deal_claims table');
    
    // Verify the columns were added
    const result = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'deal_claims' 
      AND column_name IN ('claim_code', 'code_expires_at', 'vendor_verified', 'verified_at')
      ORDER BY column_name
    `;
    
    console.log('📊 New columns added:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n🎉 Database migration completed successfully!');
    console.log('The corrected customer claim code system is now ready.');
    
  } catch (error) {
    console.error('❌ Failed to add claim code columns:', error);
    process.exit(1);
  }
}

addClaimCodeColumns();