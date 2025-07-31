import { db } from './db';
import { users, vendors, deals } from '../shared/schema';
import { sql } from 'drizzle-orm';

export async function initializeDatabase() {
  try {
    // Add status column to vendors table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    `);
    
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

    // Insert vendor records
    await db.insert(vendors).values([
      {
        userId: 2,
        businessName: 'Mumbai Electronics Store',
        gstNumber: 'GST123456789',
        panNumber: 'PAN123456789',
        address: '123 Electronics Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        isApproved: true,
        rating: '4.5',
        totalDeals: 0,
        totalRedemptions: 0,
      },
      {
        userId: 3,
        businessName: 'Delhi Fashion Hub',
        gstNumber: 'GST987654321',
        panNumber: 'PAN987654321',
        address: '456 Fashion Plaza',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        isApproved: true,
        rating: '4.2',
        totalDeals: 0,
        totalRedemptions: 0,
      }
    ]).onConflictDoNothing();

    // Insert sample deals
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    await db.insert(deals).values([
      {
        vendorId: 1,
        title: 'Summer Electronics Sale - 20% Off',
        description: 'Get 20% discount on all electronics and gadgets. Valid on smartphones, laptops, and accessories.',
        category: 'electronics',
        discountPercentage: 20,
        validUntil,
        maxRedemptions: 100,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '123 Electronics Street, Mumbai, Maharashtra 400001',
        verificationPin: '1234',
        requiredMembership: 'basic',
      },
      {
        vendorId: 1,
        title: 'Fashion Week Special - 30% Off',
        description: 'Exclusive 30% discount on latest fashion trends. Valid on clothing, shoes, and accessories.',
        category: 'fashion',
        discountPercentage: 30,
        validUntil,
        maxRedemptions: 50,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '456 Fashion Plaza, Mumbai, Maharashtra 400002',
        verificationPin: '5678',
        requiredMembership: 'basic',
      },
      {
        vendorId: 1,
        title: 'Food Festival - 25% Off',
        description: 'Delicious food deals! Get 25% off on your favorite meals and beverages.',
        category: 'food',
        discountPercentage: 25,
        validUntil,
        maxRedemptions: 200,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '789 Food Court, Mumbai, Maharashtra 400003',
        verificationPin: '9012',
        requiredMembership: 'basic',
      },
      {
        vendorId: 2,
        title: 'Travel Adventure - 40% Off',
        description: 'Amazing travel deals! 40% discount on weekend getaways and travel packages.',
        category: 'travel',
        discountPercentage: 40,
        validUntil,
        maxRedemptions: 30,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '321 Travel Agency, Mumbai, Maharashtra 400004',
        verificationPin: '3456',
        requiredMembership: 'premium',
      },
      {
        vendorId: 2,
        title: 'Home Decor Sale - 35% Off',
        description: 'Transform your home with 35% off on furniture, decor, and home essentials.',
        category: 'home',
        discountPercentage: 35,
        validUntil,
        maxRedemptions: 75,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '654 Home Store, Mumbai, Maharashtra 400005',
        verificationPin: '7890',
        requiredMembership: 'basic',
      },
      {
        vendorId: 1,
        title: 'Wellness & Fitness - 45% Off',
        description: 'Get fit with 45% off on gym memberships, yoga classes, and fitness equipment.',
        category: 'fitness',
        discountPercentage: 45,
        validUntil,
        maxRedemptions: 40,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '987 Fitness Center, Mumbai, Maharashtra 400006',
        verificationPin: '2468',
        requiredMembership: 'basic',
      },
      {
        vendorId: 2,
        title: 'Beauty & Spa - 50% Off',
        description: 'Pamper yourself with 50% off on beauty treatments, spa services, and cosmetics.',
        category: 'beauty',
        discountPercentage: 50,
        validUntil,
        maxRedemptions: 60,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '321 Beauty Salon, Mumbai, Maharashtra 400007',
        verificationPin: '1357',
        requiredMembership: 'basic',
      },
      {
        vendorId: 1,
        title: 'Services Special - 30% Off',
        description: 'Get 30% off on various services including repairs, maintenance, and consultations.',
        category: 'services',
        discountPercentage: 30,
        validUntil,
        maxRedemptions: 80,
        currentRedemptions: 0,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        address: '555 Service Center, Mumbai, Maharashtra 400008',
        verificationPin: '9753',
        requiredMembership: 'basic',
      }
    ]).onConflictDoNothing();

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

    console.log('Database initialized successfully with sample data');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}