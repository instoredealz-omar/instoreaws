import { db } from './db';
import { users, vendors, deals } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { migrateWhatsAppColumns } from './migrate-whatsapp';

export async function initializeDatabase() {
  try {
    console.log('[INIT] Testing database connection...');
    // Test the database connection first
    await db.execute(sql`SELECT 1`);
    console.log('[INIT] Database connection successful!');
    
    // Run WhatsApp migrations first
    await migrateWhatsAppColumns();
    
    // Add gender and date of birth columns to users table
    console.log('[MIGRATION] Adding gender and date of birth columns to users table...');
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP`);
    console.log('[MIGRATION] Gender and date of birth columns added successfully');
    
    // Add status column to vendors table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    `);
    
    // Add contact fields to vendors table if they don't exist
    console.log('[MIGRATION] Adding contact fields to vendors table...');
    await db.execute(sql`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS contact_person_name TEXT
    `);
    await db.execute(sql`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS contact_phone TEXT
    `);
    console.log('[MIGRATION] Contact fields added to vendors table');
    
    // Add POS modules config column to vendors table if it doesn't exist
    console.log('[MIGRATION] Adding POS modules config to vendors table...');
    await db.execute(sql`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS pos_modules_config JSON DEFAULT '{"inventory": false, "gds": false, "billing": false}'::json
    `);
    console.log('[MIGRATION] POS modules config added to vendors table');
    
    // Create vendor_approvals table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vendor_approvals (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id) NOT NULL,
        status TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id),
        notes TEXT,
        required_documents TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create promotional_banners table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS promotional_banners (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        video_url TEXT,
        deal_id INTEGER REFERENCES deals(id),
        social_media_links JSON DEFAULT '{}',
        variant TEXT NOT NULL DEFAULT 'carousel',
        priority INTEGER DEFAULT 0,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        display_pages JSON DEFAULT '[]',
        auto_slide_delay INTEGER DEFAULT 5000,
        view_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        social_click_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      )
    `);
    
    // Create banner_analytics table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS banner_analytics (
        id SERIAL PRIMARY KEY,
        banner_id INTEGER REFERENCES promotional_banners(id) NOT NULL,
        event_type TEXT NOT NULL,
        event_data JSON DEFAULT '{}',
        user_id INTEGER REFERENCES users(id),
        ip_address TEXT,
        user_agent TEXT,
        page TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Fix demo user role if it exists
    await db.execute(sql`UPDATE users SET role = 'customer' WHERE email = 'demo@demo.com'`);
    
    // Insert demo users
    await db.insert(users).values([
      {
        username: 'admin',
        email: 'admin@instoredealz.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin User',
        phone: '+911234567890',
        city: 'Mumbai',
        state: 'Maharashtra',
        totalSavings: '0',
        dealsClaimed: 0,
      },
      {
        username: 'testvendor',
        email: 'vendor@test.com',
        password: 'vendor123',
        role: 'vendor',
        name: 'Test Vendor',
        phone: '+911234567891',
        city: 'Delhi',
        state: 'Delhi',
        totalSavings: '0',
        dealsClaimed: 0,
      },
      {
        username: 'testcustomer',
        email: 'customer@test.com',
        password: 'customer123',
        role: 'customer',
        name: 'Test Customer',
        phone: '+911234567892',
        city: 'Mumbai',
        state: 'Maharashtra',
        totalSavings: '0',
        dealsClaimed: 0,
      },
      {
        username: 'demo',
        email: 'demo@demo.com',
        password: 'demo123',
        role: 'customer',
        name: 'Demo Customer',
        phone: '+911234567893',
        city: 'Mumbai',
        state: 'Maharashtra',
        totalSavings: '0',
        dealsClaimed: 0,
      }
    ]).onConflictDoNothing();

    // Create vendor profile for test vendor account
    await db.execute(sql`
      INSERT INTO vendors (
        user_id, business_name, gst_number, pan_number, 
        address, city, state, pincode, 
        status, is_approved, total_deals, total_redemptions
      )
      SELECT 
        u.id,
        'Test Business Store',
        'GST123456789',
        'ABCDE1234F',
        '123 Test Street, Delhi',
        'Delhi',
        'Delhi',
        '110001',
        'approved',
        true,
        0,
        0
      FROM users u
      WHERE u.email = 'vendor@test.com'
      ON CONFLICT DO NOTHING
    `);

    // DISABLED: Auto-generation of test deals
    // Deals should only be created by vendors through the UI or API
    
    // Previously, sample deals were auto-generated here on every app restart,
    // causing duplicate deals to accumulate in the database.
    // Vendors can create deals manually through the vendor dashboard.

    // Add new carousel columns to existing promotional_banners table
    await db.execute(sql`
      ALTER TABLE promotional_banners 
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS deal_id INTEGER REFERENCES deals(id),
      ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS end_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS auto_slide_delay INTEGER DEFAULT 5000
    `);

    // Update variant to carousel for existing banners
    await db.execute(sql`
      UPDATE promotional_banners 
      SET variant = 'carousel'
      WHERE variant IN ('hero', 'compact', 'video')
    `);

    // Drop videos column if it exists (from previous migration)
    await db.execute(sql`
      ALTER TABLE promotional_banners 
      DROP COLUMN IF EXISTS videos,
      DROP COLUMN IF EXISTS video_title
    `);

    // Clear existing banner analytics first to avoid foreign key constraint violations
    await db.execute(sql`DELETE FROM banner_analytics WHERE banner_id IN (SELECT id FROM promotional_banners)`);
    
    // Clear existing promotional banners and insert new carousel banners
    await db.execute(sql`DELETE FROM promotional_banners WHERE id > 0`);
    
    // Initialize promotional banners with carousel sample data
    await db.execute(sql`
      INSERT INTO promotional_banners (
        title, description, image_url, video_url, deal_id, social_media_links, 
        variant, priority, start_date, end_date, auto_slide_delay, is_active, display_pages, created_by
      )
      VALUES 
      (
        'Summer Electronics Sale',
        'Up to 70% off on electronics - Limited time offer!',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
        null,
        (SELECT id FROM deals WHERE category = 'electronics' LIMIT 1),
        '{"website": "https://instoredealz.com", "whatsapp": "+91 9876543210"}'::jsonb,
        'carousel',
        100,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        5000,
        true,
        '[]'::jsonb,
        1
      ),
      (
        'Fashion Week Special',
        'Exclusive fashion deals this week only',
        null,
        'https://youtu.be/ScMzIvxBSi4?si=fJCpyJLEEfCjGWOy',
        (SELECT id FROM deals WHERE category = 'fashion' LIMIT 1),
        '{"website": "https://instoredealz.com", "whatsapp": "+91 8765432100"}'::jsonb,
        'carousel',
        90,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '7 days',
        6000,
        true,
        '[]'::jsonb,
        1
      ),
      (
        'Restaurant Week',
        'Best deals on dining experiences near you',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
        null,
        (SELECT id FROM deals WHERE category = 'restaurants' LIMIT 1),
        '{"website": "https://instoredealz.com", "whatsapp": "+91 9876543210"}'::jsonb,
        'carousel',
        80,
        CURRENT_TIMESTAMP,
        null,
        4000,
        true,
        '[]'::jsonb,
        1
      )
      ON CONFLICT DO NOTHING
    `);

    console.log('[INIT] Database initialized successfully with sample data');
  } catch (error: any) {
    console.error('========================================');
    console.error('[INIT] DATABASE CONNECTION FAILED!');
    console.error('========================================');
    if (error.message && error.message.includes('password authentication failed')) {
      console.error('[INIT] The DATABASE_URL in your .env file has invalid credentials.');
      console.error('[INIT] ');
      console.error('[INIT] TO FIX THIS:');
      console.error('[INIT] 1. Open Tools > Database in the left sidebar');
      console.error('[INIT] 2. Click on the "Commands" tab');
      console.error('[INIT] 3. Scroll to "Environment variables" section');
      console.error('[INIT] 4. Copy the DATABASE_URL value');
      console.error('[INIT] 5. Open your .env file and replace the DATABASE_URL line with the new value');
      console.error('[INIT] 6. Save and the app will restart automatically');
      console.error('[INIT] ');
      console.error('[INIT] The app will run with limited functionality until the database is connected.');
    } else {
      console.error('[INIT] Database error:', error);
    }
    console.error('========================================');
  }
}