import { db } from './server/db';
import { deals, vendors, dealClaims, promotionalBanners, wishlists, customerReviews, dealRatings, pinAttempts, dealLocations, alertNotifications, customDealAlerts } from './shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function manageDummyDeals() {
  try {
    console.log('🔍 Step 1: Finding an approved vendor...');
    
    // Find an approved vendor to use for all dummy deals
    const approvedVendors = await db
      .select()
      .from(vendors)
      .where(and(
        eq(vendors.isApproved, true)
      ))
      .limit(1);
    
    if (approvedVendors.length === 0) {
      console.error('❌ No approved vendors found. Please create and approve a vendor first.');
      process.exit(1);
    }
    
    const testVendor = approvedVendors[0];
    console.log(`✅ Using vendor: ${testVendor.businessName} (ID: ${testVendor.id})`);
    
    console.log('\n🗑️  Step 2: Deleting all related data...');
    
    // Delete in the correct order to respect foreign key constraints
    const deletedAlertNotifications = await db.delete(alertNotifications).returning();
    console.log(`✅ Deleted ${deletedAlertNotifications.length} alert notifications`);
    
    const deletedReviews = await db.delete(customerReviews).returning();
    console.log(`✅ Deleted ${deletedReviews.length} customer reviews`);
    
    const deletedRatings = await db.delete(dealRatings).returning();
    console.log(`✅ Deleted ${deletedRatings.length} deal ratings`);
    
    const deletedWishlists = await db.delete(wishlists).returning();
    console.log(`✅ Deleted ${deletedWishlists.length} wishlist items`);
    
    const deletedClaims = await db.delete(dealClaims).returning();
    console.log(`✅ Deleted ${deletedClaims.length} deal claims`);
    
    const deletedPinAttempts = await db.delete(pinAttempts).returning();
    console.log(`✅ Deleted ${deletedPinAttempts.length} PIN attempts`);
    
    const deletedLocations = await db.delete(dealLocations).returning();
    console.log(`✅ Deleted ${deletedLocations.length} deal locations`);
    
    const deletedBanners = await db.delete(promotionalBanners).where(isNotNull(promotionalBanners.dealId)).returning();
    console.log(`✅ Deleted ${deletedBanners.length} promotional banners`);
    
    console.log('\n🗑️  Step 3: Deleting all existing deals...');
    const deletedDeals = await db.delete(deals).returning();
    console.log(`✅ Deleted ${deletedDeals.length} deals`);
    
    console.log('\n📝 Step 4: Creating new dummy deals...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Generate a hashed PIN for deals
    const pinSalt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash('1234', pinSalt);
    
    const categories = [
      'electronics',
      'fashion',
      'beauty',
      'luxury',
      'health',
      'restaurants',
      'entertainment',
      'home',
      'events',
      'realestate',
      'education',
      'freelancers',
      'consultants',
      'travel',
      'automotive',
      'services',
      'others'
    ];
    
    const newDeals = [];
    let dealCount = 0;
    
    // Create 2 deals for each category (offline deals)
    for (const category of categories) {
      for (let i = 1; i <= 2; i++) {
        dealCount++;
        newDeals.push({
          vendorId: testVendor.id,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Deal ${i}`,
          description: `Amazing ${category} deal with great discounts and offers. Perfect for testing the entire claim process.`,
          category: category,
          discountPercentage: 20 + (i * 10),
          originalPrice: (1000 + (i * 500)).toString(),
          discountedPrice: ((1000 + (i * 500)) * 0.7).toString(),
          validFrom: tomorrow,
          validUntil: nextMonth,
          maxRedemptions: 100,
          isActive: true,
          isApproved: true,
          approvedBy: 1,
          requiredMembership: 'basic',
          address: testVendor.address,
          latitude: testVendor.latitude,
          longitude: testVendor.longitude,
          verificationPin: hashedPin,
          pinSalt: pinSalt,
          dealType: 'offline',
          dealAvailability: 'all-stores'
        });
      }
    }
    
    // Create 4 special online deals
    const onlineDeals = [
      {
        title: 'Hotel Booking - 30% Off',
        description: 'Book your dream hotel with 30% discount. Luxury stays at affordable prices.',
        affiliateLink: 'https://www.booking.com'
      },
      {
        title: 'Flight Booking - Save Big',
        description: 'Get the best deals on domestic and international flights. Book now and save.',
        affiliateLink: 'https://www.skyscanner.com'
      },
      {
        title: 'Event Booking - Exclusive Access',
        description: 'Book tickets to concerts, sports events, and shows. Exclusive discounts available.',
        affiliateLink: 'https://www.eventbrite.com'
      },
      {
        title: 'Online Electronic Store - Mega Sale',
        description: 'Shop the latest electronics with massive discounts. Phones, laptops, and more.',
        affiliateLink: 'https://www.amazon.com/electronics'
      }
    ];
    
    for (const onlineDeal of onlineDeals) {
      dealCount++;
      newDeals.push({
        vendorId: testVendor.id,
        title: onlineDeal.title,
        description: onlineDeal.description,
        category: 'online',
        discountPercentage: 30,
        originalPrice: '5000',
        discountedPrice: '3500',
        validFrom: tomorrow,
        validUntil: nextMonth,
        maxRedemptions: 500,
        isActive: true,
        isApproved: true,
        approvedBy: 1,
        requiredMembership: 'basic',
        address: testVendor.address,
        latitude: testVendor.latitude,
        longitude: testVendor.longitude,
        verificationPin: hashedPin,
        pinSalt: pinSalt,
        dealType: 'online',
        affiliateLink: onlineDeal.affiliateLink,
        dealAvailability: 'all-stores'
      });
    }
    
    console.log(`📊 Creating ${newDeals.length} new deals...`);
    const createdDeals = await db.insert(deals).values(newDeals).returning();
    console.log(`✅ Successfully created ${createdDeals.length} deals`);
    
    console.log('\n📈 Summary by Category:');
    const categoryCounts = {};
    createdDeals.forEach(deal => {
      categoryCounts[deal.category] = (categoryCounts[deal.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} deals`);
    });
    
    console.log(`\n🎉 All done! Created ${createdDeals.length} deals from vendor "${testVendor.businessName}" (ID: ${testVendor.id})`);
    console.log('✅ All deals are from the same vendor for easy claim process testing');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error managing dummy deals:', error);
    process.exit(1);
  }
}

manageDummyDeals();
