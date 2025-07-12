import {
  User,
  InsertUser,
  Vendor,
  InsertVendor,
  Deal,
  InsertDeal,
  DealClaim,
  InsertDealClaim,
  HelpTicket,
  InsertHelpTicket,
  SystemLog,
  InsertSystemLog,
  Wishlist,
  InsertWishlist,
  PosSession,
  InsertPosSession,
  PosTransaction,
  InsertPosTransaction,
  PosInventory,
  InsertPosInventory,
  CustomerReview,
  InsertCustomerReview,
  DealRating,
  InsertDealRating,
  VendorRating,
  InsertVendorRating,
  CustomDealAlert,
  InsertCustomDealAlert,
  DealConciergeRequest,
  InsertDealConciergeRequest,
  AlertNotification,
  InsertAlertNotification,
  PinAttempt,
  InsertPinAttempt,
} from "../shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Vendor operations
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;
  getPendingVendors(): Promise<Vendor[]>;
  approveVendor(id: number): Promise<Vendor | undefined>;

  // Deal operations
  getDeal(id: number): Promise<Deal | undefined>;
  getDealsBy(filters: Partial<Deal>): Promise<Deal[]>;
  getAllDeals(): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, updates: Partial<Deal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  getActiveDeals(): Promise<Deal[]>;
  getDealsByCategory(category: string): Promise<Deal[]>;
  getDealsByVendor(vendorId: number): Promise<Deal[]>;
  getPendingDeals(): Promise<Deal[]>;
  approveDeal(id: number, approvedBy: number): Promise<Deal | undefined>;
  incrementDealViews(id: number): Promise<void>;

  // Deal claim operations
  claimDeal(claim: InsertDealClaim): Promise<DealClaim>;
  getUserClaims(userId: number): Promise<DealClaim[]>;
  getDealClaims(dealId: number): Promise<DealClaim[]>;
  getAllDealClaims(): Promise<DealClaim[]>;
  updateClaimStatus(id: number, status: string, usedAt?: Date): Promise<DealClaim | undefined>;
  updateDealClaim(id: number, updates: Partial<DealClaim>): Promise<DealClaim | undefined>;
  incrementDealRedemptions(dealId: number): Promise<void>;

  // Help ticket operations
  createHelpTicket(ticket: InsertHelpTicket): Promise<HelpTicket>;
  getHelpTickets(): Promise<HelpTicket[]>;
  getUserHelpTickets(userId: number): Promise<HelpTicket[]>;
  updateHelpTicket(id: number, updates: Partial<HelpTicket>): Promise<HelpTicket | undefined>;

  // Wishlist operations
  addToWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: number, dealId: number): Promise<boolean>;
  getUserWishlist(userId: number): Promise<Wishlist[]>;
  isInWishlist(userId: number, dealId: number): Promise<boolean>;

  // System log operations
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(limit?: number): Promise<SystemLog[]>;

  // Analytics operations
  getAnalytics(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalDeals: number;
    totalClaims: number;
    revenueEstimate: number;
    cityStats: Array<{ city: string; dealCount: number; userCount: number }>;
    categoryStats: Array<{ category: string; dealCount: number; claimCount: number }>;
  }>;

  getAdminAnalytics(): Promise<any>;

  // Get deals ordered by claims (most claimed first)
  getMostClaimedDeals(): Promise<Deal[]>;
  
  // Admin operations for testing
  getDealCategoryCounts(): Promise<Record<string, number>>;
  deleteDealsByCategory(category: string): Promise<boolean>;
  resetAllDeals(): Promise<boolean>;

  // POS operations
  createPosSession(session: InsertPosSession): Promise<PosSession>;
  endPosSession(sessionId: number): Promise<PosSession | undefined>;
  getActivePosSession(vendorId: number, terminalId: string): Promise<PosSession | undefined>;
  getPosSessionsByVendor(vendorId: number): Promise<PosSession[]>;
  
  createPosTransaction(transaction: InsertPosTransaction): Promise<PosTransaction>;
  getPosTransactionsBySession(sessionId: number): Promise<PosTransaction[]>;
  getPosTransactionsByVendor(vendorId: number): Promise<PosTransaction[]>;
  updatePosTransaction(id: number, updates: Partial<PosTransaction>): Promise<PosTransaction | undefined>;
  
  createPosInventory(inventory: InsertPosInventory): Promise<PosInventory>;
  updatePosInventory(id: number, updates: Partial<PosInventory>): Promise<PosInventory | undefined>;
  getPosInventoryByVendor(vendorId: number): Promise<PosInventory[]>;
  getPosInventoryByDeal(dealId: number): Promise<PosInventory | undefined>;

  // Review and Rating operations
  createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview>;
  getReviewsByDeal(dealId: number): Promise<CustomerReview[]>;
  getReviewsByVendor(vendorId: number): Promise<CustomerReview[]>;
  getReviewsByUser(userId: number): Promise<CustomerReview[]>;
  getReviewByDealClaim(dealClaimId: number): Promise<CustomerReview | undefined>;
  updateReview(id: number, updates: Partial<CustomerReview>): Promise<CustomerReview | undefined>;
  deleteReview(id: number): Promise<boolean>;
  markReviewHelpful(reviewId: number): Promise<void>;
  reportReview(reviewId: number): Promise<void>;

  // Rating summary operations
  getDealRating(dealId: number): Promise<DealRating | undefined>;
  getVendorRating(vendorId: number): Promise<VendorRating | undefined>;
  updateDealRating(dealId: number): Promise<DealRating>;
  updateVendorRating(vendorId: number): Promise<VendorRating>;
  
  // Get deals with ratings
  getDealsWithRatings(): Promise<(Deal & { rating?: DealRating })[]>;
  getVendorsWithRatings(): Promise<(Vendor & { rating?: VendorRating })[]>;
  
  // Custom Deal Alerts operations
  createCustomDealAlert(alert: InsertCustomDealAlert): Promise<CustomDealAlert>;
  getCustomDealAlertsByUser(userId: number): Promise<CustomDealAlert[]>;
  getCustomDealAlert(id: number): Promise<CustomDealAlert | undefined>;
  updateCustomDealAlert(id: number, updates: Partial<CustomDealAlert>): Promise<CustomDealAlert | undefined>;
  deleteCustomDealAlert(id: number): Promise<boolean>;
  getActiveCustomDealAlerts(): Promise<CustomDealAlert[]>;
  triggerCustomDealAlert(alertId: number): Promise<void>;
  
  // Deal Concierge operations
  createDealConciergeRequest(request: InsertDealConciergeRequest): Promise<DealConciergeRequest>;
  getDealConciergeRequestsByUser(userId: number): Promise<DealConciergeRequest[]>;
  getDealConciergeRequest(id: number): Promise<DealConciergeRequest | undefined>;
  updateDealConciergeRequest(id: number, updates: Partial<DealConciergeRequest>): Promise<DealConciergeRequest | undefined>;
  getAllDealConciergeRequests(): Promise<DealConciergeRequest[]>;
  getDealConciergeRequestsByStatus(status: string): Promise<DealConciergeRequest[]>;
  assignDealConciergeRequest(id: number, assigneeId: number): Promise<DealConciergeRequest | undefined>;
  
  // Alert Notifications operations
  createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification>;
  getAlertNotificationsByUser(userId: number): Promise<AlertNotification[]>;
  getAlertNotificationsByAlert(alertId: number): Promise<AlertNotification[]>;
  updateAlertNotification(id: number, updates: Partial<AlertNotification>): Promise<AlertNotification | undefined>;
  markNotificationOpened(id: number): Promise<void>;
  markNotificationClicked(id: number): Promise<void>;
  markNotificationDealClaimed(id: number): Promise<void>;
  
  // PIN Security operations
  recordPinAttempt(dealId: number, userId: number | null, ipAddress: string, userAgent: string | null, success: boolean): Promise<void>;
  getPinAttempts(dealId: number, userId?: number, ipAddress?: string): Promise<Array<{ attemptedAt: Date; success: boolean }>>;
  updateDealPin(dealId: number, hashedPin: string, salt: string, expiresAt?: Date): Promise<Deal | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private vendors: Map<number, Vendor> = new Map();
  private deals: Map<number, Deal> = new Map();
  private dealClaims: Map<number, DealClaim> = new Map();
  private helpTickets: Map<number, HelpTicket> = new Map();
  private systemLogs: Map<number, SystemLog> = new Map();
  private wishlists: Map<number, Wishlist> = new Map();
  private posSessions: Map<number, PosSession> = new Map();
  private posTransactions: Map<number, PosTransaction> = new Map();
  private posInventory: Map<number, PosInventory> = new Map();
  private customerReviews: Map<number, CustomerReview> = new Map();
  private dealRatings: Map<number, DealRating> = new Map();
  private vendorRatings: Map<number, VendorRating> = new Map();
  private customDealAlerts: Map<number, CustomDealAlert> = new Map();
  private dealConciergeRequests: Map<number, DealConciergeRequest> = new Map();
  private alertNotifications: Map<number, AlertNotification> = new Map();
  private pinAttempts: Map<number, PinAttempt> = new Map();

  private currentUserId = 1;
  private currentVendorId = 1;
  private currentDealId = 1;
  private currentDealClaimId = 1;
  private currentHelpTicketId = 1;
  private currentSystemLogId = 1;
  private currentWishlistId = 1;
  private currentPosSessionId = 1;
  private currentPosTransactionId = 1;
  private currentPosInventoryId = 1;
  private currentReviewId = 1;
  private currentDealRatingId = 1;
  private currentVendorRatingId = 1;
  private currentPinAttemptId = 1;

  constructor() {
    this.initializeWithSampleData();
  }

  private initializeWithSampleData() {
    // Create admin users
    const adminUser: User = {
      id: this.currentUserId++,
      name: "Admin User",
      username: "admin",
      email: "admin@instoredealz.com",
      password: "admin123",
      role: "admin",
      phone: "+91-9876543210",
      city: "Mumbai",
      state: "Maharashtra",
      membershipPlan: null,
      membershipExpiry: null,
      isPromotionalUser: false,
      totalSavings: "0.00",
      dealsClaimed: 0,
      createdAt: new Date(),
      isActive: true,
    };

    const superAdminUser: User = {
      id: this.currentUserId++,
      name: "Super Admin",
      username: "superadmin",
      email: "superadmin@instoredealz.com",
      password: "superadmin123",
      role: "superadmin",
      phone: "+91-9876543211",
      city: "Delhi",
      state: "Delhi",
      membershipPlan: null,
      membershipExpiry: null,
      isPromotionalUser: false,
      totalSavings: "0.00",
      dealsClaimed: 0,
      createdAt: new Date(),
      isActive: true,
    };

    // Create test customers with different membership tiers
    const customerBasic: User = {
      id: this.currentUserId++,
      name: "Basic Customer",
      username: "customer_basic",
      email: "basic@example.com",
      password: "customer123",
      role: "customer",
      phone: "+91-9876543212",
      city: "Bangalore",
      state: "Karnataka",
      membershipPlan: "basic",
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isPromotionalUser: false,
      totalSavings: "2450.00",
      dealsClaimed: 8,
      createdAt: new Date(),
      isActive: true,
    };

    const customerPremium: User = {
      id: this.currentUserId++,
      name: "Premium Customer",
      username: "customer_premium",
      email: "premium@example.com",
      password: "customer123",
      role: "customer",
      phone: "+91-9876543213",
      city: "Chennai",
      state: "Tamil Nadu",
      membershipPlan: "premium",
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isPromotionalUser: false,
      totalSavings: "8950.00",
      dealsClaimed: 24,
      createdAt: new Date(),
      isActive: true,
    };

    const customerUltimate: User = {
      id: this.currentUserId++,
      name: "Ultimate Customer",
      username: "customer_ultimate",
      email: "ultimate@example.com",
      password: "customer123",
      role: "customer",
      phone: "+91-9876543214",
      city: "Hyderabad",
      state: "Telangana",
      membershipPlan: "ultimate",
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isPromotionalUser: true,
      totalSavings: "15750.00",
      dealsClaimed: 42,
      createdAt: new Date(),
      isActive: true,
    };

    // Create vendor user
    const vendorUser: User = {
      id: this.currentUserId++,
      name: "Fashion Store Owner",
      username: "vendor",
      email: "vendor@example.com",
      password: "vendor123",
      role: "vendor",
      phone: "+91-9876543215",
      city: "Mumbai",
      state: "Maharashtra",
      membershipPlan: null,
      membershipExpiry: null,
      isPromotionalUser: false,
      totalSavings: "0.00",
      dealsClaimed: 0,
      createdAt: new Date(),
      isActive: true,
    };

    // Save users
    [adminUser, superAdminUser, customerBasic, customerPremium, customerUltimate, vendorUser].forEach(user => {
      this.users.set(user.id, user);
    });

    // Create sample vendor
    const vendor: Vendor = {
      id: this.currentVendorId++,
      userId: vendorUser.id,
      businessName: "TrendyFashion Store",
      gstNumber: "27ABCDE1234F1Z5",
      panNumber: "ABCDE1234F",
      logoUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop",
      description: "Premium fashion retailer with latest trends",
      address: "Shop 123, Mall Road",
      city: "Mumbai",
      state: "Maharashtra",
      latitude: "19.0760",
      longitude: "72.8777",
      isApproved: true,
      rating: "4.8",
      totalDeals: 12,
      totalRedemptions: 345,
      createdAt: new Date(),
    };

    this.vendors.set(vendor.id, vendor);

    // Generate comprehensive test data
    this.generateTestVendors().forEach(v => this.vendors.set(v.id, v));
    this.generateTestUsers().forEach(u => this.users.set(u.id, u));
    this.generateTestDeals().forEach(d => this.deals.set(d.id, d));
    this.generateTestClaims();
  }

  private generateTestVendors(): Vendor[] {
    const vendors: Vendor[] = [];
    const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
    const states = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Maharashtra", "West Bengal", "Gujarat"];

    for (let i = 0; i < 10; i++) {
      const cityIndex = i % cities.length;
      const vendor: Vendor = {
        id: this.currentVendorId++,
        userId: this.currentUserId++,
        businessName: `Business ${i + 1}`,
        gstNumber: `27ABCDE123${i}F1Z5`,
        panNumber: `ABCDE123${i}F`,
        logoUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=200&h=200&fit=crop`,
        description: `Quality business providing excellent services ${i + 1}`,
        address: `Shop ${100 + i}, Business District`,
        city: cities[cityIndex],
        state: states[cityIndex],
        latitude: `${19 + (i * 0.1)}`,
        longitude: `${72 + (i * 0.1)}`,
        isApproved: i < 8, // Most vendors approved
        rating: `${4.2 + (i * 0.1)}`,
        totalDeals: 5 + (i * 2),
        totalRedemptions: 50 + (i * 25),
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
      };
      vendors.push(vendor);
      
      // Create corresponding user for each vendor
      const vendorUser: User = {
        id: vendor.userId,
        name: `Vendor ${i + 1}`,
        username: `vendor_${i + 1}`,
        email: `vendor${i + 1}@example.com`,
        password: "vendor123",
        role: "vendor",
        phone: `+91-987654${3216 + i}`,
        city: cities[cityIndex],
        state: states[cityIndex],
        membershipPlan: null,
        membershipExpiry: null,
        isPromotionalUser: false,
        totalSavings: "0.00",
        dealsClaimed: 0,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        isActive: true,
      };
      this.users.set(vendorUser.id, vendorUser);
    }

    return vendors;
  }

  private generateTestUsers(): User[] {
    const users: User[] = [];
    const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
    const states = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Maharashtra", "West Bengal", "Gujarat"];
    const membershipTiers = ["basic", "premium", "ultimate"];

    for (let i = 0; i < 20; i++) {
      const cityIndex = i % cities.length;
      const membershipTier = membershipTiers[i % 3];
      
      const user: User = {
        id: this.currentUserId++,
        name: `Customer ${i + 1}`,
        username: `customer_${i + 1}`,
        email: `customer${i + 1}@example.com`,
        password: "customer123",
        role: "customer",
        phone: `+91-987654${4000 + i}`,
        city: cities[cityIndex],
        state: states[cityIndex],
        membershipPlan: membershipTier,
        membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPromotionalUser: i % 5 === 0,
        totalSavings: `${(i + 1) * 450}.00`,
        dealsClaimed: (i + 1) * 3,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        isActive: true,
      };
      users.push(user);
    }

    return users;
  }

  private generateTestDeals(): Deal[] {
    const deals: Deal[] = [];
    const categories = ["fashion", "electronics", "restaurants", "beauty", "travel", "home", "automotive", "health"];
    
    const dealTemplates = {
      fashion: {
        titles: [
          "Premium Designer Clothing Collection",
          "Luxury Footwear Showcase",
          "Trendy Accessories Boutique",
          "Ethnic Wear Festival Special",
          "Seasonal Fashion Clearance"
        ],
        descriptions: [
          "Discover premium designer clothing with authentic materials and craftsmanship. Limited edition pieces from renowned fashion houses.",
          "Step into luxury with our curated footwear collection featuring premium leather and designer styles.",
          "Complete your look with trending accessories from top fashion brands and exclusive collections.",
          "Celebrate traditions with our handcrafted ethnic wear collection featuring silk, cotton, and premium fabrics.",
          "End-of-season clearance featuring high-quality fashion items at unbeatable prices."
        ],
        images: ["https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop"]
      },
      electronics: {
        titles: [
          "Latest Smartphone Technology Hub",
          "Gaming Electronics Paradise",
          "Smart Home Device Center",
          "Professional Audio Equipment",
          "Computer & Laptop Warehouse"
        ],
        descriptions: [
          "Experience cutting-edge smartphone technology with latest processors, cameras, and innovative features.",
          "Ultimate gaming destination with high-performance consoles, accessories, and gaming peripherals.",
          "Transform your home with smart devices, automation systems, and IoT solutions.",
          "Professional-grade audio equipment for musicians, content creators, and audiophiles.",
          "High-performance computers and laptops for work, gaming, and creative professionals."
        ],
        images: ["https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop"]
      },
      restaurants: {
        titles: [
          "Gourmet Fine Dining Experience",
          "Authentic Street Food Festival",
          "International Cuisine Journey",
          "Family Restaurant Special",
          "Chef's Signature Tasting Menu"
        ],
        descriptions: [
          "Indulge in exquisite fine dining with chef-curated menus, premium ingredients, and exceptional service.",
          "Explore authentic street food flavors from across India with traditional recipes and fresh ingredients.",
          "Journey through global cuisines with authentic flavors from Italian, Chinese, Mexican, and more.",
          "Perfect family dining with kid-friendly options, comfortable seating, and wholesome meals.",
          "Experience the chef's creativity with signature dishes featuring seasonal ingredients and innovative techniques."
        ],
        images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"]
      },
      beauty: {
        titles: [
          "Luxury Spa & Wellness Retreat",
          "Professional Beauty Makeover",
          "Organic Skincare Treatment",
          "Advanced Hair Styling Studio",
          "Holistic Wellness Package"
        ],
        descriptions: [
          "Rejuvenate with luxury spa treatments, therapeutic massages, and wellness therapies in a serene environment.",
          "Transform your look with professional makeup, styling, and beauty consultation from expert artists.",
          "Nourish your skin with organic treatments using natural ingredients and advanced skincare technology.",
          "Experience professional hair styling, coloring, and treatments with premium products and expert stylists.",
          "Complete wellness journey combining beauty treatments, relaxation therapy, and health consultation."
        ],
        images: ["https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&h=300&fit=crop"]
      },
      travel: {
        titles: [
          "Himalayan Adventure Expedition",
          "Luxury Beach Resort Getaway",
          "Cultural Heritage Tour Package",
          "Wildlife Safari Experience",
          "Backpacking Adventure Trail"
        ],
        descriptions: [
          "Conquer the majestic Himalayas with guided trekking, mountain camping, and breathtaking scenic views.",
          "Relax at premium beach resorts with oceanfront accommodations, water sports, and spa treatments.",
          "Explore India's rich heritage with guided tours of historical monuments, museums, and cultural sites.",
          "Experience wildlife in natural habitats with guided safaris, bird watching, and nature photography.",
          "Adventure-packed backpacking with hiking trails, camping, and exploration of hidden gems."
        ],
        images: ["https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop"]
      },
      home: {
        titles: [
          "Modern Furniture Collection",
          "Smart Home Automation",
          "Kitchen Appliance Upgrade",
          "Garden & Outdoor Living",
          "Interior Design Consultation"
        ],
        descriptions: [
          "Transform your space with contemporary furniture featuring premium materials and ergonomic design.",
          "Upgrade to smart home technology with automated lighting, security, and climate control systems.",
          "Modernize your kitchen with energy-efficient appliances, innovative features, and sleek designs.",
          "Create beautiful outdoor spaces with garden furniture, landscaping, and outdoor entertainment systems.",
          "Professional interior design services with space planning, color consultation, and style recommendations."
        ],
        images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop"]
      },
      automotive: {
        titles: [
          "Premium Car Service Package",
          "Motorcycle Maintenance Special",
          "Auto Parts & Accessories",
          "Vehicle Customization Hub",
          "Complete Auto Care Solution"
        ],
        descriptions: [
          "Comprehensive car servicing with genuine parts, expert technicians, and advanced diagnostic equipment.",
          "Professional motorcycle maintenance with specialized tools, quality parts, and experienced mechanics.",
          "Genuine auto parts and accessories with warranty, installation support, and compatibility guarantee.",
          "Transform your vehicle with custom modifications, performance upgrades, and aesthetic enhancements.",
          "Complete automotive care including servicing, repairs, insurance, and roadside assistance."
        ],
        images: ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop"]
      },
      health: {
        titles: [
          "Comprehensive Health Checkup",
          "Fitness Training Program",
          "Nutrition & Diet Consultation",
          "Mental Wellness Therapy",
          "Preventive Healthcare Package"
        ],
        descriptions: [
          "Complete health assessment with advanced diagnostics, lab tests, and specialist consultations.",
          "Personalized fitness programs with certified trainers, nutrition guidance, and progress tracking.",
          "Expert nutrition consultation with customized diet plans and ongoing support for healthy living.",
          "Professional mental health support with therapy sessions, stress management, and wellness coaching.",
          "Preventive healthcare with regular screenings, vaccinations, and health monitoring services."
        ],
        images: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop"]
      }
    };

    const cities = [
      { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
      { name: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025 },
      { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
      { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
      { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
      { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
      { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
      { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 }
    ];

    const membershipRequirements = ["basic", "premium", "ultimate"];
    
    // Generate a variety of 4-digit PINs using different patterns
    const generatePin = (dealId: number): string => {
      const patterns = [
        () => `${1000 + dealId}`, // Sequential starting from 1000
        () => `${2000 + (dealId * 3) % 1000}`, // Mathematical pattern starting from 2000
        () => `${3000 + (dealId * 7) % 1000}`, // Mathematical pattern starting from 3000
        () => `${4000 + (dealId * 11) % 1000}`, // Mathematical pattern starting from 4000
        () => `${5000 + (dealId * 13) % 1000}`, // Mathematical pattern starting from 5000
        () => `${6000 + (dealId * 17) % 1000}`, // Mathematical pattern starting from 6000
        () => `${7000 + (dealId * 19) % 1000}`, // Mathematical pattern starting from 7000
        () => `${8000 + (dealId * 23) % 1000}`, // Mathematical pattern starting from 8000
      ];
      return patterns[dealId % patterns.length]();
    };
    
    categories.forEach((category, categoryIndex) => {
      const templates = dealTemplates[category as keyof typeof dealTemplates];
      
      for (let i = 0; i < 5; i++) { // Reduced to 5 deals per category for better quality
        const vendorId = (categoryIndex * 2) + 1 + (i % 2); // Distribute across vendors
        const titleIndex = i % templates.titles.length;
        const descriptionIndex = i % templates.descriptions.length;
        const membershipReq = i < 2 ? "basic" : membershipRequirements[i % 3];
        const dealId = this.currentDealId++;
        const cityIndex = (categoryIndex + i) % cities.length;
        
        const deal: Deal = {
          id: dealId,
          title: templates.titles[titleIndex],
          description: templates.descriptions[descriptionIndex],
          vendorId: vendorId,
          category: category,
          subcategory: null,
          imageUrl: templates.images[0],
          originalPrice: null, // Removed pricing as per user preference
          discountedPrice: null, // Removed pricing as per user preference
          discountPercentage: 25 + (i * 10), // 25%, 35%, 45%, 55%, 65%
          verificationPin: generatePin(dealId), // Unique 4-digit PIN for each deal
          validFrom: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          validUntil: new Date(Date.now() + ((45 - i * 5) * 24 * 60 * 60 * 1000)), // Varying validity periods
          maxRedemptions: 50 + (i * 25), // 50, 75, 100, 125, 150
          currentRedemptions: Math.floor(Math.random() * 20), // Random current redemptions
          isActive: true,
          isApproved: true, // All deals approved for demo
          approvedBy: 1,
          viewCount: Math.floor(Math.random() * 500) + 50, // Random view count
          requiredMembership: membershipReq,
          address: `${templates.titles[titleIndex]}, Sector ${i + 1}, ${cities[cityIndex].name}, ${cities[cityIndex].state}`,
          latitude: `${cities[cityIndex].lat + (Math.random() - 0.5) * 0.1}`, // Small random offset
          longitude: `${cities[cityIndex].lng + (Math.random() - 0.5) * 0.1}`, // Small random offset
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        };
        
        deals.push(deal);
      }
    });

    return deals;
  }

  private generateTestClaims() {
    // Generate claims for existing deals and users
    const activeDeals = Array.from(this.deals.values()).filter(deal => deal.isActive);
    const customers = Array.from(this.users.values()).filter(user => user.role === "customer");
    
    customers.forEach((customer, customerIndex) => {
      const claimsCount = Math.min(customer.dealsClaimed || 0, activeDeals.length);
      
      for (let i = 0; i < claimsCount; i++) {
        const deal = activeDeals[i % activeDeals.length];
        const claim: DealClaim = {
          id: this.currentDealClaimId++,
          userId: customer.id,
          dealId: deal.id,
          status: Math.random() > 0.3 ? "used" : "claimed",
          claimedAt: new Date(Date.now() - ((claimsCount - i) * 24 * 60 * 60 * 1000)),
          usedAt: Math.random() > 0.3 ? new Date() : null,
          savingsAmount: `${Math.floor(Math.random() * 500) + 100}.00`,
          billAmount: null,
          actualSavings: null,
        };
        this.dealClaims.set(claim.id, claim);
      }
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      ...insertUser,
      role: insertUser.role || "customer",
      phone: insertUser.phone || null,
      city: insertUser.city || null,
      state: insertUser.state || null,
      membershipPlan: insertUser.membershipPlan || null,
      membershipExpiry: insertUser.membershipExpiry || null,
      isPromotionalUser: insertUser.isPromotionalUser || null,
      totalSavings: insertUser.totalSavings || null,
      dealsClaimed: insertUser.dealsClaimed || null,
      createdAt: new Date(),
      isActive: true,
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role)
      .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
  }

  // Vendor operations
  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(vendor => vendor.userId === userId);
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const vendor: Vendor = {
      id: this.currentVendorId++,
      ...insertVendor,
      gstNumber: insertVendor.gstNumber || null,
      logoUrl: insertVendor.logoUrl || null,
      description: insertVendor.description || null,
      address: insertVendor.address || null,
      latitude: insertVendor.latitude || null,
      longitude: insertVendor.longitude || null,
      isApproved: false,
      rating: "0",
      totalDeals: 0,
      totalRedemptions: 0,
      createdAt: new Date(),
    };
    this.vendors.set(vendor.id, vendor);
    return vendor;
  }

  async updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const vendor = this.vendors.get(id);
    if (vendor) {
      const updatedVendor = { ...vendor, ...updates };
      this.vendors.set(id, updatedVendor);
      return updatedVendor;
    }
    return undefined;
  }

  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values())
      .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
  }

  async getPendingVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values())
      .filter(vendor => !vendor.isApproved)
      .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
  }

  async approveVendor(id: number): Promise<Vendor | undefined> {
    return this.updateVendor(id, { isApproved: true });
  }

  // Deal operations
  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async getDealsBy(filters: Partial<Deal>): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => {
      return Object.entries(filters).every(([key, value]) => {
        return deal[key as keyof Deal] === value;
      });
    });
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const deal: Deal = {
      id: this.currentDealId++,
      ...insertDeal,
      imageUrl: insertDeal.imageUrl || null,
      subcategory: insertDeal.subcategory || null,
      originalPrice: insertDeal.originalPrice || null,
      discountedPrice: insertDeal.discountedPrice || null,
      maxRedemptions: insertDeal.maxRedemptions || null,
      latitude: insertDeal.latitude || null,
      longitude: insertDeal.longitude || null,
      currentRedemptions: 0,
      viewCount: 0,
      validFrom: new Date(),
      isActive: true,
      isApproved: false,
      approvedBy: null,
      requiredMembership: insertDeal.requiredMembership || "basic",
      createdAt: new Date(),
    };
    this.deals.set(deal.id, deal);
    return deal;
  }

  async updateDeal(id: number, updates: Partial<Deal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (deal) {
      const updatedDeal = { ...deal, ...updates };
      this.deals.set(id, updatedDeal);
      return updatedDeal;
    }
    return undefined;
  }

  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
  }

  async getActiveDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.isActive && deal.isApproved);
  }

  async getDealsByCategory(category: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.category === category);
  }

  async getDealsByVendor(vendorId: number): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.vendorId === vendorId);
  }

  async getAllDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).map(deal => {
      const vendor = this.vendors.get(deal.vendorId);
      return { ...deal, vendor };
    });
  }

  async getPendingDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => !deal.isApproved);
  }

  async approveDeal(id: number, approvedBy: number): Promise<Deal | undefined> {
    return this.updateDeal(id, { isApproved: true, approvedBy });
  }

  async incrementDealViews(id: number): Promise<void> {
    const deal = this.deals.get(id);
    if (deal) {
      deal.viewCount = (deal.viewCount || 0) + 1;
      this.deals.set(id, deal);
    }
  }

  // Deal claim operations
  async claimDeal(insertClaim: InsertDealClaim): Promise<DealClaim> {
    const claim: DealClaim = {
      id: this.currentDealClaimId++,
      ...insertClaim,
      status: insertClaim.status || "claimed",
      usedAt: insertClaim.usedAt || null,
      claimedAt: new Date(),
      billAmount: insertClaim.billAmount ?? null,
      actualSavings: insertClaim.actualSavings ?? null,
    };
    this.dealClaims.set(claim.id, claim);
    return claim;
  }

  async incrementDealRedemptions(dealId: number): Promise<void> {
    const deal = this.deals.get(dealId);
    if (deal) {
      deal.currentRedemptions = (deal.currentRedemptions || 0) + 1;
      this.deals.set(dealId, deal);
    }
  }

  async getUserClaims(userId: number): Promise<DealClaim[]> {
    return Array.from(this.dealClaims.values()).filter(claim => claim.userId === userId);
  }

  async getDealClaims(dealId: number): Promise<DealClaim[]> {
    return Array.from(this.dealClaims.values()).filter(claim => claim.dealId === dealId);
  }

  async getAllDealClaims(): Promise<DealClaim[]> {
    return Array.from(this.dealClaims.values()).map(claim => {
      const user = this.users.get(claim.userId);
      const deal = this.deals.get(claim.dealId);
      const vendor = deal ? this.vendors.get(deal.vendorId) : undefined;
      
      return {
        ...claim,
        user: user ? {
          ...user,
          membershipId: `ISD-${user.id.toString().padStart(8, '0')}`
        } : undefined,
        deal: deal ? {
          ...deal,
          vendor: vendor
        } : undefined
      };
    });
  }

  async updateClaimStatus(id: number, status: string, usedAt?: Date): Promise<DealClaim | undefined> {
    const claim = this.dealClaims.get(id);
    if (claim) {
      const updatedClaim = { ...claim, status, usedAt: usedAt || claim.usedAt };
      this.dealClaims.set(id, updatedClaim);
      return updatedClaim;
    }
    return undefined;
  }

  async updateDealClaim(id: number, updates: Partial<DealClaim>): Promise<DealClaim | undefined> {
    const claim = this.dealClaims.get(id);
    if (claim) {
      const updatedClaim = { ...claim, ...updates };
      this.dealClaims.set(id, updatedClaim);
      return updatedClaim;
    }
    return undefined;
  }

  // Help ticket operations
  async createHelpTicket(insertTicket: InsertHelpTicket): Promise<HelpTicket> {
    const ticket: HelpTicket = {
      id: this.currentHelpTicketId++,
      ...insertTicket,
      status: insertTicket.status || "open",
      priority: insertTicket.priority || "medium",
      assignedTo: insertTicket.assignedTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.helpTickets.set(ticket.id, ticket);
    return ticket;
  }

  async getHelpTickets(): Promise<HelpTicket[]> {
    return Array.from(this.helpTickets.values());
  }

  async getUserHelpTickets(userId: number): Promise<HelpTicket[]> {
    return Array.from(this.helpTickets.values()).filter(ticket => ticket.userId === userId);
  }

  async updateHelpTicket(id: number, updates: Partial<HelpTicket>): Promise<HelpTicket | undefined> {
    const ticket = this.helpTickets.get(id);
    if (ticket) {
      const updatedTicket = { ...ticket, ...updates };
      this.helpTickets.set(id, updatedTicket);
      return updatedTicket;
    }
    return undefined;
  }

  // System log operations
  async createSystemLog(insertLog: InsertSystemLog): Promise<SystemLog> {
    const log: SystemLog = {
      id: this.currentSystemLogId++,
      ...insertLog,
      userId: insertLog.userId || null,
      ipAddress: insertLog.ipAddress || null,
      userAgent: insertLog.userAgent || null,
      details: insertLog.details || {},
      createdAt: new Date(),
    };
    this.systemLogs.set(log.id, log);
    return log;
  }

  async getSystemLogs(limit = 100): Promise<SystemLog[]> {
    const logs = Array.from(this.systemLogs.values());
    return logs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)).slice(0, limit);
  }

  // Wishlist operations
  async addToWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    const wishlist: Wishlist = {
      id: this.currentWishlistId++,
      ...insertWishlist,
      addedAt: new Date(),
    };
    this.wishlists.set(wishlist.id, wishlist);
    return wishlist;
  }

  async removeFromWishlist(userId: number, dealId: number): Promise<boolean> {
    const wishlistItem = Array.from(this.wishlists.values()).find(
      item => item.userId === userId && item.dealId === dealId
    );
    if (wishlistItem) {
      return this.wishlists.delete(wishlistItem.id);
    }
    return false;
  }

  async getUserWishlist(userId: number): Promise<Wishlist[]> {
    return Array.from(this.wishlists.values()).filter(item => item.userId === userId);
  }

  async isInWishlist(userId: number, dealId: number): Promise<boolean> {
    return Array.from(this.wishlists.values()).some(
      item => item.userId === userId && item.dealId === dealId
    );
  }

  async getMostClaimedDeals(): Promise<Deal[]> {
    const dealClaimCounts = new Map<number, number>();
    
    Array.from(this.dealClaims.values()).forEach(claim => {
      const count = dealClaimCounts.get(claim.dealId) || 0;
      dealClaimCounts.set(claim.dealId, count + 1);
    });

    const deals = Array.from(this.deals.values()).filter(deal => deal.isActive && deal.isApproved);
    
    return deals.sort((a, b) => {
      const aCount = dealClaimCounts.get(a.id) || 0;
      const bCount = dealClaimCounts.get(b.id) || 0;
      return bCount - aCount;
    });
  }

  async getDealCategoryCounts(): Promise<Record<string, number>> {
    const categoryCounts: Record<string, number> = {};
    Array.from(this.deals.values()).forEach(deal => {
      categoryCounts[deal.category] = (categoryCounts[deal.category] || 0) + 1;
    });
    return categoryCounts;
  }

  async deleteDealsByCategory(category: string): Promise<boolean> {
    const dealsToDelete = Array.from(this.deals.values()).filter(deal => deal.category === category);
    dealsToDelete.forEach(deal => this.deals.delete(deal.id));
    return dealsToDelete.length > 0;
  }

  async resetAllDeals(): Promise<boolean> {
    this.deals.clear();
    this.dealClaims.clear();
    this.currentDealId = 1;
    this.currentDealClaimId = 1;
    return true;
  }

  async getAnalytics() {
    const totalUsers = this.users.size;
    const totalVendors = this.vendors.size;
    const totalDeals = this.deals.size;
    const totalClaims = this.dealClaims.size;
    
    const cityStats: { city: string; dealCount: number; userCount: number }[] = [];
    const categoryStats: { category: string; dealCount: number; claimCount: number }[] = [];
    
    // Calculate city stats
    const cityUserCounts = new Map<string, number>();
    const cityDealCounts = new Map<string, number>();
    
    Array.from(this.users.values()).forEach(user => {
      if (user.city) {
        cityUserCounts.set(user.city, (cityUserCounts.get(user.city) || 0) + 1);
      }
    });
    
    Array.from(this.vendors.values()).forEach(vendor => {
      const vendorDeals = Array.from(this.deals.values()).filter(deal => deal.vendorId === vendor.id).length;
      cityDealCounts.set(vendor.city, (cityDealCounts.get(vendor.city) || 0) + vendorDeals);
    });
    
    Array.from(cityUserCounts.keys()).forEach(city => {
      cityStats.push({
        city,
        userCount: cityUserCounts.get(city) || 0,
        dealCount: cityDealCounts.get(city) || 0,
      });
    });
    
    // Calculate category stats
    const categoryDealCounts = new Map<string, number>();
    const categoryClaimCounts = new Map<string, number>();
    
    Array.from(this.deals.values()).forEach(deal => {
      categoryDealCounts.set(deal.category, (categoryDealCounts.get(deal.category) || 0) + 1);
    });
    
    Array.from(this.dealClaims.values()).forEach(claim => {
      const deal = this.deals.get(claim.dealId);
      if (deal) {
        categoryClaimCounts.set(deal.category, (categoryClaimCounts.get(deal.category) || 0) + 1);
      }
    });
    
    Array.from(categoryDealCounts.keys()).forEach(category => {
      categoryStats.push({
        category,
        dealCount: categoryDealCounts.get(category) || 0,
        claimCount: categoryClaimCounts.get(category) || 0,
      });
    });
    
    return {
      totalUsers,
      totalVendors,
      totalDeals,
      totalClaims,
      revenueEstimate: totalClaims * 150, // Rough estimate
      cityStats,
      categoryStats,
    };
  }

  async getAdminAnalytics() {
    const analytics = await this.getAnalytics();
    const activeDeals = Array.from(this.deals.values()).filter(deal => deal.isActive).length;
    const pendingVendors = Array.from(this.vendors.values()).filter(vendor => !vendor.isApproved).length;
    const pendingDeals = Array.from(this.deals.values()).filter(deal => !deal.isApproved).length;
    const totalSavings = Array.from(this.dealClaims.values())
      .reduce((sum, claim) => sum + parseFloat(claim.actualSavings || claim.savingsAmount || "0"), 0);

    return {
      ...analytics,
      activeDeals,
      pendingVendors,
      pendingDeals,
      totalSavings,
      monthlyRevenue: 0, // Can be calculated based on business logic
      growthRate: 0, // Can be calculated based on historical data
    };
  }

  // POS operations
  async createPosSession(insertSession: InsertPosSession): Promise<PosSession> {
    const session: PosSession = {
      id: this.currentPosSessionId++,
      vendorId: insertSession.vendorId,
      terminalId: insertSession.terminalId,
      sessionToken: insertSession.sessionToken,
      isActive: insertSession.isActive ?? true,
      startedAt: new Date(),
      endedAt: null,
      totalTransactions: 0,
      totalAmount: "0",
    };
    this.posSessions.set(session.id, session);
    return session;
  }

  async endPosSession(sessionId: number): Promise<PosSession | undefined> {
    const session = this.posSessions.get(sessionId);
    if (session) {
      const updatedSession = { ...session, endedAt: new Date(), isActive: false };
      this.posSessions.set(sessionId, updatedSession);
      return updatedSession;
    }
    return undefined;
  }

  async getActivePosSession(vendorId: number, terminalId: string): Promise<PosSession | undefined> {
    return Array.from(this.posSessions.values())
      .find(session => session.vendorId === vendorId && session.terminalId === terminalId && session.isActive);
  }

  async getPosSessionsByVendor(vendorId: number): Promise<PosSession[]> {
    return Array.from(this.posSessions.values())
      .filter(session => session.vendorId === vendorId);
  }

  async createPosTransaction(insertTransaction: InsertPosTransaction): Promise<PosTransaction> {
    const transaction: PosTransaction = {
      id: this.currentPosTransactionId++,
      sessionId: insertTransaction.sessionId,
      dealId: insertTransaction.dealId,
      customerId: insertTransaction.customerId ?? null,
      transactionType: insertTransaction.transactionType,
      amount: insertTransaction.amount,
      savingsAmount: insertTransaction.savingsAmount,
      pinVerified: insertTransaction.pinVerified ?? null,
      paymentMethod: insertTransaction.paymentMethod ?? null,
      status: insertTransaction.status ?? 'completed',
      receiptNumber: insertTransaction.receiptNumber ?? null,
      notes: insertTransaction.notes ?? null,
      processedAt: new Date(),
    };
    this.posTransactions.set(transaction.id, transaction);

    // Update session totals
    const session = this.posSessions.get(transaction.sessionId);
    if (session) {
      session.totalTransactions = (session.totalTransactions || 0) + 1;
      session.totalAmount = (parseFloat(session.totalAmount || "0") + parseFloat(transaction.amount.toString())).toString();
      this.posSessions.set(session.id, session);
    }

    return transaction;
  }

  async getPosTransactionsBySession(sessionId: number): Promise<PosTransaction[]> {
    return Array.from(this.posTransactions.values())
      .filter(transaction => transaction.sessionId === sessionId);
  }

  async getPosTransactionsByVendor(vendorId: number): Promise<PosTransaction[]> {
    const vendorSessions = await this.getPosSessionsByVendor(vendorId);
    const sessionIds = vendorSessions.map(session => session.id);
    return Array.from(this.posTransactions.values())
      .filter(transaction => sessionIds.includes(transaction.sessionId));
  }

  async updatePosTransaction(id: number, updates: Partial<PosTransaction>): Promise<PosTransaction | undefined> {
    const transaction = this.posTransactions.get(id);
    if (transaction) {
      const updatedTransaction = { ...transaction, ...updates };
      this.posTransactions.set(id, updatedTransaction);
      return updatedTransaction;
    }
    return undefined;
  }

  async createPosInventory(insertInventory: InsertPosInventory): Promise<PosInventory> {
    const inventory: PosInventory = {
      id: this.currentPosInventoryId++,
      vendorId: insertInventory.vendorId,
      dealId: insertInventory.dealId,
      availableQuantity: insertInventory.availableQuantity,
      reservedQuantity: insertInventory.reservedQuantity ?? 0,
      reorderLevel: insertInventory.reorderLevel ?? 0,
      lastUpdated: new Date(),
    };
    this.posInventory.set(inventory.id, inventory);
    return inventory;
  }

  async updatePosInventory(id: number, updates: Partial<PosInventory>): Promise<PosInventory | undefined> {
    const inventory = this.posInventory.get(id);
    if (inventory) {
      const updatedInventory = { ...inventory, ...updates, lastUpdated: new Date() };
      this.posInventory.set(id, updatedInventory);
      return updatedInventory;
    }
    return undefined;
  }

  async getPosInventoryByVendor(vendorId: number): Promise<PosInventory[]> {
    return Array.from(this.posInventory.values())
      .filter(inventory => inventory.vendorId === vendorId);
  }

  async getPosInventoryByDeal(dealId: number): Promise<PosInventory | undefined> {
    return Array.from(this.posInventory.values())
      .find(inventory => inventory.dealId === dealId);
  }

  // Review and Rating operations
  async createCustomerReview(insertReview: InsertCustomerReview): Promise<CustomerReview> {
    const review: CustomerReview = {
      id: this.currentReviewId++,
      ...insertReview,
      helpfulVotes: 0,
      reportedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customerReviews.set(review.id, review);
    
    // Update rating summaries after review creation
    await this.updateDealRating(review.dealId);
    await this.updateVendorRating(review.vendorId);
    
    return review;
  }

  async getReviewsByDeal(dealId: number): Promise<CustomerReview[]> {
    return Array.from(this.customerReviews.values())
      .filter(review => review.dealId === dealId && review.isVisible)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getReviewsByVendor(vendorId: number): Promise<CustomerReview[]> {
    return Array.from(this.customerReviews.values())
      .filter(review => review.vendorId === vendorId && review.isVisible)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getReviewsByUser(userId: number): Promise<CustomerReview[]> {
    return Array.from(this.customerReviews.values())
      .filter(review => review.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getReviewByDealClaim(dealClaimId: number): Promise<CustomerReview | undefined> {
    return Array.from(this.customerReviews.values())
      .find(review => review.dealClaimId === dealClaimId);
  }

  async updateReview(id: number, updates: Partial<CustomerReview>): Promise<CustomerReview | undefined> {
    const review = this.customerReviews.get(id);
    if (review) {
      const updatedReview = { ...review, ...updates, updatedAt: new Date() };
      this.customerReviews.set(id, updatedReview);
      return updatedReview;
    }
    return undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    const review = this.customerReviews.get(id);
    if (review) {
      const deleted = this.customerReviews.delete(id);
      if (deleted) {
        // Update rating summaries after review deletion
        await this.updateDealRating(review.dealId);
        await this.updateVendorRating(review.vendorId);
      }
      return deleted;
    }
    return false;
  }

  async markReviewHelpful(reviewId: number): Promise<void> {
    const review = this.customerReviews.get(reviewId);
    if (review) {
      review.helpfulVotes = (review.helpfulVotes || 0) + 1;
      this.customerReviews.set(reviewId, review);
    }
  }

  async reportReview(reviewId: number): Promise<void> {
    const review = this.customerReviews.get(reviewId);
    if (review) {
      review.reportedCount = (review.reportedCount || 0) + 1;
      this.customerReviews.set(reviewId, review);
    }
  }

  // Rating summary operations
  async getDealRating(dealId: number): Promise<DealRating | undefined> {
    return this.dealRatings.get(dealId);
  }

  async getVendorRating(vendorId: number): Promise<VendorRating | undefined> {
    return this.vendorRatings.get(vendorId);
  }

  async updateDealRating(dealId: number): Promise<DealRating> {
    const reviews = await this.getReviewsByDeal(dealId);
    
    if (reviews.length === 0) {
      const emptyRating: DealRating = {
        id: this.currentDealRatingId++,
        dealId,
        avgDealQuality: "0",
        avgValueForMoney: "0",
        avgDealAccuracy: "0",
        avgOverallRating: "0",
        totalReviews: 0,
        recommendationPercentage: "0",
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        lastUpdated: new Date(),
      };
      this.dealRatings.set(dealId, emptyRating);
      return emptyRating;
    }

    // Calculate averages
    const totalReviews = reviews.length;
    const avgDealQuality = (reviews.reduce((sum, r) => sum + r.dealQualityRating, 0) / totalReviews).toFixed(2);
    const avgValueForMoney = (reviews.reduce((sum, r) => sum + r.valueForMoneyRating, 0) / totalReviews).toFixed(2);
    const avgDealAccuracy = (reviews.reduce((sum, r) => sum + r.dealAccuracyRating, 0) / totalReviews).toFixed(2);
    const avgOverallRating = (reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews).toFixed(2);
    
    // Calculate recommendation percentage
    const recommendCount = reviews.filter(r => r.wouldRecommend).length;
    const recommendationPercentage = ((recommendCount / totalReviews) * 100).toFixed(2);
    
    // Calculate star distribution
    const starCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.overallRating >= 1 && r.overallRating <= 5) {
        starCounts[r.overallRating - 1]++;
      }
    });

    const rating: DealRating = {
      id: this.currentDealRatingId++,
      dealId,
      avgDealQuality,
      avgValueForMoney,
      avgDealAccuracy,
      avgOverallRating,
      totalReviews,
      recommendationPercentage,
      oneStarCount: starCounts[0],
      twoStarCount: starCounts[1],
      threeStarCount: starCounts[2],
      fourStarCount: starCounts[3],
      fiveStarCount: starCounts[4],
      lastUpdated: new Date(),
    };

    this.dealRatings.set(dealId, rating);
    return rating;
  }

  async updateVendorRating(vendorId: number): Promise<VendorRating> {
    const reviews = await this.getReviewsByVendor(vendorId);
    
    if (reviews.length === 0) {
      const emptyRating: VendorRating = {
        id: this.currentVendorRatingId++,
        vendorId,
        avgServiceRating: "0",
        avgResponseRating: "0",
        avgProfessionalismRating: "0",
        avgOverallRating: "0",
        totalReviews: 0,
        totalDealsRated: 0,
        recommendationPercentage: "0",
        dealFulfillmentRate: "100",
        avgResponseTime: 0,
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        lastUpdated: new Date(),
      };
      this.vendorRatings.set(vendorId, emptyRating);
      return emptyRating;
    }

    // Calculate averages
    const totalReviews = reviews.length;
    const avgServiceRating = (reviews.reduce((sum, r) => sum + r.vendorServiceRating, 0) / totalReviews).toFixed(2);
    const avgResponseRating = (reviews.reduce((sum, r) => sum + r.vendorResponseRating, 0) / totalReviews).toFixed(2);
    const avgProfessionalismRating = (reviews.reduce((sum, r) => sum + r.vendorProfessionalismRating, 0) / totalReviews).toFixed(2);
    const avgOverallRating = (reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews).toFixed(2);
    
    // Calculate recommendation percentage
    const recommendCount = reviews.filter(r => r.wouldRecommend).length;
    const recommendationPercentage = ((recommendCount / totalReviews) * 100).toFixed(2);
    
    // Calculate unique deals rated
    const uniqueDeals = new Set(reviews.map(r => r.dealId));
    const totalDealsRated = uniqueDeals.size;
    
    // Calculate star distribution
    const starCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.overallRating >= 1 && r.overallRating <= 5) {
        starCounts[r.overallRating - 1]++;
      }
    });

    const rating: VendorRating = {
      id: this.currentVendorRatingId++,
      vendorId,
      avgServiceRating,
      avgResponseRating,
      avgProfessionalismRating,
      avgOverallRating,
      totalReviews,
      totalDealsRated,
      recommendationPercentage,
      dealFulfillmentRate: "100", // This would need to be calculated from actual redemption data
      avgResponseTime: 24, // Default value in hours
      oneStarCount: starCounts[0],
      twoStarCount: starCounts[1],
      threeStarCount: starCounts[2],
      fourStarCount: starCounts[3],
      fiveStarCount: starCounts[4],
      lastUpdated: new Date(),
    };

    this.vendorRatings.set(vendorId, rating);
    
    // Update vendor's overall rating in vendor record
    const vendor = this.vendors.get(vendorId);
    if (vendor) {
      vendor.rating = avgOverallRating;
      this.vendors.set(vendorId, vendor);
    }
    
    return rating;
  }

  async getDealsWithRatings(): Promise<(Deal & { rating?: DealRating })[]> {
    const deals = Array.from(this.deals.values());
    return Promise.all(deals.map(async deal => ({
      ...deal,
      rating: await this.getDealRating(deal.id)
    })));
  }

  async getVendorsWithRatings(): Promise<(Vendor & { rating?: VendorRating })[]> {
    const vendors = Array.from(this.vendors.values());
    return Promise.all(vendors.map(async vendor => ({
      ...vendor,
      rating: await this.getVendorRating(vendor.id)
    })));
  }

  // Review methods
  async createReview(review: InsertCustomerReview): Promise<CustomerReview> {
    const newReview: CustomerReview = {
      id: this.currentReviewId++,
      ...review,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.customerReviews.set(newReview.id, newReview);
    
    // Update ratings after creating review
    await this.updateDealRating(review.dealId);
    await this.updateVendorRating(review.vendorId);
    
    return newReview;
  }

  async getReviewById(id: number): Promise<CustomerReview | null> {
    return this.customerReviews.get(id) || null;
  }

  async getAllReviews(): Promise<CustomerReview[]> {
    return Array.from(this.customerReviews.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserReviewForDeal(userId: number, dealId: number): Promise<CustomerReview | null> {
    return Array.from(this.customerReviews.values())
      .find(review => review.userId === userId && review.dealId === dealId) || null;
  }

  async getReviewStats(): Promise<{
    totalReviews: number;
    avgOverallRating: number;
    avgDealRating: number;
    avgVendorServiceRating: number;
    avgVendorResponseRating: number;
    avgVendorProfessionalismRating: number;
    recommendationPercentage: number;
    starDistribution: { [key: number]: number };
  }> {
    const reviews = Array.from(this.customerReviews.values());
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        avgOverallRating: 0,
        avgDealRating: 0,
        avgVendorServiceRating: 0,
        avgVendorResponseRating: 0,
        avgVendorProfessionalismRating: 0,
        recommendationPercentage: 0,
        starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const avgOverallRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;
    const avgDealRating = reviews.reduce((sum, r) => sum + r.dealRating, 0) / totalReviews;
    const avgVendorServiceRating = reviews.reduce((sum, r) => sum + r.vendorServiceRating, 0) / totalReviews;
    const avgVendorResponseRating = reviews.reduce((sum, r) => sum + r.vendorResponseRating, 0) / totalReviews;
    const avgVendorProfessionalismRating = reviews.reduce((sum, r) => sum + r.vendorProfessionalismRating, 0) / totalReviews;
    
    const recommendCount = reviews.filter(r => r.wouldRecommend).length;
    const recommendationPercentage = (recommendCount / totalReviews) * 100;

    const starDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      if (r.overallRating >= 1 && r.overallRating <= 5) {
        starDistribution[r.overallRating]++;
      }
    });

    return {
      totalReviews,
      avgOverallRating: Math.round(avgOverallRating * 100) / 100,
      avgDealRating: Math.round(avgDealRating * 100) / 100,
      avgVendorServiceRating: Math.round(avgVendorServiceRating * 100) / 100,
      avgVendorResponseRating: Math.round(avgVendorResponseRating * 100) / 100,
      avgVendorProfessionalismRating: Math.round(avgVendorProfessionalismRating * 100) / 100,
      recommendationPercentage: Math.round(recommendationPercentage * 100) / 100,
      starDistribution,
    };
  }

  // Custom Deal Alerts methods
  async createCustomDealAlert(alert: InsertCustomDealAlert): Promise<CustomDealAlert> {
    const newAlert: CustomDealAlert = {
      id: this.currentCustomDealAlertId++,
      ...alert,
      totalMatches: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.customDealAlerts.set(newAlert.id, newAlert);
    return newAlert;
  }

  async getCustomDealAlertsByUser(userId: number): Promise<CustomDealAlert[]> {
    return Array.from(this.customDealAlerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCustomDealAlert(id: number): Promise<CustomDealAlert | undefined> {
    return this.customDealAlerts.get(id);
  }

  async updateCustomDealAlert(id: number, updates: Partial<CustomDealAlert>): Promise<CustomDealAlert | undefined> {
    const alert = this.customDealAlerts.get(id);
    if (!alert) return undefined;

    const updatedAlert: CustomDealAlert = {
      ...alert,
      ...updates,
      updatedAt: new Date(),
    };

    this.customDealAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteCustomDealAlert(id: number): Promise<boolean> {
    return this.customDealAlerts.delete(id);
  }

  async getActiveCustomDealAlerts(): Promise<CustomDealAlert[]> {
    return Array.from(this.customDealAlerts.values())
      .filter(alert => alert.isActive);
  }

  async triggerCustomDealAlert(alertId: number): Promise<void> {
    const alert = this.customDealAlerts.get(alertId);
    if (alert) {
      alert.lastTriggered = new Date();
      alert.totalMatches++;
      this.customDealAlerts.set(alertId, alert);
    }
  }

  // Deal Concierge methods
  async createDealConciergeRequest(request: InsertDealConciergeRequest): Promise<DealConciergeRequest> {
    const newRequest: DealConciergeRequest = {
      id: this.currentDealConciergeRequestId++,
      ...request,
      status: "pending",
      recommendedDeals: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.dealConciergeRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getDealConciergeRequestsByUser(userId: number): Promise<DealConciergeRequest[]> {
    return Array.from(this.dealConciergeRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDealConciergeRequest(id: number): Promise<DealConciergeRequest | undefined> {
    return this.dealConciergeRequests.get(id);
  }

  async updateDealConciergeRequest(id: number, updates: Partial<DealConciergeRequest>): Promise<DealConciergeRequest | undefined> {
    const request = this.dealConciergeRequests.get(id);
    if (!request) return undefined;

    const updatedRequest: DealConciergeRequest = {
      ...request,
      ...updates,
      updatedAt: new Date(),
    };

    this.dealConciergeRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getAllDealConciergeRequests(): Promise<DealConciergeRequest[]> {
    return Array.from(this.dealConciergeRequests.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDealConciergeRequestsByStatus(status: string): Promise<DealConciergeRequest[]> {
    return Array.from(this.dealConciergeRequests.values())
      .filter(request => request.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async assignDealConciergeRequest(id: number, assigneeId: number): Promise<DealConciergeRequest | undefined> {
    const request = this.dealConciergeRequests.get(id);
    if (!request) return undefined;

    const updatedRequest: DealConciergeRequest = {
      ...request,
      assignedTo: assigneeId,
      status: "in_progress",
      updatedAt: new Date(),
    };

    this.dealConciergeRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Alert Notifications methods
  async createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification> {
    const newNotification: AlertNotification = {
      id: this.currentAlertNotificationId++,
      ...notification,
      status: "pending",
      opened: false,
      clicked: false,
      dealClaimed: false,
      createdAt: new Date(),
    };
    
    this.alertNotifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getAlertNotificationsByUser(userId: number): Promise<AlertNotification[]> {
    return Array.from(this.alertNotifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAlertNotificationsByAlert(alertId: number): Promise<AlertNotification[]> {
    return Array.from(this.alertNotifications.values())
      .filter(notification => notification.alertId === alertId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateAlertNotification(id: number, updates: Partial<AlertNotification>): Promise<AlertNotification | undefined> {
    const notification = this.alertNotifications.get(id);
    if (!notification) return undefined;

    const updatedNotification: AlertNotification = {
      ...notification,
      ...updates,
    };

    this.alertNotifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markNotificationOpened(id: number): Promise<void> {
    const notification = this.alertNotifications.get(id);
    if (notification) {
      notification.opened = true;
      this.alertNotifications.set(id, notification);
    }
  }

  async markNotificationClicked(id: number): Promise<void> {
    const notification = this.alertNotifications.get(id);
    if (notification) {
      notification.clicked = true;
      this.alertNotifications.set(id, notification);
    }
  }

  async markNotificationDealClaimed(id: number): Promise<void> {
    const notification = this.alertNotifications.get(id);
    if (notification) {
      notification.dealClaimed = true;
      this.alertNotifications.set(id, notification);
    }
  }

  private currentCustomDealAlertId = 1;
  private currentDealConciergeRequestId = 1;
  private currentAlertNotificationId = 1;

  // PIN Security operations
  async recordPinAttempt(dealId: number, userId: number | null, ipAddress: string, userAgent: string | null, success: boolean): Promise<void> {
    const attempt: PinAttempt = {
      id: this.currentPinAttemptId++,
      dealId,
      userId,
      ipAddress,
      userAgent,
      success,
      attemptedAt: new Date(),
    };
    
    this.pinAttempts.set(attempt.id, attempt);
  }

  async getPinAttempts(dealId: number, userId?: number, ipAddress?: string): Promise<Array<{ attemptedAt: Date; success: boolean }>> {
    const attempts = Array.from(this.pinAttempts.values())
      .filter(attempt => {
        if (attempt.dealId !== dealId) return false;
        if (userId && attempt.userId !== userId) return false;
        if (ipAddress && attempt.ipAddress !== ipAddress) return false;
        return true;
      })
      .map(attempt => ({
        attemptedAt: attempt.attemptedAt,
        success: attempt.success
      }))
      .sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime());

    return attempts;
  }

  async updateDealPin(dealId: number, hashedPin: string, salt: string, expiresAt?: Date): Promise<Deal | undefined> {
    const deal = this.deals.get(dealId);
    if (!deal) return undefined;

    const updatedDeal: Deal = {
      ...deal,
      verificationPin: hashedPin,
      pinSalt: salt,
      pinCreatedAt: new Date(),
      pinExpiresAt: expiresAt || null,
    };

    this.deals.set(dealId, updatedDeal);
    return updatedDeal;
  }
}

export const storage = new MemStorage();