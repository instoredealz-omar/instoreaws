import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkDeals() {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as total FROM deals`);
    console.log('📊 Total deals in database:', result.rows[0].total);
    
    const testDeals = await db.execute(sql`SELECT COUNT(*) as total FROM deals WHERE title LIKE '%Test Deal%'`);
    console.log('📋 Test deals:', testDeals.rows[0].total);
    
    const duplicates = await db.execute(sql`
      SELECT title, COUNT(*) as count 
      FROM deals 
      GROUP BY title 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('\n⚠️  Duplicates found:');
      duplicates.rows.forEach(row => {
        console.log(`  - "${row.title}": ${row.count} copies`);
      });
    } else {
      console.log('✅ No duplicates - database is clean!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDeals();
