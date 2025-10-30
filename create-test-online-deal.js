import { db } from './server/db.js';
import { users, vendors, deals } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function createTestOnlineDeal() {
  try {
    console.log('🔍 Checking for approved vendors...');
    
    // Find an approved vendor
    const approvedVendors = await db
      .select()
      .from(vendors)
      .where(and(
        eq(vendors.isApproved, true),
        eq(vendors.status, 'approved')
      ))
      .limit(1);
    
    let vendor = approvedVendors[0];
    
    // If no approved vendor exists, create a test vendor with user
    if (!vendor) {
      console.log('📝 No approved vendor found. Creating test vendor...');
      
      // Create test user
      const [testUser] = await db.insert(users).values({
        username: 'test_vendor_online',
        email: 'test.vendor.online@example.com',
        password: 'password123',
        role: 'vendor',
        name: 'Test Online Vendor',
        phone: '9999999999',
        city: 'Mumbai',
        state: 'Maharashtra'
      }).returning();
      
      console.log('✅ Created test user:', testUser.email);
      
      // Create test vendor
      [vendor] = await db.insert(vendors).values({
        userId: testUser.id,
        businessName: 'Test Online Store',
        panNumber: 'ABCDE1234F',
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        status: 'approved',
        isApproved: true,
        description: 'A test online store for testing purposes'
      }).returning();
      
      console.log('✅ Created approved vendor:', vendor.businessName);
    } else {
      console.log('✅ Found approved vendor:', vendor.businessName);
    }
    
    // Create test online deal
    console.log('🎯 Creating test online deal...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const testOnlineDeal = {
      vendorId: vendor.id,
      title: 'Test Online Deal - 50% Off on Amazon Fashion',
      description: 'Get 50% discount on fashion items through our affiliate link. Click to shop on Amazon and enjoy amazing discounts on clothing, shoes, and accessories.',
      category: 'fashion',
      discountPercentage: 50,
      originalPrice: '2000',
      discountedPrice: '1000',
      validFrom: tomorrow,
      validUntil: nextMonth,
      maxRedemptions: 100,
      isActive: true,
      isApproved: true, // Auto-approve for testing
      requiredMembership: 'basic',
      address: 'Online',
      dealType: 'online',
      affiliateLink: 'https://www.amazon.in/fashion?ref=test_affiliate_link',
      verificationPin: '0000', // Not needed for online deals but required by schema
    };
    
    const [newDeal] = await db.insert(deals).values(testOnlineDeal).returning();
    
    console.log('\n✨ Test Online Deal Created Successfully! ✨\n');
    console.log('📋 Deal Details:');
    console.log('  ID:', newDeal.id);
    console.log('  Title:', newDeal.title);
    console.log('  Type:', newDeal.dealType);
    console.log('  Affiliate Link:', newDeal.affiliateLink);
    console.log('  Discount:', newDeal.discountPercentage + '%');
    console.log('  Original Price: ₹', newDeal.originalPrice);
    console.log('  Discounted Price: ₹', newDeal.discountedPrice);
    console.log('  Valid Until:', newDeal.validUntil?.toLocaleDateString());
    console.log('  Status: Approved ✅');
    console.log('\n🎉 You can now view this deal in the application!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test online deal:', error);
    process.exit(1);
  }
}

createTestOnlineDeal();
