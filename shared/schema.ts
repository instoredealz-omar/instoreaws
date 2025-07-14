import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // customer, vendor, admin, superadmin
  name: text("name").notNull(),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  profileImage: text("profile_image"), // URL or base64 data for profile photo
  membershipPlan: text("membership_plan").default("basic"), // basic, premium, ultimate
  membershipExpiry: timestamp("membership_expiry"),
  isPromotionalUser: boolean("is_promotional_user").default(false),
  totalSavings: decimal("total_savings", { precision: 10, scale: 2 }).default("0"),
  dealsClaimed: integer("deals_claimed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Vendors table for business information
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  businessName: text("business_name").notNull(),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number").notNull(),
  panCardFile: text("pan_card_file"),
  logoUrl: text("logo_url"),
  companyWebsite: text("company_website"),
  description: text("description"),
  address: text("address"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isApproved: boolean("is_approved").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalDeals: integer("total_deals").default(0),
  totalRedemptions: integer("total_redemptions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // fashion, electronics, travel, food, home, fitness
  subcategory: text("subcategory"), // For hierarchical categories like Services
  imageUrl: text("image_url"),
  discountPercentage: integer("discount_percentage").notNull(),

  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until").notNull(),
  maxRedemptions: integer("max_redemptions"),
  currentRedemptions: integer("current_redemptions").default(0),
  isActive: boolean("is_active").default(true),
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  isRejected: boolean("is_rejected").default(false),
  rejectedBy: integer("rejected_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  viewCount: integer("view_count").default(0),
  requiredMembership: text("required_membership").default("basic"), // basic, premium, ultimate
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  verificationPin: text("verification_pin").notNull(), // Hashed PIN for offline verification
  pinSalt: text("pin_salt"), // Salt for PIN hashing
  pinCreatedAt: timestamp("pin_created_at").defaultNow(), // PIN creation time
  pinExpiresAt: timestamp("pin_expires_at"), // PIN expiration (optional)
  createdAt: timestamp("created_at").defaultNow(),
});

// Deal claims/redemptions
export const dealClaims = pgTable("deal_claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow(),
  usedAt: timestamp("used_at"),
  savingsAmount: decimal("savings_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("claimed"), // claimed, used, expired, pending, completed
  billAmount: decimal("bill_amount", { precision: 10, scale: 2 }), // Total bill amount entered by customer
  actualSavings: decimal("actual_savings", { precision: 10, scale: 2 }), // Calculated savings based on bill amount
});

// Help tickets
export const helpTickets = pgTable("help_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open"), // open, in_progress, resolved, closed
  priority: text("priority").default("medium"), // low, medium, high, urgent
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wishlist table for user favorites
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// System logs
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// POS Sessions for tracking active POS terminals
export const posSessions = pgTable("pos_sessions", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  terminalId: text("terminal_id").notNull(), // unique identifier for each POS terminal
  sessionToken: text("session_token").notNull().unique(),
  isActive: boolean("is_active").default(true),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  totalTransactions: integer("total_transactions").default(0),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
});

// POS Transactions for detailed transaction tracking
export const posTransactions = pgTable("pos_transactions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => posSessions.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  customerId: integer("customer_id").references(() => users.id),
  transactionType: text("transaction_type").notNull(), // claim, redeem, refund
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  savingsAmount: decimal("savings_amount", { precision: 10, scale: 2 }).notNull(),
  pinVerified: boolean("pin_verified").default(false),
  paymentMethod: text("payment_method"), // cash, card, upi, wallet
  status: text("status").default("completed"), // pending, completed, failed, refunded
  receiptNumber: text("receipt_number").unique(),
  notes: text("notes"),
  processedAt: timestamp("processed_at").defaultNow(),
});

// PIN Verification Attempts for security tracking
export const pinAttempts = pgTable("pin_attempts", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

// POS Inventory for tracking deal availability at terminals
export const posInventory = pgTable("pos_inventory", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  reservedQuantity: integer("reserved_quantity").default(0),
  reorderLevel: integer("reorder_level").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Customer Reviews for Deals and Vendors
export const customerReviews = pgTable("customer_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  dealClaimId: integer("deal_claim_id").references(() => dealClaims.id).notNull(), // Links to specific redemption
  
  // Deal-specific ratings (1-5 stars)
  dealQualityRating: integer("deal_quality_rating").notNull(), // How good was the deal/product
  valueForMoneyRating: integer("value_for_money_rating").notNull(), // Was it worth the price
  dealAccuracyRating: integer("deal_accuracy_rating").notNull(), // Did it match description
  
  // Vendor-specific ratings (1-5 stars)
  vendorServiceRating: integer("vendor_service_rating").notNull(), // Service quality
  vendorResponseRating: integer("vendor_response_rating").notNull(), // Response time and helpfulness
  vendorProfessionalismRating: integer("vendor_professionalism_rating").notNull(), // Overall professionalism
  
  // Overall experience
  overallRating: integer("overall_rating").notNull(), // Overall experience (1-5 stars)
  
  // Written feedback
  reviewTitle: text("review_title"),
  reviewText: text("review_text"),
  pros: text("pros"), // What customer liked
  cons: text("cons"), // What could be improved
  
  // Metadata
  wouldRecommend: boolean("would_recommend").default(true),
  isVerifiedPurchase: boolean("is_verified_purchase").default(true), // Always true since review comes after redemption
  isVisible: boolean("is_visible").default(true), // For moderation
  helpfulVotes: integer("helpful_votes").default(0), // For community feedback on reviews
  reportedCount: integer("reported_count").default(0), // For spam/inappropriate content
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deal Ratings Summary (calculated from reviews)
export const dealRatings = pgTable("deal_ratings", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => deals.id).notNull().unique(),
  
  // Average ratings
  avgDealQuality: decimal("avg_deal_quality", { precision: 3, scale: 2 }).default("0"),
  avgValueForMoney: decimal("avg_value_for_money", { precision: 3, scale: 2 }).default("0"),
  avgDealAccuracy: decimal("avg_deal_accuracy", { precision: 3, scale: 2 }).default("0"),
  avgOverallRating: decimal("avg_overall_rating", { precision: 3, scale: 2 }).default("0"),
  
  // Review counts
  totalReviews: integer("total_reviews").default(0),
  recommendationPercentage: decimal("recommendation_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Star distribution
  oneStarCount: integer("one_star_count").default(0),
  twoStarCount: integer("two_star_count").default(0),
  threeStarCount: integer("three_star_count").default(0),
  fourStarCount: integer("four_star_count").default(0),
  fiveStarCount: integer("five_star_count").default(0),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Vendor Ratings Summary (calculated from reviews)
export const vendorRatings = pgTable("vendor_ratings", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull().unique(),
  
  // Average ratings
  avgServiceRating: decimal("avg_service_rating", { precision: 3, scale: 2 }).default("0"),
  avgResponseRating: decimal("avg_response_rating", { precision: 3, scale: 2 }).default("0"),
  avgProfessionalismRating: decimal("avg_professionalism_rating", { precision: 3, scale: 2 }).default("0"),
  avgOverallRating: decimal("avg_overall_rating", { precision: 3, scale: 2 }).default("0"),
  
  // Performance metrics
  totalReviews: integer("total_reviews").default(0),
  totalDealsRated: integer("total_deals_rated").default(0),
  recommendationPercentage: decimal("recommendation_percentage", { precision: 5, scale: 2 }).default("0"),
  dealFulfillmentRate: decimal("deal_fulfillment_rate", { precision: 5, scale: 2 }).default("100"), // % of successful redemptions
  avgResponseTime: integer("avg_response_time").default(0), // In hours
  
  // Star distribution for overall rating
  oneStarCount: integer("one_star_count").default(0),
  twoStarCount: integer("two_star_count").default(0),
  threeStarCount: integer("three_star_count").default(0),
  fourStarCount: integer("four_star_count").default(0),
  fiveStarCount: integer("five_star_count").default(0),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Custom Deal Alerts for Ultimate members
export const customDealAlerts = pgTable("custom_deal_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Alert criteria
  alertName: text("alert_name").notNull(),
  categories: json("categories").$type<string[]>().default([]), // Array of categories
  minDiscountPercentage: integer("min_discount_percentage"),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  keywords: text("keywords"), // Comma-separated keywords
  cities: json("cities").$type<string[]>().default([]), // Array of cities
  maxDistance: integer("max_distance"), // In kilometers for location-based alerts
  
  // Notification preferences
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  
  // Alert status
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  totalMatches: integer("total_matches").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Personal Deal Concierge requests for Ultimate members
export const dealConciergeRequests = pgTable("deal_concierge_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Request details
  requestTitle: text("request_title").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  budgetRange: text("budget_range"), // e.g., "1000-5000", "under-500", "above-10000"
  preferredLocation: text("preferred_location"),
  urgency: text("urgency").default("medium"), // low, medium, high
  
  // Concierge response
  status: text("status").default("pending"), // pending, in_progress, completed, cancelled
  assignedTo: integer("assigned_to").references(() => users.id), // Admin/concierge user
  conciergeNotes: text("concierge_notes"),
  recommendedDeals: json("recommended_deals").$type<number[]>().default([]), // Array of deal IDs
  
  // Communication
  lastContactDate: timestamp("last_contact_date"),
  responseDeadline: timestamp("response_deadline"),
  customerSatisfaction: integer("customer_satisfaction"), // 1-5 rating
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deal Alert Notifications log
export const alertNotifications = pgTable("alert_notifications", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => customDealAlerts.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Notification details
  notificationType: text("notification_type").notNull(), // email, sms, push
  status: text("status").default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  
  // Engagement tracking
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
  dealClaimed: boolean("deal_claimed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  vendor: one(vendors, { fields: [users.id], references: [vendors.userId] }),
  dealClaims: many(dealClaims),
  helpTickets: many(helpTickets),
  systemLogs: many(systemLogs),
  wishlists: many(wishlists),
  reviews: many(customerReviews),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, { fields: [vendors.userId], references: [users.id] }),
  deals: many(deals),
  reviews: many(customerReviews),
  vendorRating: one(vendorRatings, { fields: [vendors.id], references: [vendorRatings.vendorId] }),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  vendor: one(vendors, { fields: [deals.vendorId], references: [vendors.id] }),
  approver: one(users, { fields: [deals.approvedBy], references: [users.id] }),
  claims: many(dealClaims),
  wishlists: many(wishlists),
  reviews: many(customerReviews),
  dealRating: one(dealRatings, { fields: [deals.id], references: [dealRatings.dealId] }),
}));

export const dealClaimsRelations = relations(dealClaims, ({ one, many }) => ({
  user: one(users, { fields: [dealClaims.userId], references: [users.id] }),
  deal: one(deals, { fields: [dealClaims.dealId], references: [deals.id] }),
  review: one(customerReviews, { fields: [dealClaims.id], references: [customerReviews.dealClaimId] }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, { fields: [wishlists.userId], references: [users.id] }),
  deal: one(deals, { fields: [wishlists.dealId], references: [deals.id] }),
}));

export const posSessionsRelations = relations(posSessions, ({ one, many }) => ({
  vendor: one(vendors, { fields: [posSessions.vendorId], references: [vendors.id] }),
  transactions: many(posTransactions),
}));

export const posTransactionsRelations = relations(posTransactions, ({ one }) => ({
  session: one(posSessions, { fields: [posTransactions.sessionId], references: [posSessions.id] }),
  deal: one(deals, { fields: [posTransactions.dealId], references: [deals.id] }),
  customer: one(users, { fields: [posTransactions.customerId], references: [users.id] }),
}));

export const posInventoryRelations = relations(posInventory, ({ one }) => ({
  vendor: one(vendors, { fields: [posInventory.vendorId], references: [vendors.id] }),
  deal: one(deals, { fields: [posInventory.dealId], references: [deals.id] }),
}));

// Review system relations
export const customerReviewsRelations = relations(customerReviews, ({ one }) => ({
  user: one(users, { fields: [customerReviews.userId], references: [users.id] }),
  deal: one(deals, { fields: [customerReviews.dealId], references: [deals.id] }),
  vendor: one(vendors, { fields: [customerReviews.vendorId], references: [vendors.id] }),
  dealClaim: one(dealClaims, { fields: [customerReviews.dealClaimId], references: [dealClaims.id] }),
}));

export const dealRatingsRelations = relations(dealRatings, ({ one }) => ({
  deal: one(deals, { fields: [dealRatings.dealId], references: [deals.id] }),
}));

export const vendorRatingsRelations = relations(vendorRatings, ({ one }) => ({
  vendor: one(vendors, { fields: [vendorRatings.vendorId], references: [vendors.id] }),
}));

// New relations for concierge and alerts
export const customDealAlertsRelations = relations(customDealAlerts, ({ one, many }) => ({
  user: one(users, { fields: [customDealAlerts.userId], references: [users.id] }),
  notifications: many(alertNotifications),
}));

export const dealConciergeRequestsRelations = relations(dealConciergeRequests, ({ one }) => ({
  user: one(users, { fields: [dealConciergeRequests.userId], references: [users.id] }),
  assignee: one(users, { fields: [dealConciergeRequests.assignedTo], references: [users.id] }),
}));

export const alertNotificationsRelations = relations(alertNotifications, ({ one }) => ({
  alert: one(customDealAlerts, { fields: [alertNotifications.alertId], references: [customDealAlerts.id] }),
  deal: one(deals, { fields: [alertNotifications.dealId], references: [deals.id] }),
  user: one(users, { fields: [alertNotifications.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  currentRedemptions: true,
  viewCount: true,
});

export const insertDealClaimSchema = createInsertSchema(dealClaims).omit({
  id: true,
  claimedAt: true,
});

export const insertHelpTicketSchema = createInsertSchema(helpTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  addedAt: true,
});

export const insertPosSessionSchema = createInsertSchema(posSessions).omit({
  id: true,
  startedAt: true,
  totalTransactions: true,
  totalAmount: true,
});

export const insertPosTransactionSchema = createInsertSchema(posTransactions).omit({
  id: true,
  processedAt: true,
});

export const insertPosInventorySchema = createInsertSchema(posInventory).omit({
  id: true,
  lastUpdated: true,
});

// Review system insert schemas
export const insertCustomerReviewSchema = createInsertSchema(customerReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulVotes: true,
  reportedCount: true,
});

export const insertDealRatingSchema = createInsertSchema(dealRatings).omit({
  id: true,
  lastUpdated: true,
});

export const insertVendorRatingSchema = createInsertSchema(vendorRatings).omit({
  id: true,
  lastUpdated: true,
});

// Custom Deal Alerts and Concierge schemas
export const insertCustomDealAlertSchema = createInsertSchema(customDealAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalMatches: true,
});

export const insertDealConciergeRequestSchema = createInsertSchema(dealConciergeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertPinAttemptSchema = createInsertSchema(pinAttempts).omit({
  id: true,
  attemptedAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type DealClaim = typeof dealClaims.$inferSelect;
export type InsertDealClaim = z.infer<typeof insertDealClaimSchema>;
export type HelpTicket = typeof helpTickets.$inferSelect;
export type InsertHelpTicket = z.infer<typeof insertHelpTicketSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type PosSession = typeof posSessions.$inferSelect;
export type InsertPosSession = z.infer<typeof insertPosSessionSchema>;
export type PosTransaction = typeof posTransactions.$inferSelect;
export type InsertPosTransaction = z.infer<typeof insertPosTransactionSchema>;
export type PosInventory = typeof posInventory.$inferSelect;
export type InsertPosInventory = z.infer<typeof insertPosInventorySchema>;
export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = z.infer<typeof insertCustomerReviewSchema>;
export type DealRating = typeof dealRatings.$inferSelect;
export type InsertDealRating = z.infer<typeof insertDealRatingSchema>;
export type VendorRating = typeof vendorRatings.$inferSelect;
export type InsertVendorRating = z.infer<typeof insertVendorRatingSchema>;
export type CustomDealAlert = typeof customDealAlerts.$inferSelect;
export type InsertCustomDealAlert = z.infer<typeof insertCustomDealAlertSchema>;
export type DealConciergeRequest = typeof dealConciergeRequests.$inferSelect;
export type InsertDealConciergeRequest = z.infer<typeof insertDealConciergeRequestSchema>;
export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;
export type PinAttempt = typeof pinAttempts.$inferSelect;
export type InsertPinAttempt = z.infer<typeof insertPinAttemptSchema>;

// Auth schemas
export const loginSchema = z.object({
  credential: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  role: z.enum(["customer", "vendor", "admin", "superadmin"]).default("customer"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

// Profile update schemas
export const updateUserProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  profileImage: z.string().optional(),
});

export const updateVendorProfileSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters").optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  logoUrl: z.string().url("Invalid URL").optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UpdateVendorProfile = z.infer<typeof updateVendorProfileSchema>;
