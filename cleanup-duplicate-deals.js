import { db } from './server/db.js';
import { deals } from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function cleanupDuplicateDeals() {
  try {
    console.log('🔍 Checking for duplicate deals...');
    
    const result = await db.execute(sql`
      SELECT COUNT(*) as total_deals FROM deals
    `);
    console.log('📊 Total deals in database:', result.rows[0].total_deals);
    
    const duplicates = await db.execute(sql`
      SELECT title, COUNT(*) as count 
      FROM deals 
      GROUP BY title 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('\n📋 Duplicate deals found:');
    duplicates.rows.forEach(row => {
      console.log(`  - "${row.title}": ${row.count} copies`);
    });
    
    console.log('\n🧹 Cleaning up duplicate test deals...');
    console.log('   Step 1: Removing promotional_banners references...');
    
    await db.execute(sql`
      UPDATE promotional_banners 
      SET deal_id = NULL
      WHERE deal_id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY title ORDER BY id DESC) as rn
          FROM deals
          WHERE title LIKE '%Test Deal%'
        ) t
        WHERE t.rn > 1
      )
    `);
    
    console.log('   ✅ Removed promotional_banners references');
    
    console.log('   Step 2: Removing associated deal_claims...');
    
    await db.execute(sql`
      DELETE FROM deal_claims 
      WHERE deal_id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY title ORDER BY id DESC) as rn
          FROM deals
          WHERE title LIKE '%Test Deal%'
        ) t
        WHERE t.rn > 1
      )
    `);
    
    console.log('   ✅ Removed associated deal_claims');
    
    console.log('   Step 3: Removing duplicate deals (keeping only the most recent)...');
    
    const deleteResult = await db.execute(sql`
      DELETE FROM deals 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY title ORDER BY id DESC) as rn
          FROM deals
          WHERE title LIKE '%Test Deal%'
        ) t
        WHERE t.rn > 1
      )
    `);
    
    console.log('   ✅ Deleted duplicate test deals');
    
    const finalCount = await db.execute(sql`
      SELECT COUNT(*) as total_deals FROM deals
    `);
    console.log('\n📊 Final deal count:', finalCount.rows[0].total_deals);
    
    const remainingDuplicates = await db.execute(sql`
      SELECT title, COUNT(*) as count 
      FROM deals 
      GROUP BY title 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingDuplicates.rows.length > 0) {
      console.log('\n⚠️  Remaining duplicates (non-test deals):');
      remainingDuplicates.rows.forEach(row => {
        console.log(`  - "${row.title}": ${row.count} copies`);
      });
    } else {
      console.log('\n✅ No duplicate deals remaining!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up duplicate deals:', error);
    process.exit(1);
  }
}

cleanupDuplicateDeals();
