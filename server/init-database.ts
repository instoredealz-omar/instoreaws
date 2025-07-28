import { db } from './db';
import { users, vendors, deals } from '../shared/schema';
import { sql } from 'drizzle-orm';

export async function initializeDatabase() {
  try {
    // Create promotional_banners table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS promotional_banners (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT,
        video_title TEXT,
        social_media_links JSON DEFAULT '{}',
        variant TEXT NOT NULL DEFAULT 'hero',
        is_active BOOLEAN DEFAULT true,
        display_pages JSON DEFAULT '[]',
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

    // Migrate promotional banners to new videos structure
    await db.execute(sql`
      -- Add videos column if it doesn't exist
      ALTER TABLE promotional_banners 
      ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb
    `);

    // Migrate existing data to new structure
    await db.execute(sql`
      UPDATE promotional_banners 
      SET videos = CASE 
        WHEN video_url IS NOT NULL AND video_url != '' THEN 
          json_build_array(
            json_build_object(
              'url', video_url,
              'title', COALESCE(video_title, 'Video'),
              'thumbnail', null,
              'duration', null
            )
          )::jsonb
        ELSE '[]'::jsonb
      END
      WHERE videos = '[]'::jsonb OR videos IS NULL
    `);

    // Initialize promotional banners with sample data
    await db.execute(sql`
      INSERT INTO promotional_banners (title, description, videos, social_media_links, variant, is_active, display_pages, created_by)
      VALUES (
        'Welcome to Instoredealz!',
        'Discover amazing deals from local businesses. Watch our introduction videos and connect with us on social media for updates.',
        '[
          {
            "url": "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1",
            "title": "Platform Introduction",
            "thumbnail": null,
            "duration": "3:32"
          },
          {
            "url": "https://www.youtube.com/embed/oHg5SJYRHA0?autoplay=1&rel=0&modestbranding=1",
            "title": "How to Find Deals",
            "thumbnail": null,
            "duration": "2:15"
          },
          {
            "url": "https://www.youtube.com/embed/9bZkp7q19f0?autoplay=1&rel=0&modestbranding=1",
            "title": "Vendor Benefits",
            "thumbnail": null,
            "duration": "4:20"
          }
        ]'::jsonb,
        '{"facebook": "https://facebook.com/instoredealz", "instagram": "https://instagram.com/instoredealz", "twitter": "https://twitter.com/instoredealz", "website": "https://instoredealz.com", "whatsapp": "+91 9876543210"}'::jsonb,
        'hero',
        true,
        '["home", "dashboard"]'::jsonb,
        1
      )
      ON CONFLICT DO NOTHING
    `);

    console.log('Database initialized successfully with sample data');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}