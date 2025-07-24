import { db } from "./db";
import { eq, and, desc, asc, like, count, sql, isNotNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { IStorage } from "./storage";
import type {
  User,
  InsertUser,
  Vendor,
  InsertVendor,
  Deal,
  InsertDeal,
  DealLocation,
  InsertDealLocation,
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
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.phone, phone));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, role)).orderBy(desc(schema.users.createdAt));
  }

  // Vendor operations
  async getVendor(id: number): Promise<Vendor | undefined> {
    const result = await db.select().from(schema.vendors).where(eq(schema.vendors.id, id));
    return result[0];
  }

  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    const result = await db.select().from(schema.vendors).where(eq(schema.vendors.userId, userId));
    return result[0];
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const result = await db.insert(schema.vendors).values(vendor).returning();
    return result[0];
  }

  async updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const result = await db.update(schema.vendors).set(updates).where(eq(schema.vendors.id, id)).returning();
    return result[0];
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(schema.vendors).orderBy(desc(schema.vendors.createdAt));
  }

  async getPendingVendors(): Promise<Vendor[]> {
    return await db.select().from(schema.vendors).where(eq(schema.vendors.isApproved, false)).orderBy(desc(schema.vendors.createdAt));
  }

  async approveVendor(id: number): Promise<Vendor | undefined> {
    const result = await db.update(schema.vendors).set({ isApproved: true }).where(eq(schema.vendors.id, id)).returning();
    return result[0];
  }

  // Deal operations
  async getDeal(id: number): Promise<Deal | undefined> {
    const result = await db.select().from(schema.deals).where(eq(schema.deals.id, id));
    return result[0];
  }

  async getDealsBy(filters: Partial<Deal>): Promise<Deal[]> {
    let query = db.select().from(schema.deals);
    
    // Apply filters dynamically
    const conditions: any[] = [];
    if (filters.category) conditions.push(eq(schema.deals.category, filters.category));
    if (filters.vendorId) conditions.push(eq(schema.deals.vendorId, filters.vendorId));
    if (filters.isActive !== undefined) conditions.push(eq(schema.deals.isActive, filters.isActive));
    if (filters.isApproved !== undefined) conditions.push(eq(schema.deals.isApproved, filters.isApproved));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(schema.deals.createdAt));
  }

  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(schema.deals).orderBy(desc(schema.deals.createdAt));
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const result = await db.insert(schema.deals).values(deal).returning();
    return result[0];
  }

  async updateDeal(id: number, updates: Partial<Deal>): Promise<Deal | undefined> {
    const result = await db.update(schema.deals).set(updates).where(eq(schema.deals.id, id)).returning();
    return result[0];
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db.delete(schema.deals).where(eq(schema.deals.id, id));
    return result.rowCount > 0;
  }

  async getActiveDeals(): Promise<Deal[]> {
    return await db.select().from(schema.deals)
      .where(and(eq(schema.deals.isActive, true), eq(schema.deals.isApproved, true)))
      .orderBy(desc(schema.deals.createdAt));
  }

  async getDealsByCategory(category: string): Promise<Deal[]> {
    return await db.select().from(schema.deals)
      .where(eq(schema.deals.category, category))
      .orderBy(desc(schema.deals.createdAt));
  }

  async getDealsByVendor(vendorId: number): Promise<Deal[]> {
    return await db.select().from(schema.deals)
      .where(eq(schema.deals.vendorId, vendorId))
      .orderBy(desc(schema.deals.createdAt));
  }

  async getPendingDeals(): Promise<Deal[]> {
    return await db.select().from(schema.deals)
      .where(eq(schema.deals.isApproved, false))
      .orderBy(desc(schema.deals.createdAt));
  }

  async approveDeal(id: number, approvedBy: number): Promise<Deal | undefined> {
    const result = await db.update(schema.deals)
      .set({ isApproved: true, approvedBy })
      .where(eq(schema.deals.id, id))
      .returning();
    return result[0];
  }

  async rejectDeal(id: number, rejectedBy: number, reason: string): Promise<Deal | undefined> {
    const result = await db.update(schema.deals)
      .set({ isRejected: true, rejectedBy, rejectionReason: reason })
      .where(eq(schema.deals.id, id))
      .returning();
    return result[0];
  }

  async incrementDealViews(id: number): Promise<void> {
    await db.update(schema.deals)
      .set({ viewCount: sql`${schema.deals.viewCount} + 1` })
      .where(eq(schema.deals.id, id));
  }

  // Deal location operations
  async createDealLocation(location: InsertDealLocation): Promise<DealLocation> {
    const result = await db.insert(schema.dealLocations).values(location).returning();
    return result[0];
  }

  async getDealLocations(dealId: number): Promise<DealLocation[]> {
    return await db.select().from(schema.dealLocations)
      .where(eq(schema.dealLocations.dealId, dealId))
      .orderBy(asc(schema.dealLocations.createdAt));
  }

  // Deal claim operations
  async claimDeal(claim: InsertDealClaim): Promise<DealClaim> {
    const result = await db.insert(schema.dealClaims).values(claim).returning();
    return result[0];
  }

  async getUserClaims(userId: number): Promise<DealClaim[]> {
    return await db.select().from(schema.dealClaims)
      .where(eq(schema.dealClaims.userId, userId))
      .orderBy(desc(schema.dealClaims.claimedAt));
  }

  async updateDealClaim(id: number, updates: Partial<DealClaim>): Promise<DealClaim | undefined> {
    const result = await db.update(schema.dealClaims)
      .set(updates)
      .where(eq(schema.dealClaims.id, id))
      .returning();
    return result[0];
  }

  async getDealClaim(id: number): Promise<DealClaim | undefined> {
    const result = await db.select().from(schema.dealClaims).where(eq(schema.dealClaims.id, id));
    return result[0];
  }

  async getDealClaims(dealId: number): Promise<DealClaim[]> {
    return await db.select().from(schema.dealClaims)
      .where(eq(schema.dealClaims.dealId, dealId))
      .orderBy(desc(schema.dealClaims.claimedAt));
  }

  async getAllDealClaims(): Promise<DealClaim[]> {
    return await db.select().from(schema.dealClaims).orderBy(desc(schema.dealClaims.claimedAt));
  }

  async updateClaimStatus(id: number, status: string, usedAt?: Date): Promise<DealClaim | undefined> {
    const updates: Partial<DealClaim> = { status };
    if (usedAt) {
      updates.usedAt = usedAt;
    }
    const result = await db.update(schema.dealClaims)
      .set(updates)
      .where(eq(schema.dealClaims.id, id))
      .returning();
    return result[0];
  }

  async incrementDealRedemptions(dealId: number): Promise<void> {
    await db.update(schema.deals)
      .set({ currentRedemptions: sql`${schema.deals.currentRedemptions} + 1` })
      .where(eq(schema.deals.id, dealId));
  }

  // Help ticket operations
  async createHelpTicket(ticket: InsertHelpTicket): Promise<HelpTicket> {
    const result = await db.insert(schema.helpTickets).values(ticket).returning();
    return result[0];
  }

  async getHelpTicket(id: number): Promise<HelpTicket | undefined> {
    const result = await db.select().from(schema.helpTickets).where(eq(schema.helpTickets.id, id));
    return result[0];
  }

  async getAllHelpTickets(): Promise<HelpTicket[]> {
    return await db.select().from(schema.helpTickets).orderBy(desc(schema.helpTickets.createdAt));
  }

  async getUserHelpTickets(userId: number): Promise<HelpTicket[]> {
    return await db.select().from(schema.helpTickets)
      .where(eq(schema.helpTickets.userId, userId))
      .orderBy(desc(schema.helpTickets.createdAt));
  }

  async updateHelpTicket(id: number, updates: Partial<HelpTicket>): Promise<HelpTicket | undefined> {
    const result = await db.update(schema.helpTickets)
      .set(updates)
      .where(eq(schema.helpTickets.id, id))
      .returning();
    return result[0];
  }

  // System log operations
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const result = await db.insert(schema.systemLogs).values(log).returning();
    return result[0];
  }

  async getSystemLogs(): Promise<SystemLog[]> {
    return await db.select().from(schema.systemLogs).orderBy(desc(schema.systemLogs.createdAt));
  }

  async getSystemLogsByUser(userId: number): Promise<SystemLog[]> {
    return await db.select().from(schema.systemLogs)
      .where(eq(schema.systemLogs.userId, userId))
      .orderBy(desc(schema.systemLogs.createdAt));
  }

  // Wishlist operations
  async addToWishlist(wishlist: InsertWishlist): Promise<Wishlist> {
    const result = await db.insert(schema.wishlists).values(wishlist).returning();
    return result[0];
  }

  async removeFromWishlist(userId: number, dealId: number): Promise<boolean> {
    const result = await db.delete(schema.wishlists)
      .where(and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.dealId, dealId)));
    return result.rowCount > 0;
  }

  async getUserWishlist(userId: number): Promise<Wishlist[]> {
    return await db.select().from(schema.wishlists)
      .where(eq(schema.wishlists.userId, userId))
      .orderBy(desc(schema.wishlists.addedAt));
  }

  async isInWishlist(userId: number, dealId: number): Promise<boolean> {
    const result = await db.select().from(schema.wishlists)
      .where(and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.dealId, dealId)));
    return result.length > 0;
  }

  // POS Session operations
  async createPosSession(session: InsertPosSession): Promise<PosSession> {
    const result = await db.insert(schema.posSessions).values(session).returning();
    return result[0];
  }

  async getPosSession(id: number): Promise<PosSession | undefined> {
    const result = await db.select().from(schema.posSessions).where(eq(schema.posSessions.id, id));
    return result[0];
  }

  async getPosSessionByToken(token: string): Promise<PosSession | undefined> {
    const result = await db.select().from(schema.posSessions).where(eq(schema.posSessions.sessionToken, token));
    return result[0];
  }

  async updatePosSession(id: number, updates: Partial<PosSession>): Promise<PosSession | undefined> {
    const result = await db.update(schema.posSessions)
      .set(updates)
      .where(eq(schema.posSessions.id, id))
      .returning();
    return result[0];
  }

  async endPosSession(id: number): Promise<PosSession | undefined> {
    const result = await db.update(schema.posSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(schema.posSessions.id, id))
      .returning();
    return result[0];
  }

  async getVendorPosSessions(vendorId: number): Promise<PosSession[]> {
    return await db.select().from(schema.posSessions)
      .where(eq(schema.posSessions.vendorId, vendorId))
      .orderBy(desc(schema.posSessions.startedAt));
  }

  // POS Transaction operations
  async createPosTransaction(transaction: InsertPosTransaction): Promise<PosTransaction> {
    const result = await db.insert(schema.posTransactions).values(transaction).returning();
    return result[0];
  }

  async getPosTransaction(id: number): Promise<PosTransaction | undefined> {
    const result = await db.select().from(schema.posTransactions).where(eq(schema.posTransactions.id, id));
    return result[0];
  }

  async getSessionTransactions(sessionId: number): Promise<PosTransaction[]> {
    return await db.select().from(schema.posTransactions)
      .where(eq(schema.posTransactions.sessionId, sessionId))
      .orderBy(desc(schema.posTransactions.processedAt));
  }

  async updatePosTransaction(id: number, updates: Partial<PosTransaction>): Promise<PosTransaction | undefined> {
    const result = await db.update(schema.posTransactions)
      .set(updates)
      .where(eq(schema.posTransactions.id, id))
      .returning();
    return result[0];
  }

  // POS Inventory operations
  async createPosInventory(inventory: InsertPosInventory): Promise<PosInventory> {
    const result = await db.insert(schema.posInventory).values(inventory).returning();
    return result[0];
  }

  async getPosInventory(id: number): Promise<PosInventory | undefined> {
    const result = await db.select().from(schema.posInventory).where(eq(schema.posInventory.id, id));
    return result[0];
  }

  async getVendorPosInventory(vendorId: number): Promise<PosInventory[]> {
    return await db.select().from(schema.posInventory)
      .where(eq(schema.posInventory.vendorId, vendorId))
      .orderBy(desc(schema.posInventory.lastUpdated));
  }

  async updatePosInventory(id: number, updates: Partial<PosInventory>): Promise<PosInventory | undefined> {
    const result = await db.update(schema.posInventory)
      .set(updates)
      .where(eq(schema.posInventory.id, id))
      .returning();
    return result[0];
  }

  // Customer Review operations
  async createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview> {
    const result = await db.insert(schema.customerReviews).values(review).returning();
    return result[0];
  }

  async getCustomerReview(id: number): Promise<CustomerReview | undefined> {
    const result = await db.select().from(schema.customerReviews).where(eq(schema.customerReviews.id, id));
    return result[0];
  }

  async getDealReviews(dealId: number): Promise<CustomerReview[]> {
    return await db.select().from(schema.customerReviews)
      .where(eq(schema.customerReviews.dealId, dealId))
      .orderBy(desc(schema.customerReviews.createdAt));
  }

  async getVendorReviews(vendorId: number): Promise<CustomerReview[]> {
    return await db.select().from(schema.customerReviews)
      .where(eq(schema.customerReviews.vendorId, vendorId))
      .orderBy(desc(schema.customerReviews.createdAt));
  }

  async getUserReviews(userId: number): Promise<CustomerReview[]> {
    return await db.select().from(schema.customerReviews)
      .where(eq(schema.customerReviews.userId, userId))
      .orderBy(desc(schema.customerReviews.createdAt));
  }

  async updateCustomerReview(id: number, updates: Partial<CustomerReview>): Promise<CustomerReview | undefined> {
    const result = await db.update(schema.customerReviews)
      .set(updates)
      .where(eq(schema.customerReviews.id, id))
      .returning();
    return result[0];
  }

  // Deal Rating operations
  async upsertDealRating(rating: InsertDealRating): Promise<DealRating> {
    const result = await db.insert(schema.dealRatings)
      .values(rating)
      .onConflictDoUpdate({
        target: schema.dealRatings.dealId,
        set: rating
      })
      .returning();
    return result[0];
  }

  async getDealRating(dealId: number): Promise<DealRating | undefined> {
    const result = await db.select().from(schema.dealRatings).where(eq(schema.dealRatings.dealId, dealId));
    return result[0];
  }

  // Vendor Rating operations
  async upsertVendorRating(rating: InsertVendorRating): Promise<VendorRating> {
    const result = await db.insert(schema.vendorRatings)
      .values(rating)
      .onConflictDoUpdate({
        target: schema.vendorRatings.vendorId,
        set: rating
      })
      .returning();
    return result[0];
  }

  async getVendorRating(vendorId: number): Promise<VendorRating | undefined> {
    const result = await db.select().from(schema.vendorRatings).where(eq(schema.vendorRatings.vendorId, vendorId));
    return result[0];
  }

  // Custom Deal Alert operations
  async createCustomDealAlert(alert: InsertCustomDealAlert): Promise<CustomDealAlert> {
    const result = await db.insert(schema.customDealAlerts).values(alert).returning();
    return result[0];
  }

  async getCustomDealAlert(id: number): Promise<CustomDealAlert | undefined> {
    const result = await db.select().from(schema.customDealAlerts).where(eq(schema.customDealAlerts.id, id));
    return result[0];
  }

  async getUserCustomDealAlerts(userId: number): Promise<CustomDealAlert[]> {
    return await db.select().from(schema.customDealAlerts)
      .where(eq(schema.customDealAlerts.userId, userId))
      .orderBy(desc(schema.customDealAlerts.createdAt));
  }

  async updateCustomDealAlert(id: number, updates: Partial<CustomDealAlert>): Promise<CustomDealAlert | undefined> {
    const result = await db.update(schema.customDealAlerts)
      .set(updates)
      .where(eq(schema.customDealAlerts.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomDealAlert(id: number): Promise<boolean> {
    const result = await db.delete(schema.customDealAlerts).where(eq(schema.customDealAlerts.id, id));
    return result.rowCount > 0;
  }

  // Deal Concierge Request operations
  async createDealConciergeRequest(request: InsertDealConciergeRequest): Promise<DealConciergeRequest> {
    const result = await db.insert(schema.dealConciergeRequests).values(request).returning();
    return result[0];
  }

  async getDealConciergeRequest(id: number): Promise<DealConciergeRequest | undefined> {
    const result = await db.select().from(schema.dealConciergeRequests).where(eq(schema.dealConciergeRequests.id, id));
    return result[0];
  }

  async getUserDealConciergeRequests(userId: number): Promise<DealConciergeRequest[]> {
    return await db.select().from(schema.dealConciergeRequests)
      .where(eq(schema.dealConciergeRequests.userId, userId))
      .orderBy(desc(schema.dealConciergeRequests.createdAt));
  }

  async updateDealConciergeRequest(id: number, updates: Partial<DealConciergeRequest>): Promise<DealConciergeRequest | undefined> {
    const result = await db.update(schema.dealConciergeRequests)
      .set(updates)
      .where(eq(schema.dealConciergeRequests.id, id))
      .returning();
    return result[0];
  }

  async getAllDealConciergeRequests(): Promise<DealConciergeRequest[]> {
    return await db.select().from(schema.dealConciergeRequests).orderBy(desc(schema.dealConciergeRequests.createdAt));
  }

  // Alert Notification operations
  async createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification> {
    const result = await db.insert(schema.alertNotifications).values(notification).returning();
    return result[0];
  }

  async getAlertNotification(id: number): Promise<AlertNotification | undefined> {
    const result = await db.select().from(schema.alertNotifications).where(eq(schema.alertNotifications.id, id));
    return result[0];
  }

  async getUserAlertNotifications(userId: number): Promise<AlertNotification[]> {
    return await db.select().from(schema.alertNotifications)
      .where(eq(schema.alertNotifications.userId, userId))
      .orderBy(desc(schema.alertNotifications.createdAt));
  }

  async updateAlertNotification(id: number, updates: Partial<AlertNotification>): Promise<AlertNotification | undefined> {
    const result = await db.update(schema.alertNotifications)
      .set(updates)
      .where(eq(schema.alertNotifications.id, id))
      .returning();
    return result[0];
  }

  async markNotificationSent(id: number): Promise<void> {
    await db.update(schema.alertNotifications)
      .set({ sentAt: new Date() })
      .where(eq(schema.alertNotifications.id, id));
  }

  async markNotificationDealClaimed(id: number): Promise<void> {
    await db.update(schema.alertNotifications)
      .set({ dealClaimed: true })
      .where(eq(schema.alertNotifications.id, id));
  }

  // PIN Security operations
  async recordPinAttempt(dealId: number, userId: number | null, ipAddress: string, userAgent: string | null, success: boolean): Promise<void> {
    await db.insert(schema.pinAttempts).values({
      dealId,
      userId,
      ipAddress,
      userAgent,
      success,
      attemptedAt: new Date(),
    });
  }

  async getPinAttempts(dealId: number, userId?: number, ipAddress?: string): Promise<Array<{ attemptedAt: Date; success: boolean }>> {
    let query = db.select({
      attemptedAt: schema.pinAttempts.attemptedAt,
      success: schema.pinAttempts.success
    }).from(schema.pinAttempts).where(eq(schema.pinAttempts.dealId, dealId));

    const conditions = [eq(schema.pinAttempts.dealId, dealId)];
    if (userId) conditions.push(eq(schema.pinAttempts.userId, userId));
    if (ipAddress) conditions.push(eq(schema.pinAttempts.ipAddress, ipAddress));

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(schema.pinAttempts.attemptedAt));
  }

  async updateDealPin(dealId: number, hashedPin: string, salt: string, expiresAt?: Date): Promise<Deal | undefined> {
    const result = await db.update(schema.deals)
      .set({
        verificationPin: hashedPin,
        pinSalt: salt,
        pinCreatedAt: new Date(),
        pinExpiresAt: expiresAt || null,
      })
      .where(eq(schema.deals.id, dealId))
      .returning();
    return result[0];
  }

  // Analytics operations
  async getAnalytics(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalDeals: number;
    totalClaims: number;
    revenueEstimate: number;
    cityStats: Array<{ city: string; dealCount: number; userCount: number }>;
    categoryStats: Array<{ category: string; dealCount: number; claimCount: number }>;
  }> {
    try {
      // Get total counts
      const totalUsers = await db.select({ count: count() }).from(schema.users);
      const totalVendors = await db.select({ count: count() }).from(schema.vendors);
      const totalDeals = await db.select({ count: count() }).from(schema.deals);
      const totalClaims = await db.select({ count: count() }).from(schema.dealClaims);

      // Get city stats
      const cityUserStats = await db.select({
        city: schema.users.city,
        userCount: count()
      })
      .from(schema.users)
      .where(isNotNull(schema.users.city))
      .groupBy(schema.users.city);

      const cityDealStats = await db.select({
        city: schema.vendors.city,
        dealCount: count()
      })
      .from(schema.deals)
      .innerJoin(schema.vendors, eq(schema.deals.vendorId, schema.vendors.id))
      .groupBy(schema.vendors.city);

      // Merge city stats
      const cityStatsMap = new Map<string, { city: string; dealCount: number; userCount: number }>();
      
      cityUserStats.forEach(stat => {
        if (stat.city) {
          cityStatsMap.set(stat.city, {
            city: stat.city,
            dealCount: 0,
            userCount: Number(stat.userCount)
          });
        }
      });

      cityDealStats.forEach(stat => {
        if (stat.city) {
          const existing = cityStatsMap.get(stat.city) || { city: stat.city, dealCount: 0, userCount: 0 };
          existing.dealCount = Number(stat.dealCount);
          cityStatsMap.set(stat.city, existing);
        }
      });

      // Get category stats
      const categoryDealStats = await db.select({
        category: schema.deals.category,
        dealCount: count()
      })
      .from(schema.deals)
      .groupBy(schema.deals.category);

      const categoryClaimStats = await db.select({
        category: schema.deals.category,
        claimCount: count()
      })
      .from(schema.dealClaims)
      .innerJoin(schema.deals, eq(schema.dealClaims.dealId, schema.deals.id))
      .groupBy(schema.deals.category);

      // Merge category stats
      const categoryStatsMap = new Map<string, { category: string; dealCount: number; claimCount: number }>();
      
      categoryDealStats.forEach(stat => {
        categoryStatsMap.set(stat.category, {
          category: stat.category,
          dealCount: Number(stat.dealCount),
          claimCount: 0
        });
      });

      categoryClaimStats.forEach(stat => {
        const existing = categoryStatsMap.get(stat.category) || { category: stat.category, dealCount: 0, claimCount: 0 };
        existing.claimCount = Number(stat.claimCount);
        categoryStatsMap.set(stat.category, existing);
      });

      const cityStats = Array.from(cityStatsMap.values());
      const categoryStats = Array.from(categoryStatsMap.values());

      return {
        totalUsers: Number(totalUsers[0].count),
        totalVendors: Number(totalVendors[0].count),
        totalDeals: Number(totalDeals[0].count),
        totalClaims: Number(totalClaims[0].count),
        revenueEstimate: Number(totalClaims[0].count) * 150, // Rough estimate
        cityStats,
        categoryStats,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Return default values if analytics fetch fails
      return {
        totalUsers: 0,
        totalVendors: 0,
        totalDeals: 0,
        totalClaims: 0,
        revenueEstimate: 0,
        cityStats: [],
        categoryStats: [],
      };
    }
  }

  // Location-based analytics methods
  async getLocationAnalytics(): Promise<{
    sublocationStats: Array<{ sublocation: string; city: string; state: string; dealCount: number; claimCount: number }>;
    cityDealDistribution: Array<{ city: string; state: string; totalDeals: number; totalClaims: number }>;
    areaPerformance: Array<{ area: string; city: string; conversionRate: number; averageSavings: number }>;
  }> {
    try {
      // Get sublocation stats from deal locations
      const sublocationDealStats = await db.select({
        sublocation: schema.dealLocations.sublocation,
        city: schema.dealLocations.city,
        state: schema.dealLocations.state,
        dealCount: count()
      })
      .from(schema.dealLocations)
      .where(isNotNull(schema.dealLocations.sublocation))
      .groupBy(schema.dealLocations.sublocation, schema.dealLocations.city, schema.dealLocations.state);

      // Get claim stats by sublocation
      const sublocationClaimStats = await db.select({
        sublocation: schema.dealLocations.sublocation,
        city: schema.dealLocations.city,
        state: schema.dealLocations.state,
        claimCount: count()
      })
      .from(schema.dealClaims)
      .innerJoin(schema.deals, eq(schema.dealClaims.dealId, schema.deals.id))
      .innerJoin(schema.dealLocations, eq(schema.deals.id, schema.dealLocations.dealId))
      .where(isNotNull(schema.dealLocations.sublocation))
      .groupBy(schema.dealLocations.sublocation, schema.dealLocations.city, schema.dealLocations.state);

      // Merge sublocation stats
      const sublocationMap = new Map<string, { sublocation: string; city: string; state: string; dealCount: number; claimCount: number }>();
      
      sublocationDealStats.forEach(stat => {
        if (stat.sublocation) {
          const key = `${stat.sublocation}-${stat.city}`;
          sublocationMap.set(key, {
            sublocation: stat.sublocation,
            city: stat.city,
            state: stat.state,
            dealCount: Number(stat.dealCount),
            claimCount: 0
          });
        }
      });

      sublocationClaimStats.forEach(stat => {
        if (stat.sublocation) {
          const key = `${stat.sublocation}-${stat.city}`;
          const existing = sublocationMap.get(key) || { 
            sublocation: stat.sublocation, 
            city: stat.city, 
            state: stat.state, 
            dealCount: 0, 
            claimCount: 0 
          };
          existing.claimCount = Number(stat.claimCount);
          sublocationMap.set(key, existing);
        }
      });

      // Get city-wise deal distribution including both main deals and location-specific deals
      const cityDistribution = await db.select({
        city: schema.dealLocations.city,
        state: schema.dealLocations.state,
        totalDeals: count(schema.deals.id),
        totalClaims: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dealClaims.id} IS NOT NULL THEN 1 ELSE 0 END), 0)`
      })
      .from(schema.dealLocations)
      .innerJoin(schema.deals, eq(schema.dealLocations.dealId, schema.deals.id))
      .leftJoin(schema.dealClaims, eq(schema.deals.id, schema.dealClaims.dealId))
      .groupBy(schema.dealLocations.city, schema.dealLocations.state);

      // Calculate area performance metrics
      const areaPerformance = await db.select({
        area: schema.dealLocations.sublocation,
        city: schema.dealLocations.city,
        totalDeals: count(schema.deals.id),
        totalClaims: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dealClaims.id} IS NOT NULL THEN 1 ELSE 0 END), 0)`,
        averageSavings: sql<number>`COALESCE(AVG(${schema.dealClaims.actualSavings}), 0)`
      })
      .from(schema.dealLocations)
      .innerJoin(schema.deals, eq(schema.dealLocations.dealId, schema.deals.id))
      .leftJoin(schema.dealClaims, eq(schema.deals.id, schema.dealClaims.dealId))
      .where(isNotNull(schema.dealLocations.sublocation))
      .groupBy(schema.dealLocations.sublocation, schema.dealLocations.city);

      const sublocationStats = Array.from(sublocationMap.values());
      const cityDealDistribution = cityDistribution.map(stat => ({
        city: stat.city,
        state: stat.state,
        totalDeals: Number(stat.totalDeals),
        totalClaims: Number(stat.totalClaims)
      }));

      const areaPerformanceData = areaPerformance.map(stat => ({
        area: stat.area || 'Unknown',
        city: stat.city,
        conversionRate: Number(stat.totalDeals) > 0 ? (Number(stat.totalClaims) / Number(stat.totalDeals)) * 100 : 0,
        averageSavings: Number(stat.averageSavings)
      }));

      return {
        sublocationStats,
        cityDealDistribution,
        areaPerformance: areaPerformanceData
      };
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      return {
        sublocationStats: [],
        cityDealDistribution: [],
        areaPerformance: []
      };
    }
  }

  async getVendorLocationAnalytics(vendorId: number): Promise<{
    storePerformance: Array<{ storeName: string; sublocation: string; city: string; dealCount: number; claimCount: number; revenue: number }>;
    cityBreakdown: Array<{ city: string; state: string; storeCount: number; totalDeals: number; totalClaims: number }>;
  }> {
    try {
      // Get vendor store performance
      const storePerformance = await db.select({
        storeName: schema.dealLocations.storeName,
        sublocation: schema.dealLocations.sublocation,
        city: schema.dealLocations.city,
        dealCount: count(schema.deals.id),
        claimCount: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dealClaims.id} IS NOT NULL THEN 1 ELSE 0 END), 0)`,
        revenue: sql<number>`COALESCE(SUM(${schema.dealClaims.actualSavings}), 0)`
      })
      .from(schema.dealLocations)
      .innerJoin(schema.deals, eq(schema.dealLocations.dealId, schema.deals.id))
      .leftJoin(schema.dealClaims, eq(schema.deals.id, schema.dealClaims.dealId))
      .where(eq(schema.deals.vendorId, vendorId))
      .groupBy(schema.dealLocations.storeName, schema.dealLocations.sublocation, schema.dealLocations.city);

      // Get city breakdown for vendor
      const cityBreakdown = await db.select({
        city: schema.dealLocations.city,
        state: schema.dealLocations.state,
        storeCount: sql<number>`COUNT(DISTINCT ${schema.dealLocations.id})`,
        totalDeals: count(schema.deals.id),
        totalClaims: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dealClaims.id} IS NOT NULL THEN 1 ELSE 0 END), 0)`
      })
      .from(schema.dealLocations)
      .innerJoin(schema.deals, eq(schema.dealLocations.dealId, schema.deals.id))
      .leftJoin(schema.dealClaims, eq(schema.deals.id, schema.dealClaims.dealId))
      .where(eq(schema.deals.vendorId, vendorId))
      .groupBy(schema.dealLocations.city, schema.dealLocations.state);

      return {
        storePerformance: storePerformance.map(stat => ({
          storeName: stat.storeName,
          sublocation: stat.sublocation || 'Main Location',
          city: stat.city,
          dealCount: Number(stat.dealCount),
          claimCount: Number(stat.claimCount),
          revenue: Number(stat.revenue)
        })),
        cityBreakdown: cityBreakdown.map(stat => ({
          city: stat.city,
          state: stat.state,
          storeCount: Number(stat.storeCount),
          totalDeals: Number(stat.totalDeals),
          totalClaims: Number(stat.totalClaims)
        }))
      };
    } catch (error) {
      console.error('Error fetching vendor location analytics:', error);
      return {
        storePerformance: [],
        cityBreakdown: []
      };
    }
  }
}