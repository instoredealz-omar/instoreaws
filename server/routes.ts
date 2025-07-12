import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import axios, { AxiosError, AxiosResponse } from "axios";
import { storage } from "./storage";
import { loginSchema, signupSchema, insertVendorSchema, insertDealSchema, insertHelpTicketSchema, insertWishlistSchema, updateUserProfileSchema, updateVendorProfileSchema, insertCustomDealAlertSchema, insertDealConciergeRequestSchema, insertAlertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmail, getWelcomeCustomerEmail, getVendorRegistrationEmail } from "./email";
import jwt from "jsonwebtoken";

// Configure axios defaults
const externalAPI = axios.create({
  baseURL: 'https://api.instoredealz.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
  },
});

// Enhanced logging utility
class Logger {
  static info(message: string, data?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }

  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
}

// Error handling utility
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// External API response handler
const handleExternalApiCall = async <T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  operationName: string
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    Logger.debug(`Starting external API call: ${operationName}`);
    const response = await apiCall();
    Logger.info(`External API call successful: ${operationName}`, { status: response.status });
    return { success: true, data: response.data };
  } catch (error) {
    if (error instanceof AxiosError) {
      Logger.error(`External API call failed: ${operationName}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'External API error'
      };
    }
    Logger.error(`Unexpected error in external API call: ${operationName}`, error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// Enhanced error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  Logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Session interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
  };
  dealInfo?: {
    deal: any;
    user: any;
    membershipTier: string;
  };
}

// Middleware to check authentication
const requireAuth = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to check specific roles
const requireRole = (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
};

// Middleware to check membership tier access for deals
const checkMembershipAccess = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: "Please log in to access deal details",
        requiresAuth: true 
      });
    }

    const dealId = parseInt(req.params.id);
    const deal = await storage.getDeal(dealId);
    
    if (!deal || !deal.isActive || !deal.isApproved) {
      return res.status(404).json({ message: "Deal not found or not available" });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const membershipTier = user.membershipPlan || 'basic';
    const dealCategory = deal.category.toLowerCase();

    // Check if user can access this deal based on membership tier
    let canAccess = false;
    let upgradeMessage = '';
    let suggestedTier = '';

    switch (membershipTier) {
      case 'basic':
        const basicAllowedCategories = ['restaurants', 'fashion', 'travel', 'food'];
        if (basicAllowedCategories.includes(dealCategory)) {
          canAccess = true;
        } else {
          upgradeMessage = `Upgrade your plan to access ${deal.category} deals. Current plan: Basic`;
          suggestedTier = 'premium';
        }
        break;
      case 'premium':
        const premiumRestrictedCategories = ['luxury', 'premium-electronics'];
        if (!premiumRestrictedCategories.includes(dealCategory)) {
          canAccess = true;
        } else {
          upgradeMessage = `Upgrade to Ultimate plan to access premium ${deal.category} deals. Current plan: Premium`;
          suggestedTier = 'ultimate';
        }
        break;
      case 'ultimate':
        canAccess = true;
        break;
      default:
        upgradeMessage = 'Please upgrade your membership to access deals';
        suggestedTier = 'premium';
    }

    if (!canAccess) {
      return res.status(403).json({
        message: upgradeMessage,
        requiresUpgrade: true,
        currentTier: membershipTier,
        suggestedTier: suggestedTier,
        dealCategory: deal.category,
        dealTitle: deal.title
      });
    }

    // Store deal info in request for use in route handler
    req.dealInfo = { deal, user, membershipTier };
    next();
  } catch (error) {
    console.error("Error checking membership access:", error);
    res.status(500).json({ message: "Failed to verify membership access" });
  }
};

// Helper functions for geolocation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

const generateLocationHint = (userLat: number, userLon: number, dealLat: number, dealLon: number, address: string): string => {
  const bearing = calculateBearing(userLat, userLon, dealLat, dealLon);
  const direction = getDirectionFromBearing(bearing);
  const distance = calculateDistance(userLat, userLon, dealLat, dealLon);
  
  // Extract area/landmark from address for better hint
  const addressParts = address.split(',').map(part => part.trim());
  const areaHint = addressParts.length > 1 ? addressParts[0] : '';
  
  if (distance < 0.5) {
    return `Very close to you${areaHint ? ` near ${areaHint}` : ''}`;
  } else if (distance < 2) {
    return `${direction} of you${areaHint ? ` in ${areaHint}` : ''}`;
  } else {
    return `${formatDistance(distance)} ${direction}${areaHint ? ` in ${areaHint}` : ''}`;
  }
};

const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

const getDirectionFromBearing = (bearing: number): string => {
  const directions = [
    'North', 'Northeast', 'East', 'Southeast',
    'South', 'Southwest', 'West', 'Northwest'
  ];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

const calculateRelevanceScore = (deal: any, distance: number, vendor: any): number => {
  let score = 100;
  
  // Distance factor (closer = higher score)
  score -= Math.min(distance * 5, 50); // Max 50 point deduction for distance
  
  // Discount factor
  if (deal.discountPercentage >= 50) score += 20;
  else if (deal.discountPercentage >= 30) score += 10;
  else if (deal.discountPercentage >= 20) score += 5;
  
  // View count factor (popular deals get boost)
  if (deal.viewCount > 100) score += 15;
  else if (deal.viewCount > 50) score += 10;
  else if (deal.viewCount > 20) score += 5;
  
  // Expiry factor (ending soon gets boost)
  const daysUntilExpiry = (new Date(deal.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry <= 1) score += 10; // Ending soon
  else if (daysUntilExpiry <= 3) score += 5;
  
  // Membership tier factor (basic deals get slight boost for accessibility)
  if (deal.requiredMembership === 'basic') score += 5;
  
  return Math.max(0, Math.min(100, score));
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health endpoint for monitoring and keep-alive
  app.get('/health', (req, res) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    res.status(200).json(healthData);
  });

  // JWT authentication middleware
  app.use((req: AuthenticatedRequest, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Check if it's a JWT token (starts with 'eyJ')
        if (token.startsWith('eyJ')) {
          // JWT token - verify and decode
          const payload = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key') as any;
          req.user = { 
            id: payload.userId, 
            role: payload.role, 
            email: payload.email 
          };
        } else {
          // Simple pipe-separated token for backwards compatibility
          const [id, role, email] = token.split('|');
          req.user = { id: parseInt(id), role, email };
        }
      } catch (e) {
        // Invalid token, continue without user
      }
    }
    next();
  });

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { credential, password } = loginSchema.parse(req.body);
      
      // Check if credential is an email or phone number
      const isEmail = credential.includes('@');
      const user = isEmail 
        ? await storage.getUserByEmail(credential)
        : await storage.getUserByPhone(credential);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // For demo purposes, compare plain text passwords
      // In production, use bcrypt to compare hashed passwords
      
      // Debug logging for password comparison
      Logger.debug("Login password comparison", {
        credential: credential,
        credentialType: isEmail ? 'email' : 'phone',
        storedPassword: user.password,
        providedPassword: password,
        storedPasswordType: typeof user.password,
        providedPasswordType: typeof password,
        passwordsMatch: user.password === password,
        storedPasswordLength: user.password?.length,
        providedPasswordLength: password?.length
      });
      
      // Ensure both passwords are strings and trim any whitespace
      const storedPassword = String(user.password || '').trim();
      const providedPassword = String(password || '').trim();
      
      if (storedPassword !== providedPassword) {
        Logger.warn("Password mismatch", {
          credential: credential,
          credentialType: isEmail ? 'email' : 'phone',
          storedPasswordPreview: storedPassword.substring(0, 3) + '***',
          providedPasswordPreview: providedPassword.substring(0, 3) + '***'
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role, 
          email: user.email 
        },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '24h' }
      );
      
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          membershipPlan: user.membershipPlan,
          isPromotionalUser: user.isPromotionalUser,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const userData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create user
      // For demo purposes, store plain text passwords
      // In production, hash passwords with bcrypt before storing
      
      // Debug logging for signup
      Logger.debug("User signup password storage", {
        email: userData.email,
        passwordProvided: userData.password,
        passwordType: typeof userData.password,
        passwordLength: userData.password?.length
      });
      
      // Ensure password is properly trimmed string
      const cleanedUserData = {
        ...userData,
        password: String(userData.password || '').trim(),
      };
      
      const user = await storage.createUser(cleanedUserData);
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role, 
          email: user.email 
        },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '24h' }
      );
      
      // Log signup activity
      await storage.createSystemLog({
        userId: user.id,
        action: "USER_SIGNUP",
        details: { role: user.role, email: user.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Send welcome email for customers
      if (user.role === 'customer') {
        try {
          const emailData = getWelcomeCustomerEmail(user.name, user.email);
          await sendEmail(emailData);
          Logger.info('Welcome email sent successfully', { userId: user.id, email: user.email });
        } catch (emailError) {
          Logger.error('Failed to send welcome email', { userId: user.id, email: user.email, error: emailError });
          // Don't fail the signup if email fails
        }
      }
      
      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          membershipPlan: user.membershipPlan,
          isPromotionalUser: user.isPromotionalUser,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipPlan: user.membershipPlan,
      membershipExpiry: user.membershipExpiry,
      isPromotionalUser: user.isPromotionalUser,
      totalSavings: user.totalSavings,
      dealsClaimed: user.dealsClaimed,
      city: user.city,
      state: user.state,
      phone: user.phone,
      username: user.username,
    });
  });

  // User profile update endpoint
  app.put('/api/users/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const profileData = updateUserProfileSchema.parse(req.body);
      const userId = req.user!.id;
      
      const updatedUser = await storage.updateUser(userId, profileData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log profile update
      await storage.createSystemLog({
        userId,
        action: "USER_PROFILE_UPDATED",
        details: { updatedFields: Object.keys(profileData) },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      // Return safe user data (without password)
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Deal routes
  app.get('/api/deals', async (req, res) => {
    try {
      const { category, city } = req.query;
      let deals = await storage.getActiveDeals();
      
      if (category) {
        deals = deals.filter(deal => deal.category === category);
      }
      
      // Filter by vendor city if city parameter provided
      if (city) {
        const vendors = await storage.getAllVendors();
        const cityVendorIds = vendors
          .filter(vendor => vendor.city === city)
          .map(vendor => vendor.id);
        deals = deals.filter(deal => cityVendorIds.includes(deal.vendorId));
      }
      
      // Include vendor info
      const vendors = await storage.getAllVendors();
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      
      const dealsWithVendors = deals.map(deal => ({
        ...deal,
        vendor: vendorMap.get(deal.vendorId),
      }));
      
      res.json(dealsWithVendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  // Public deal detail endpoint (no auth required for basic viewing)
  app.get('/api/deals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deal = await storage.getDeal(id);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Get vendor info
      const vendor = await storage.getVendor(deal.vendorId);
      
      // Remove sensitive data like PIN from public endpoint
      const { verificationPin, ...dealData } = deal;
      
      res.json({
        ...dealData,
        vendor,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  // Protected deal detail endpoint with membership verification
  app.get('/api/deals/:id/secure', checkMembershipAccess, async (req: AuthenticatedRequest, res) => {
    try {
      const { deal, user, membershipTier } = req.dealInfo!;
      
      // Increment view count for authenticated access
      await storage.incrementDealViews(deal.id);
      
      // Get vendor info
      const vendor = await storage.getVendor(deal.vendorId);
      
      // Include verification PIN for authenticated users for secure deal access
      res.json({
        ...deal,
        vendor,
        membershipTier,
        hasAccess: true,
        // Include PIN for authenticated users (required for PIN verification system)
        verificationPin: deal.verificationPin
      });
    } catch (error) {
      console.error("Error fetching secure deal:", error);
      res.status(500).json({ message: "Failed to fetch deal details" });
    }
  });



  // Increment deal view count
  app.post('/api/deals/:id/view', async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      await storage.incrementDealViews(dealId);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });

  app.post('/api/deals/:id/claim', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const deal = await storage.getDeal(dealId);
      if (!deal || !deal.isActive || !deal.isApproved) {
        return res.status(404).json({ message: "Deal not found or not available" });
      }
      
      // Check if deal is still valid
      if (new Date(deal.validUntil) < new Date()) {
        return res.status(400).json({ message: "Deal has expired" });
      }
      
      // Check redemption limit
      if (deal.maxRedemptions && (deal.currentRedemptions || 0) >= deal.maxRedemptions) {
        return res.status(400).json({ message: "Deal redemption limit reached" });
      }
      
      // Check membership requirement
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const membershipLevels = { basic: 1, premium: 2, ultimate: 3 };
      const userLevel = membershipLevels[user.membershipPlan as keyof typeof membershipLevels] || 1;
      const requiredLevel = membershipLevels[deal.requiredMembership as keyof typeof membershipLevels] || 1;
      
      if (userLevel < requiredLevel) {
        return res.status(403).json({ message: "Upgrade membership to claim this deal" });
      }
      
      // Allow multiple claims - create new claim each time
      const claim = await storage.claimDeal({
        userId,
        dealId,
        savingsAmount: "0", // No savings until PIN verification
        status: "pending", // Mark as pending until store verification
        claimedAt: new Date()
      });

      // Log the claim activity (but not as completed savings)
      await storage.createSystemLog({
        userId,
        action: "DEAL_CLAIMED_PENDING",
        details: {
          dealId,
          dealTitle: deal.title,
          status: "pending_verification"
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.status(201).json({
        ...claim,
        message: "Deal claimed! Visit the store and verify your PIN to complete the redemption.",
        savingsAmount: 0, // No savings until verified
        requiresVerification: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim deal" });
    }
  });

  // Security-enhanced PIN information endpoint (development only)
  app.get('/api/deals/:id/debug-pin', async (req: AuthenticatedRequest, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: 'Not found' });
    }
    
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      
      // Only show PIN status, not actual PIN for security
      res.json({ 
        dealId: deal.id,
        title: deal.title, 
        hasPinSet: !!deal.verificationPin,
        isSecurePin: !!deal.pinSalt,
        pinCreated: deal.pinCreatedAt,
        pinExpires: deal.pinExpiresAt,
        securityLevel: deal.pinSalt ? 'secure' : 'legacy'
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/deals/:id/verify-pin - Secure PIN verification and redemption
  app.post('/api/deals/:id/verify-pin', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { pin } = req.body;
      const userId = req.user!.id;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || '';

      // Import PIN security utilities
      const { validatePinFormat, verifyPin, checkRateLimit, verifyRotatingPin } = await import('./pin-security');

      // Validate PIN format first
      const validation = validatePinFormat(pin);
      if (!validation.isValid) {
        // Record failed attempt
        await storage.recordPinAttempt(dealId, userId, ipAddress, userAgent, false);
        
        return res.status(400).json({
          success: false,
          error: validation.message
        });
      }

      // Get deal details
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({
          success: false,
          error: "Deal not found"
        });
      }

      // Check if deal is active and approved
      if (!deal.isActive || !deal.isApproved) {
        return res.status(400).json({
          success: false,
          error: "This deal is not currently available"
        });
      }

      // Check if deal has expired
      if (new Date() > new Date(deal.validUntil)) {
        return res.status(400).json({
          success: false,
          error: "This deal has expired"
        });
      }

      // Check rate limiting
      const attempts = await storage.getPinAttempts(dealId, userId, ipAddress);
      const rateLimitCheck = checkRateLimit(attempts);
      
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: rateLimitCheck.message,
          nextAttemptAt: rateLimitCheck.nextAttemptAt
        });
      }

      // Verify PIN using multiple methods: rotating PIN, secure hashing, and legacy fallback
      let pinVerificationResult;
      let isRotatingPin = false;
      
      // First, try rotating PIN verification
      if (verifyRotatingPin(dealId, pin)) {
        pinVerificationResult = {
          isValid: true,
          message: "Rotating PIN verified successfully"
        };
        isRotatingPin = true;
      } else if (deal.pinSalt) {
        // New secure PIN verification
        pinVerificationResult = await verifyPin(
          pin, 
          deal.verificationPin, 
          deal.pinSalt, 
          deal.pinExpiresAt || undefined
        );
      } else {
        // Legacy plain text PIN verification (temporary)
        const cleanPin = String(pin || '').trim();
        const storedPin = String(deal.verificationPin || '').trim();
        pinVerificationResult = {
          isValid: cleanPin === storedPin,
          message: cleanPin === storedPin ? "PIN verified successfully" : "Invalid PIN"
        };
      }
      
      // Record PIN attempt
      await storage.recordPinAttempt(dealId, userId, ipAddress, userAgent, pinVerificationResult.isValid);
      
      if (!pinVerificationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: pinVerificationResult.message
        });
      }

      // Get the most recent pending claim for this deal and user, or create new one
      const existingClaims = await storage.getUserClaims(userId);
      const pendingClaim = existingClaims.find(claim => claim.dealId === dealId && claim.status === "pending");
      
      Logger.debug("User Claims Check", {
        userId,
        dealId,
        totalClaims: existingClaims.length,
        hasPendingClaim: !!pendingClaim,
        allClaims: existingClaims.map(c => ({ dealId: c.dealId, status: c.status }))
      });

      // Use existing pending claim or create new one (allow multiple claims)
      let currentClaim = pendingClaim;
      if (!currentClaim) {
        currentClaim = await storage.claimDeal({
          dealId,
          userId,
          status: "pending",
          savingsAmount: "0",
          claimedAt: new Date()
        });
        Logger.debug("Auto-created new claim for PIN verification", {
          claimId: currentClaim.id,
          dealId,
          userId
        });
      }

      // Check redemption limits
      if (deal.maxRedemptions && (deal.currentRedemptions || 0) >= deal.maxRedemptions) {
        return res.status(400).json({
          success: false,
          error: "This deal has reached its redemption limit"
        });
      }

      // Calculate potential savings for display only if deal has fixed pricing
      let savingsAmount = 0;
      
      if (deal.originalPrice && deal.discountedPrice) {
        const originalPrice = parseFloat(deal.originalPrice);
        const discountedPrice = parseFloat(deal.discountedPrice);
        savingsAmount = originalPrice - discountedPrice;
      }
      // For percentage-based deals, savings will only be calculated when bill amount is provided

      // Keep claim as "pending" - don't mark as "used" until bill amount is handled
      // This allows customers to verify PIN multiple times if they skip bill amount
      if (currentClaim.status === "pending") {
        await storage.updateDealClaim(currentClaim.id, {
          status: "pending", // Keep as pending until bill amount step
          savingsAmount: savingsAmount.toString()
        });
      }

      // Increment deal redemption count when PIN is verified
      await storage.incrementDealRedemptions(dealId);

      // Log the PIN verification (not full redemption yet)
      await storage.createSystemLog({
        userId,
        action: "DEAL_PIN_VERIFIED",
        details: {
          dealId,
          dealTitle: deal.title,
          claimStatus: "pending",
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: "PIN verified successfully! Please add your bill amount to complete the redemption.",
        savingsAmount: savingsAmount,
        claimId: currentClaim.id,
        status: "pending",
        dealTitle: deal.title,
        discountPercentage: deal.discountPercentage
      });

    } catch (error) {
      Logger.error("PIN verification error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify PIN and redeem deal"
      });
    }
  });

  // Update bill amount for deal claim
  app.post('/api/deals/:id/update-bill', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { billAmount, actualSavings, savings } = req.body;
      const userId = req.user!.id;

      // Accept either 'actualSavings' or 'savings' parameter for flexibility
      const savingsAmount = actualSavings || savings;

      if (!billAmount || !savingsAmount || billAmount <= 0 || savingsAmount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid bill amount and savings are required" 
        });
      }

      // Get deal details
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ 
          success: false, 
          message: "Deal not found" 
        });
      }

      // Find the most recent claim for this deal (any status)
      const existingClaims = await storage.getUserClaims(userId);
      const dealClaim = existingClaims
        .filter(claim => claim.dealId === dealId)
        .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime())[0];
      
      if (!dealClaim) {
        return res.status(404).json({ 
          success: false, 
          message: "No claim found for this deal" 
        });
      }

      // Update user's total savings (subtract previous actual savings if this is an update)
      const user = await storage.getUser(userId);
      const currentTotalSavings = parseFloat(user?.totalSavings || "0");
      const previousActualSavings = dealClaim.actualSavings ? parseFloat(dealClaim.actualSavings) : 0;
      const newTotalSavings = currentTotalSavings - previousActualSavings + savingsAmount;

      await storage.updateUser(userId, {
        totalSavings: newTotalSavings.toString(),
      });

      // Update the claim with bill amount and actual savings
      await storage.updateDealClaim(dealClaim.id, {
        billAmount: billAmount.toString(),
        actualSavings: savingsAmount.toString(),
        status: "used"
      });

      // Log the bill update
      await storage.createSystemLog({
        userId,
        action: "BILL_AMOUNT_UPDATED",
        details: {
          dealId,
          dealTitle: deal.title,
          billAmount,
          actualSavings: savingsAmount,
          newTotalSavings,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: "Bill amount updated successfully!",
        billAmount,
        actualSavings: savingsAmount,
        newTotalSavings
      });

    } catch (error) {
      Logger.error("Bill amount update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update bill amount"
      });
    }
  });

  // User claim history
  app.get('/api/users/claims', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const claims = await storage.getUserClaims(req.user!.id);
      
      // Include deal and vendor info
      const deals = await storage.getActiveDeals();
      const vendors = await storage.getAllVendors();
      const dealMap = new Map(deals.map(d => [d.id, d]));
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      
      const claimsWithDetails = claims.map(claim => {
        const deal = dealMap.get(claim.dealId);
        const vendor = deal ? vendorMap.get(deal.vendorId) : null;
        return {
          ...claim,
          deal,
          vendor,
        };
      });
      
      res.json(claimsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Wishlist routes
  app.post('/api/wishlist', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { dealId } = insertWishlistSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const wishlist = await storage.addToWishlist({
        userId: req.user!.id,
        dealId,
      });
      
      res.status(201).json(wishlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete('/api/wishlist/:dealId', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const removed = await storage.removeFromWishlist(req.user!.id, dealId);
      
      if (!removed) {
        return res.status(404).json({ message: "Item not found in wishlist" });
      }
      
      res.json({ message: "Removed from wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  app.get('/api/wishlist', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const wishlist = await storage.getUserWishlist(req.user!.id);
      
      // Include deal and vendor info
      const deals = await storage.getActiveDeals();
      const vendors = await storage.getAllVendors();
      const dealMap = new Map(deals.map(d => [d.id, d]));
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      
      const wishlistWithDetails = wishlist.map(item => {
        const deal = dealMap.get(item.dealId);
        const vendor = deal ? vendorMap.get(deal.vendorId) : null;
        return {
          ...item,
          deal,
          vendor,
        };
      });
      
      res.json(wishlistWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.get('/api/wishlist/check/:dealId', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const isInWishlist = await storage.isInWishlist(req.user!.id, dealId);
      res.json({ isInWishlist });
    } catch (error) {
      res.status(500).json({ message: "Failed to check wishlist status" });
    }
  });

  // Vendor routes
  app.post('/api/vendors/register', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const vendorData = insertVendorSchema.parse({
        ...req.body,
        userId: req.user!.id,
        isApproved: false, // Requires admin approval
      });
      
      // Check if user already has a vendor profile
      const existingVendor = await storage.getVendorByUserId(req.user!.id);
      if (existingVendor) {
        return res.status(400).json({ message: "Vendor profile already exists" });
      }
      
      const vendor = await storage.createVendor(vendorData);
      
      // Log vendor registration
      await storage.createSystemLog({
        userId: req.user!.id,
        action: "VENDOR_REGISTRATION",
        details: { 
          vendorId: vendor.id,
          businessName: vendor.businessName, 
          city: vendor.city,
          status: 'pending_approval'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Send business registration email
      try {
        const user = await storage.getUser(req.user!.id);
        if (user) {
          const emailData = getVendorRegistrationEmail(
            vendor.businessName,
            user.name,
            user.email
          );
          await sendEmail(emailData);
          Logger.info('Vendor registration email sent successfully', { 
            vendorId: vendor.id, 
            businessName: vendor.businessName,
            email: user.email 
          });
        }
      } catch (emailError) {
        Logger.error('Failed to send vendor registration email', { 
          vendorId: vendor.id, 
          businessName: vendor.businessName,
          error: emailError 
        });
        // Don't fail the registration if email fails
      }
      
      res.status(201).json({
        ...vendor,
        status: 'pending_approval',
        message: "Vendor registration successful. Awaiting admin approval."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register vendor" });
    }
  });

  app.get('/api/vendors/me', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor profile" });
    }
  });

  // Vendor profile update endpoint
  app.put('/api/vendors/profile', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const profileData = updateVendorProfileSchema.parse(req.body);
      const userId = req.user!.id;
      
      // Get vendor by user ID to find vendor ID
      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      const updatedVendor = await storage.updateVendor(vendor.id, profileData);
      if (!updatedVendor) {
        return res.status(404).json({ message: "Failed to update vendor profile" });
      }
      
      // Log profile update
      await storage.createSystemLog({
        userId,
        action: "VENDOR_PROFILE_UPDATED",
        details: { 
          vendorId: vendor.id,
          businessName: vendor.businessName,
          updatedFields: Object.keys(profileData) 
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(updatedVendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vendor profile" });
    }
  });

  app.get('/api/vendors/deals', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      const deals = await storage.getDealsByVendor(vendor.id);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor deals" });
    }
  });

  // Generate secure PIN for vendor
  app.post('/api/vendors/generate-pin', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const { generateSecurePin } = await import('./pin-security');
      const pin = generateSecurePin();
      
      res.json({
        pin,
        message: "Secure PIN generated successfully. Store this PIN safely - it cannot be retrieved later.",
        securityNote: "This PIN will be securely hashed when you create your deal."
      });
    } catch (error) {
      Logger.error("PIN generation error:", error);
      res.status(500).json({ message: "Failed to generate PIN" });
    }
  });

  // Get current rotating PIN for a specific deal
  app.get('/api/vendors/deals/:id/current-pin', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      // Prevent caching for rotating PIN endpoint
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const dealId = parseInt(req.params.id);
      const vendor = await storage.getVendorByUserId(req.user!.id);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      // Verify the deal belongs to this vendor
      const deal = await storage.getDeal(dealId);
      if (!deal || deal.vendorId !== vendor.id) {
        return res.status(404).json({ message: "Deal not found" });
      }

      const { generateRotatingPin } = await import('./pin-security');
      const rotatingPin = generateRotatingPin(dealId);
      
      const response = {
        dealId,
        dealTitle: deal.title,
        currentPin: rotatingPin.currentPin,
        nextRotationAt: rotatingPin.nextRotationAt,
        rotationInterval: rotatingPin.rotationInterval,
        isActive: rotatingPin.isActive,
        message: "Current PIN for your deal. This PIN changes every 30 minutes.",
        usage: "Share this PIN with customers for deal verification."
      };

      res.json(response);
    } catch (error) {
      Logger.error("Current PIN retrieval error:", error);
      res.status(500).json({ message: "Failed to retrieve current PIN" });
    }
  });

  app.post('/api/vendors/deals', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      if (!vendor.isApproved) {
        return res.status(403).json({ message: "Vendor not approved yet" });
      }
      
      // Import PIN security utilities
      const { generateSecurePin, hashPin } = await import('./pin-security');
      
      // Generate secure PIN if not provided or if provided PIN is not secure
      let finalPin = req.body.verificationPin;
      let pinSalt = null;
      let pinExpiresAt = null;
      
      if (!finalPin) {
        // Generate a secure PIN automatically
        finalPin = generateSecurePin();
      }
      
      // Hash the PIN for secure storage
      const pinResult = await hashPin(finalPin);
      if (!pinResult.success) {
        return res.status(400).json({ 
          message: "Failed to secure PIN", 
          error: pinResult.message 
        });
      }
      
      // Transform data to match schema expectations
      const transformedData = {
        ...req.body,
        vendorId: vendor.id,
        verificationPin: pinResult.hashedPin,
        pinSalt: pinResult.salt,
        pinExpiresAt: pinResult.expiresAt,
        // Convert ISO string to Date object for timestamp field
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
        // Ensure latitude and longitude are strings if provided
        latitude: req.body.latitude ? String(req.body.latitude) : undefined,
        longitude: req.body.longitude ? String(req.body.longitude) : undefined,
      };
      
      const dealData = insertDealSchema.parse(transformedData);
      
      const deal = await storage.createDeal(dealData);
      
      // Return the deal with the plain text PIN for vendor reference (one-time only)
      res.status(201).json({
        ...deal,
        plainTextPin: finalPin, // Only shown once during creation
        securityNote: "Store this PIN securely. It will be hashed and cannot be retrieved later."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      Logger.error("Deal creation error:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put('/api/vendors/deals/:id', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      const existingDeal = await storage.getDeal(dealId);
      if (!existingDeal || existingDeal.vendorId !== vendor.id) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Transform data to match schema expectations
      const transformedData = {
        ...req.body,
        // Convert ISO string to Date object for timestamp field
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
        // Ensure latitude and longitude are strings if provided
        latitude: req.body.latitude ? String(req.body.latitude) : undefined,
        longitude: req.body.longitude ? String(req.body.longitude) : undefined,
      };
      
      const updates = insertDealSchema.partial().parse(transformedData);
      // When vendor edits a deal, it needs admin approval again
      const updatedDeal = await storage.updateDeal(dealId, {
        ...updates,
        isApproved: false, // Reset approval status
        approvedBy: null   // Clear previous approver
      });
      
      // Log the edit for admin review
      if (updatedDeal) {
        await storage.createSystemLog({
          userId: req.user!.id,
          action: "DEAL_EDITED",
          details: { 
            dealId, 
            title: updatedDeal.title,
            changes: updates,
            requiresApproval: true
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      
      res.json(updatedDeal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // Vendors can no longer delete deals directly - must request admin approval
  app.post('/api/vendors/deals/:id/request-delete', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      const existingDeal = await storage.getDeal(dealId);
      if (!existingDeal || existingDeal.vendorId !== vendor.id) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Log deletion request for admin review
      await storage.createSystemLog({
        userId: req.user!.id,
        action: "DEAL_DELETE_REQUESTED",
        details: { 
          dealId, 
          title: existingDeal.title,
          reason: req.body.reason || 'No reason provided',
          requiresApproval: true
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({ 
        message: "Delete request submitted",
        description: "Your request to delete this deal has been sent to administrators for approval."
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit delete request" });
    }
  });

  // Admin routes
  app.get('/api/admin/analytics', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/users', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User self-upgrade membership endpoint
  app.post('/api/users/upgrade-membership', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { membershipPlan } = req.body;
      
      if (!['basic', 'premium', 'ultimate'].includes(membershipPlan)) {
        return res.status(400).json({ message: "Invalid membership plan" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        membershipPlan,
        membershipExpiry: membershipPlan !== 'basic' ? new Date('2025-12-31') : null,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log the upgrade
      await storage.createSystemLog({
        userId,
        action: "MEMBERSHIP_UPGRADED",
        details: { 
          newPlan: membershipPlan,
          upgradeDate: new Date().toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      // Don't send password
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error upgrading membership:", error);
      res.status(500).json({ message: "Failed to upgrade membership" });
    }
  });

  app.put('/api/admin/users/:id/upgrade', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { membershipPlan } = req.body;
      
      if (!['basic', 'premium', 'ultimate'].includes(membershipPlan)) {
        return res.status(400).json({ message: "Invalid membership plan" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        membershipPlan,
        membershipExpiry: membershipPlan !== 'basic' ? new Date('2025-12-31') : null,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to upgrade user" });
    }
  });

  app.get('/api/admin/vendors', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get('/api/admin/vendors/pending', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendors = await storage.getPendingVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending vendors" });
    }
  });

  app.post('/api/admin/vendors/:id/approve', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const vendor = await storage.approveVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Log approval
      await storage.createSystemLog({
        userId: req.user!.id,
        action: "VENDOR_APPROVED",
        details: { vendorId, businessName: vendor.businessName },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve vendor" });
    }
  });

  app.get('/api/admin/deals/pending', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const deals = await storage.getPendingDeals();
      
      // Include vendor info
      const vendors = await storage.getAllVendors();
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      
      const dealsWithVendors = deals.map(deal => ({
        ...deal,
        vendor: vendorMap.get(deal.vendorId),
      }));
      
      res.json(dealsWithVendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending deals" });
    }
  });

  app.post('/api/admin/deals/:id/approve', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.approveDeal(dealId, req.user!.id);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Log approval
      await storage.createSystemLog({
        userId: req.user!.id,
        action: "DEAL_APPROVED",
        details: { dealId, title: deal.title },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(deal);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve deal" });
    }
  });

  // Admin deal update endpoint
  app.put('/api/admin/deals/:id', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      
      // Transform data to match schema expectations
      const transformedData = {
        ...req.body,
        // Convert ISO string to Date object for timestamp field
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
        // Ensure latitude and longitude are strings if provided
        latitude: req.body.latitude ? String(req.body.latitude) : undefined,
        longitude: req.body.longitude ? String(req.body.longitude) : undefined,
      };
      
      const updates = insertDealSchema.partial().parse(transformedData);
      
      const deal = await storage.updateDeal(dealId, updates);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Log the admin update
      await storage.createSystemLog({
        userId: req.user!.id,
        action: "DEAL_UPDATED_BY_ADMIN",
        details: { 
          dealId, 
          title: deal.title,
          changes: updates,
          adminAction: true
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // Help ticket routes
  app.post('/api/help-tickets', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketData = insertHelpTicketSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const ticket = await storage.createHelpTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create help ticket" });
    }
  });

  app.get('/api/help-tickets', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let tickets;
      if (req.user!.role === 'admin' || req.user!.role === 'superadmin') {
        tickets = await storage.getHelpTickets();
      } else {
        tickets = await storage.getUserHelpTickets(req.user!.id);
      }
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch help tickets" });
    }
  });



  // Super admin routes
  app.get('/api/superadmin/logs', requireAuth, requireRole(['superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getSystemLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  // Get nearby deals based on location
  // Get individual deal by ID
  // Deal recommendations endpoint
  app.post('/api/deals/recommendations', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const preferences = req.body;
      
      // Get all active deals
      const allDeals = await storage.getActiveDeals();
      let recommendedDeals = [];
      
      // Filter deals based on preferences
      for (const deal of allDeals) {
        const vendor = await storage.getVendor(deal.vendorId);
        if (!vendor) continue;
        
        // Check category match
        if (preferences.categories && preferences.categories.length > 0) {
          if (!preferences.categories.includes(deal.category)) continue;
        }
        
        // Check location match
        if (preferences.location && vendor.city !== preferences.location) continue;
        
        // Check price range
        const price = parseFloat(deal.discountedPrice || deal.originalPrice || '0');
        if (price < preferences.priceRange[0] || price > preferences.priceRange[1]) continue;
        
        recommendedDeals.push({
          ...deal,
          vendor: {
            businessName: vendor.businessName,
            city: vendor.city,
            state: vendor.state,
          },
          matchScore: Math.random() * 100 // Simple scoring for now
        });
      }
      
      // Sort by match score and limit results
      recommendedDeals.sort((a, b) => b.matchScore - a.matchScore);
      recommendedDeals = recommendedDeals.slice(0, 20);
      
      // Log recommendation generation
      await storage.createSystemLog({
        userId,
        action: "RECOMMENDATIONS_GENERATED",
        details: {
          preferences,
          resultsCount: recommendedDeals.length
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({
        recommendations: recommendedDeals,
        preferences,
        generated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.get('/api/deals/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Get vendor information
      let dealWithVendor: any = { ...deal };
      if (deal.vendorId) {
        const vendor = await storage.getVendor(deal.vendorId);
        if (vendor) {
          dealWithVendor.vendor = vendor;
        }
      }
      
      res.json(dealWithVendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  // Get nearby deals based on user location with geolocation
  app.post('/api/deals/nearby', async (req: AuthenticatedRequest, res) => {
    try {
      const { latitude, longitude, maxDistance = 10, categories = [], limit = 12 } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          error: 'Latitude and longitude are required' 
        });
      }
      
      // Get all active deals with their vendor information
      const allDeals = await storage.getActiveDeals();
      const vendors = await storage.getAllVendors();
      
      // Create vendor lookup map
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      
      // Calculate distance for each deal and filter by location
      const nearbyDeals = [];
      
      for (const deal of allDeals) {
        const vendor = vendorMap.get(deal.vendorId);
        if (!vendor) continue;
        
        // Skip if deal doesn't have location data
        if (!deal.latitude || !deal.longitude) continue;
        
        // Calculate distance using Haversine formula
        const dealLat = parseFloat(deal.latitude);
        const dealLng = parseFloat(deal.longitude);
        const distance = calculateDistance(latitude, longitude, dealLat, dealLng);
        
        // Skip if outside max distance
        if (distance > maxDistance) continue;
        
        // Filter by categories if specified
        if (categories.length > 0 && !categories.includes(deal.category)) continue;
        
        // Generate location hint based on relative position
        const locationHint = generateLocationHint(latitude, longitude, dealLat, dealLng, vendor.address || '');
        
        // Calculate relevance score based on multiple factors
        const relevanceScore = calculateRelevanceScore(deal, distance, vendor);
        
        nearbyDeals.push({
          ...deal,
          vendor: {
            businessName: vendor.businessName,
            address: vendor.address,
            city: vendor.city,
            state: vendor.state,
          },
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          distanceText: formatDistance(distance),
          locationHint,
          relevanceScore: Math.round(relevanceScore),
        });
      }
      
      // Sort by relevance score (distance + other factors)
      nearbyDeals.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Limit results
      const limitedDeals = nearbyDeals.slice(0, limit);
      
      res.json({
        success: true,
        deals: limitedDeals,
        total: nearbyDeals.length,
        userLocation: { latitude, longitude },
        searchRadius: maxDistance,
      });
      
    } catch (error) {
      console.error('Error fetching nearby deals:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch nearby deals' 
      });
    }
  });

  app.get('/api/deals/nearby/:dealId', async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const currentDeal = await storage.getDeal(dealId);
      
      if (!currentDeal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      // Get all active deals
      const allDeals = await storage.getActiveDeals();
      const vendors = await storage.getAllVendors();
      
      // Create vendor lookup map
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      
      // Filter nearby deals based on category similarity and location
      const nearbyDeals = allDeals
        .filter(deal => deal.id !== dealId) // Exclude current deal
        .filter(deal => {
          // Prioritize same category deals
          if (deal.category === currentDeal.category) return true;
          // Include other deals with probability based on distance simulation
          return Math.random() < 0.4;
        })
        .slice(0, 4) // Limit to 4 nearby deals
        .map(deal => {
          const vendor = vendorMap.get(deal.vendorId);
          return {
            ...deal,
            vendor,
            distance: (Math.random() * 4 + 0.8).toFixed(1), // Distance between 0.8-4.8 km
          };
        })
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)); // Sort by distance

      res.json(nearbyDeals);
    } catch (error) {
      console.error('Error fetching nearby deals:', error);
      res.status(500).json({ error: 'Failed to fetch nearby deals' });
    }
  });

  // Categories endpoint
  app.get('/api/categories', async (req, res) => {
    const categories = [
      { id: 'electronics', name: 'Electronics', icon: 'fas fa-laptop', color: 'primary', dealCount: 150 },
      { id: 'fashion', name: 'Fashion and Clothing', icon: 'fas fa-tshirt', color: 'saffron', dealCount: 220 },
      { id: 'beauty', name: 'Beauty and Fitness', icon: 'fas fa-heart', color: 'secondary', dealCount: 80 },
      { id: 'luxury', name: 'Luxury Goods', icon: 'fas fa-gem', color: 'royal', dealCount: 45 },
      { id: 'horoscope', name: 'Horoscope', icon: 'fas fa-star', color: 'warning', dealCount: 25 },
      { id: 'health', name: 'Health', icon: 'fas fa-plus-circle', color: 'success', dealCount: 90 },
      { id: 'restaurants', name: 'Restaurants', icon: 'fas fa-utensils', color: 'warning', dealCount: 180 },
      { id: 'entertainment', name: 'Entertainment', icon: 'fas fa-music', color: 'primary', dealCount: 120 },
      { id: 'home', name: 'Home and Furniture', icon: 'fas fa-home', color: 'royal', dealCount: 95 },
      { id: 'events', name: 'Events', icon: 'fas fa-calendar', color: 'secondary', dealCount: 70 },
      { id: 'realestate', name: 'Real Estate', icon: 'fas fa-building', color: 'primary', dealCount: 35 },
      { id: 'education', name: 'Education', icon: 'fas fa-graduation-cap', color: 'success', dealCount: 60 },
      { id: 'freelancers', name: 'Freelancers', icon: 'fas fa-user-tie', color: 'saffron', dealCount: 40 },
      { id: 'consultants', name: 'Consultants', icon: 'fas fa-handshake', color: 'royal', dealCount: 30 },
      { id: 'travel', name: 'Travel and Tourism', icon: 'fas fa-plane', color: 'success', dealCount: 110 },
      { id: 'automotive', name: 'Automotive', icon: 'fas fa-car', color: 'primary', dealCount: 55 },
      { id: 'services', name: 'Services', icon: 'fas fa-tools', color: 'secondary', dealCount: 85 },
      { id: 'others', name: 'Others', icon: 'fas fa-ellipsis-h', color: 'warning', dealCount: 40 },
    ];
    res.json(categories);
  });

  // Cities endpoint
  app.get('/api/cities', async (req, res) => {
    const cities = [
      { name: 'Mumbai', state: 'Maharashtra', dealCount: 2845 },
      { name: 'Delhi', state: 'Delhi', dealCount: 2134 },
      { name: 'Bangalore', state: 'Karnataka', dealCount: 1987 },
      { name: 'Chennai', state: 'Tamil Nadu', dealCount: 1543 },
      { name: 'Hyderabad', state: 'Telangana', dealCount: 1234 },
      { name: 'Pune', state: 'Maharashtra', dealCount: 987 },
      { name: 'Kolkata', state: 'West Bengal', dealCount: 876 },
      { name: 'Ahmedabad', state: 'Gujarat', dealCount: 654 },
    ];
    res.json(cities);
  });

  // Admin deal distribution endpoints
  app.get('/api/admin/deal-distribution', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const distribution = await storage.getDealCategoryCounts();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal distribution" });
    }
  });

  app.delete('/api/admin/deals/category/:category', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const success = await storage.deleteDealsByCategory(category);
      if (success) {
        res.json({ message: `All deals in ${category} category deleted successfully` });
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category deals" });
    }
  });

  // Admin report download endpoints
  app.get('/api/admin/reports/users', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = req.query;
      let users = await storage.getAllUsers();
      
      // Apply date filtering if provided
      if (from || to) {
        users = users.filter(user => {
          if (!user.createdAt) return false;
          const userDate = new Date(user.createdAt);
          const fromDate = from ? new Date(from as string) : null;
          const toDate = to ? new Date(to as string) : null;
          
          if (fromDate && userDate < fromDate) return false;
          if (toDate && userDate > toDate) return false;
          return true;
        });
      }
      
      // Convert users data to CSV format
      const csvHeaders = 'ID,Name,Email,Role,Membership Plan,Total Savings,Deals Claimed,Join Date\n';
      const csvData = users.map(user => 
        `${user.id},"${user.name || 'N/A'}","${user.email}","${user.role}","${user.membershipPlan || 'basic'}","₹${user.totalSavings || 0}","${user.dealsClaimed || 0}","${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}"`
      ).join('\n');

      const dateRange = (from || to) ? ` (${from || 'start'} to ${to || 'end'})` : '';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users-report${dateRange}.csv"`);
      res.send(csvHeaders + csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate users report" });
    }
  });

  app.get('/api/admin/reports/vendors', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = req.query;
      let vendors = await storage.getAllVendors();
      
      // Apply date filtering if provided
      if (from || to) {
        vendors = vendors.filter(vendor => {
          if (!vendor.createdAt) return false;
          const vendorDate = new Date(vendor.createdAt);
          const fromDate = from ? new Date(from as string) : null;
          const toDate = to ? new Date(to as string) : null;
          
          if (fromDate && vendorDate < fromDate) return false;
          if (toDate && vendorDate > toDate) return false;
          return true;
        });
      }
      
      // Convert vendors data to CSV format
      const csvHeaders = 'ID,Business Name,Contact Name,Email,Status,City,State,Deals Created,Registration Date\n';
      const csvData = vendors.map(vendor => 
        `${vendor.id},"${vendor.businessName || 'N/A'}","N/A","N/A","${vendor.isApproved ? 'Approved' : 'Pending'}","${vendor.city || 'N/A'}","${vendor.state || 'N/A'}","${vendor.totalDeals || 0}","${vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}"`
      ).join('\n');

      const dateRange = (from || to) ? ` (${from || 'start'} to ${to || 'end'})` : '';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="vendors-report${dateRange}.csv"`);
      res.send(csvHeaders + csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate vendors report" });
    }
  });

  app.get('/api/admin/reports/deals', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = req.query;
      let deals = await storage.getAllDeals();
      
      // Apply date filtering if provided
      if (from || to) {
        deals = deals.filter((deal: any) => {
          if (!deal.createdAt) return false;
          const dealDate = new Date(deal.createdAt);
          const fromDate = from ? new Date(from as string) : null;
          const toDate = to ? new Date(to as string) : null;
          
          if (fromDate && dealDate < fromDate) return false;
          if (toDate && dealDate > toDate) return false;
          return true;
        });
      }
      
      // Convert deals data to CSV format
      const csvHeaders = 'ID,Title,Category,Discount %,Vendor,City,Status,Claims,Valid Until,Created Date\n';
      const csvData = deals.map((deal: any) => 
        `${deal.id},"${deal.title}","${deal.category}","${deal.discountPercentage}%","${deal.vendor?.businessName || 'N/A'}","${deal.vendor?.city || 'N/A'}","${deal.isActive ? 'Active' : 'Inactive'}","${deal.currentRedemptions || 0}","${deal.validUntil ? new Date(deal.validUntil).toLocaleDateString() : 'N/A'}","${deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : 'N/A'}"`
      ).join('\n');

      const dateRange = (from || to) ? ` (${from || 'start'} to ${to || 'end'})` : '';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="deals-report${dateRange}.csv"`);
      res.send(csvHeaders + csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate deals report" });
    }
  });

  app.get('/api/admin/reports/analytics', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const analytics = await storage.getAdminAnalytics();
      
      // Convert analytics data to CSV format
      const csvHeaders = 'Metric,Value,Description\n';
      const csvData = [
        `"Total Users","${analytics.totalUsers}","Total registered users"`,
        `"Total Vendors","${analytics.totalVendors}","Total registered vendors"`,
        `"Active Deals","${analytics.activeDeals}","Currently active deals"`,
        `"Total Claims","${analytics.totalClaims}","Total deal claims"`,
        `"Total Savings","₹${analytics.totalSavings}","Total savings generated"`,
        `"Pending Vendors","${analytics.pendingVendors}","Vendors awaiting approval"`,
        `"Pending Deals","${analytics.pendingDeals}","Deals awaiting approval"`,
        `"Monthly Revenue","₹${analytics.monthlyRevenue || 0}","Current month revenue"`,
        `"Growth Rate","${analytics.growthRate || 0}%","Month-over-month growth"`
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
      res.send(csvHeaders + csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate analytics report" });
    }
  });

  app.get('/api/admin/reports/claims', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = req.query;
      let claims = await storage.getAllDealClaims();
      
      // Apply date filtering if provided
      if (from || to) {
        claims = claims.filter((claim: any) => {
          if (!claim.claimedAt) return false;
          const claimDate = new Date(claim.claimedAt);
          const fromDate = from ? new Date(from as string) : null;
          const toDate = to ? new Date(to as string) : null;
          
          if (fromDate && claimDate < fromDate) return false;
          if (toDate && claimDate > toDate) return false;
          return true;
        });
      }
      
      // Convert claims data to CSV format
      const csvHeaders = 'ID,User Email,Membership ID,Deal Title,Vendor,Savings Amount,Status,Claim Date,Verification Date\n';
      const csvData = claims.map((claim: any) => 
        `${claim.id},"${claim.user?.email || 'N/A'}","${claim.user?.membershipId || 'N/A'}","${claim.deal?.title || 'N/A'}","${claim.deal?.vendor?.businessName || 'N/A'}","₹${claim.savingsAmount || 0}","${claim.status}","${claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : 'N/A'}","${claim.usedAt ? new Date(claim.usedAt).toLocaleDateString() : 'N/A'}"`
      ).join('\n');

      const dateRange = (from || to) ? ` (${from || 'start'} to ${to || 'end'})` : '';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="claims-report${dateRange}.csv"`);
      res.send(csvHeaders + csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate claims report" });
    }
  });

  app.get('/api/admin/reports/revenue', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = req.query;
      let claims = await storage.getAllDealClaims();
      const vendors = await storage.getAllVendors();
      const deals = await storage.getAllDeals();
      
      // Apply date filtering to claims if provided
      if (from || to) {
        claims = claims.filter((claim: any) => {
          if (!claim.usedAt) return false;
          const claimDate = new Date(claim.usedAt);
          const fromDate = from ? new Date(from as string) : null;
          const toDate = to ? new Date(to as string) : null;
          
          if (fromDate && claimDate < fromDate) return false;
          if (toDate && claimDate > toDate) return false;
          return true;
        });
      }
      
      // Calculate revenue metrics by vendor and time period
      const revenueData = vendors.map((vendor: any) => {
        const vendorClaims = claims.filter((claim: any) => 
          claim.deal?.vendor?.id === vendor.id && claim.status === 'used'
        );
        
        const totalSavings = vendorClaims.reduce((sum: number, claim: any) => 
          sum + (claim.savingsAmount || 0), 0
        );
        
        const totalTransactions = vendorClaims.length;
        const activeDeals = deals.filter((deal: any) => 
          deal.vendor?.id === vendor.id && deal.isActive
        ).length;
        
        // Estimate platform revenue (5% commission on savings)
        const estimatedRevenue = totalSavings * 0.05;
        
        return {
          vendorId: vendor.id,
          businessName: vendor.businessName || 'N/A',
          city: vendor.city || 'N/A',
          totalTransactions,
          totalSavings,
          estimatedRevenue: Math.round(estimatedRevenue),
          activeDeals,
          registrationDate: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'
        };
      });
      
      // Add summary row
      const totalSavings = revenueData.reduce((sum, vendor) => sum + vendor.totalSavings, 0);
      const totalRevenue = revenueData.reduce((sum, vendor) => sum + vendor.estimatedRevenue, 0);
      const totalTransactions = revenueData.reduce((sum, vendor) => sum + vendor.totalTransactions, 0);
      
      // Convert revenue data to CSV format
      const csvHeaders = 'Vendor ID,Business Name,City,Total Transactions,Total Savings (₹),Estimated Platform Revenue (₹),Active Deals,Registration Date\n';
      const csvData = revenueData.map(vendor => 
        `${vendor.vendorId},"${vendor.businessName}","${vendor.city}","${vendor.totalTransactions}","₹${vendor.totalSavings}","₹${vendor.estimatedRevenue}","${vendor.activeDeals}","${vendor.registrationDate}"`
      ).join('\n');
      
      // Add summary row
      const summaryRow = `\n"TOTAL","Platform Summary","All Cities","${totalTransactions}","₹${totalSavings}","₹${totalRevenue}","${deals.length}","Platform Revenue Summary"`;

      const dateRange = (from || to) ? ` (${from || 'start'} to ${to || 'end'})` : '';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="revenue-report${dateRange}.csv"`);
      res.send(csvHeaders + csvData + summaryRow);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate revenue report" });
    }
  });

  app.post('/api/admin/deals/reset', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.resetAllDeals();
      if (success) {
        res.json({ message: "All deals reset successfully" });
      } else {
        res.status(500).json({ message: "Failed to reset deals" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to reset deals" });
    }
  });

  // Most claimed deals endpoint
  app.get('/api/deals/most-claimed', async (req: AuthenticatedRequest, res) => {
    try {
      const deals = await storage.getMostClaimedDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch most claimed deals" });
    }
  });

  // External API proxy endpoints
  app.get('/api/external/deals', async (req: AuthenticatedRequest, res) => {
    try {
      const response = await fetch('https://api.instoredealz.com/S0G1IP/Deals/AllDeals');
      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching external deals:', error);
      res.status(500).json({ error: 'Failed to fetch external deals' });
    }
  });

  app.get('/api/external/categories', async (req: AuthenticatedRequest, res) => {
    try {
      const response = await fetch('https://api.instoredealz.com/S0G1IP/Category/AllCategories');
      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching external categories:', error);
      res.status(500).json({ error: 'Failed to fetch external categories' });
    }
  });

  app.get('/api/external/store-deals/:storeId/:dealId/:pinId', async (req: AuthenticatedRequest, res) => {
    try {
      const { storeId, dealId, pinId } = req.params;
      const response = await fetch(`https://api.instoredealz.com/S0G1IP/FrontHome/GetStoredDealById/${storeId}/${dealId}/${pinId}`);
      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching external store deal:', error);
      res.status(500).json({ error: 'Failed to fetch external store deal' });
    }
  });

  app.get('/api/external/blogs', async (req: AuthenticatedRequest, res) => {
    try {
      const response = await fetch('https://api.instoredealz.com/S0G1IP/Blogs/GetAllBlogs');
      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching external blogs:', error);
      res.status(500).json({ error: 'Failed to fetch external blogs' });
    }
  });

  // POS endpoints
  // Start a new POS session
  app.post('/api/pos/sessions', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const { terminalId } = req.body;
      
      if (!terminalId) {
        return res.status(400).json({ 
          success: false, 
          error: "Terminal ID is required" 
        });
      }

      // Get vendor info
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ 
          success: false, 
          error: "Vendor not found" 
        });
      }

      // Check for existing active session
      const existingSession = await storage.getActivePosSession(vendor.id, terminalId);
      if (existingSession) {
        return res.json({ 
          success: true, 
          data: existingSession 
        });
      }

      // Generate unique session token
      const sessionToken = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      const session = await storage.createPosSession({
        vendorId: vendor.id,
        terminalId,
        sessionToken,
        isActive: true,
      });

      res.json({ success: true, data: session });
    } catch (error) {
      Logger.error('Error starting POS session', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to start POS session' 
      });
    }
  });

  // End POS session
  app.post('/api/pos/sessions/:sessionId/end', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.endPosSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: "Session not found" 
        });
      }

      res.json({ success: true, data: session });
    } catch (error) {
      Logger.error('Error ending POS session', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to end POS session' 
      });
    }
  });

  // Get vendor's POS sessions
  app.get('/api/pos/sessions', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ 
          success: false, 
          error: "Vendor not found" 
        });
      }

      const sessions = await storage.getPosSessionsByVendor(vendor.id);
      res.json({ success: true, data: sessions });
    } catch (error) {
      Logger.error('Error fetching POS sessions', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch POS sessions' 
      });
    }
  });

  // Process POS transaction (deal claim/redemption)
  app.post('/api/pos/transactions', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId, dealId, customerId, amount, savingsAmount, transactionType, paymentMethod, pin } = req.body;

      // Validate required fields
      if (!sessionId || !dealId || !amount || !savingsAmount || !transactionType) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields" 
        });
      }

      // Verify deal exists and is active
      const deal = await storage.getDeal(dealId);
      if (!deal || !deal.isActive || !deal.isApproved) {
        return res.status(404).json({ 
          success: false, 
          error: "Deal not found or inactive" 
        });
      }

      // Verify PIN if provided
      let pinVerified = false;
      if (pin && deal.verificationPin === pin) {
        pinVerified = true;
      }

      // Generate receipt number
      const receiptNumber = `POS${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const transaction = await storage.createPosTransaction({
        sessionId,
        dealId,
        customerId: customerId || null,
        transactionType,
        amount,
        savingsAmount,
        pinVerified,
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        receiptNumber,
        notes: req.body.notes || null,
      });

      // Update deal redemption count
      await storage.incrementDealRedemptions(dealId);

      // Create deal claim record if customer is provided
      if (customerId && transactionType === 'redeem') {
        await storage.claimDeal({
          userId: customerId,
          dealId,
          savingsAmount,
          status: 'used',
          usedAt: new Date(),
        });
      }

      res.json({ success: true, data: transaction });
    } catch (error) {
      Logger.error('Error processing POS transaction', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process transaction' 
      });
    }
  });

  // Get transactions for a session
  app.get('/api/pos/sessions/:sessionId/transactions', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const transactions = await storage.getPosTransactionsBySession(sessionId);
      res.json({ success: true, data: transactions });
    } catch (error) {
      Logger.error('Error fetching session transactions', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch transactions' 
      });
    }
  });

  // Get all vendor transactions
  app.get('/api/pos/transactions', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ 
          success: false, 
          error: "Vendor not found" 
        });
      }

      const transactions = await storage.getPosTransactionsByVendor(vendor.id);
      res.json({ success: true, data: transactions });
    } catch (error) {
      Logger.error('Error fetching vendor transactions', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch transactions' 
      });
    }
  });

  // Get deals available for POS (vendor's deals)
  app.get('/api/pos/deals', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(404).json({ 
          success: false, 
          error: "Vendor not found" 
        });
      }

      const deals = await storage.getDealsByVendor(vendor.id);
      const activeDeals = deals.filter(deal => deal.isActive && deal.isApproved);
      
      res.json({ success: true, data: activeDeals });
    } catch (error) {
      Logger.error('Error fetching POS deals', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch deals' 
      });
    }
  });

  // Verify deal PIN (for offline verification)
  app.post('/api/pos/verify-pin', async (req: AuthenticatedRequest, res) => {
    try {
      const { dealId, pin } = req.body;

      if (!dealId || !pin) {
        return res.status(400).json({ 
          success: false, 
          error: "Deal ID and PIN are required" 
        });
      }

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ 
          success: false, 
          error: "Deal not found" 
        });
      }

      const isValid = deal.verificationPin === pin.toString();
      
      res.json({ 
        success: true, 
        data: { 
          valid: isValid,
          dealTitle: isValid ? deal.title : null,
          dealId: dealId
        } 
      });
    } catch (error) {
      Logger.error('Error verifying PIN', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to verify PIN' 
      });
    }
  });

  // Subscription endpoint
  app.post('/api/save-subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { planId, paymentId, amount, userId } = req.body;
      
      // Validate request data
      if (!planId || !paymentId || !amount || !userId) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields: planId, paymentId, amount, userId" 
        });
      }

      // Verify the user matches the authenticated user
      if (req.user!.id !== userId) {
        return res.status(403).json({ 
          success: false,
          message: "User ID mismatch" 
        });
      }

      // Get user to update their membership
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Update user's membership plan
      const membershipPlan = planId === 'ultimate' ? 'ultimate' : 'premium';
      const membershipExpiry = new Date();
      membershipExpiry.setMonth(membershipExpiry.getMonth() + 1); // 1 month from now

      const updatedUser = await storage.updateUser(userId, {
        membershipPlan,
        membershipExpiry,
      });

      if (!updatedUser) {
        return res.status(500).json({ 
          success: false,
          message: "Failed to update user membership" 
        });
      }

      // Log the subscription activity
      await storage.createSystemLog({
        userId: userId,
        action: "SUBSCRIPTION_ACTIVATED",
        details: { 
          planId,
          paymentId,
          amount,
          membershipPlan,
          membershipExpiry: membershipExpiry.toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Generate subscription ID
      const subscriptionId = `sub_${Date.now()}_${userId}`;

      res.json({
        success: true,
        subscriptionId,
        paymentId,
        message: `${membershipPlan.charAt(0).toUpperCase() + membershipPlan.slice(1)} subscription activated successfully`,
        membershipPlan,
        expiryDate: membershipExpiry.toISOString()
      });

    } catch (error) {
      console.error("Error saving subscription:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process subscription" 
      });
    }
  });

  // Vendor registration endpoint
  app.post('/api/register-vendor', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        businessName,
        ownerName,
        email,
        phone,
        businessType,
        address,
        city,
        state,
        pincode,
        website,
        description,
        gstNumber,
        panNumber
      } = req.body;

      // Validate required fields
      if (!businessName || !ownerName || !email || !phone || !businessType || !address || !city || !state || !pincode || !description) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided"
        });
      }

      // Check if vendor already exists for this user
      const existingVendor = await storage.getVendorByUserId(req.user!.id);
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: "You have already registered as a vendor"
        });
      }

      // Create vendor
      const vendor = await storage.createVendor({
        userId: req.user!.id,
        businessName,
        address,
        city,
        state,
        description,
        gstNumber: gstNumber || null,
        panNumber: panNumber || businessName, // Use business name if no PAN provided
        isApproved: false, // Requires admin approval
      });

      // Log the registration
      await storage.createSystemLog({
        userId: req.user!.id,
        action: "VENDOR_REGISTRATION",
        details: {
          vendorId: vendor.id,
          businessName,
          businessType,
          city,
          state
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        id: vendor.id,
        businessName: vendor.businessName,
        status: 'pending_approval',
        message: "Vendor registration successful. Awaiting admin approval."
      });

    } catch (error) {
      console.error("Error registering vendor:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register vendor"
      });
    }
  });

  // Deal creation endpoint
  app.post('/api/create-deal', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        title,
        description,
        category,
        originalPrice,
        discountedPrice,
        discountPercentage,
        validUntil,
        maxRedemptions,
        requiredMembership
      } = req.body;

      // Validate required fields
      if (!title || !description || !category || !originalPrice || !discountedPrice || !validUntil || !requiredMembership) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided"
        });
      }

      // Check if user is a vendor
      const vendor = await storage.getVendorByUserId(req.user!.id);
      if (!vendor) {
        return res.status(403).json({
          success: false,
          message: "You must be a registered vendor to create deals"
        });
      }

      if (!vendor.isApproved) {
        return res.status(403).json({
          success: false,
          message: "Your vendor account is pending approval"
        });
      }

      // Validate pricing
      const original = parseFloat(originalPrice);
      const discounted = parseFloat(discountedPrice);
      
      if (discounted >= original) {
        return res.status(400).json({
          success: false,
          message: "Discounted price must be less than original price"
        });
      }

      // Validate date
      const validUntilDate = new Date(validUntil);
      if (validUntilDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Valid until date must be in the future"
        });
      }

      // Generate 4-digit PIN for offline verification
      const verificationPin = Math.floor(1000 + Math.random() * 9000).toString();

      // Create deal
      const deal = await storage.createDeal({
        vendorId: vendor.id,
        title,
        description,
        category,
        originalPrice: originalPrice.toString(),
        discountedPrice: discountedPrice.toString(),
        discountPercentage: parseInt(discountPercentage.toString()),
        validUntil: validUntilDate,
        maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        verificationPin,
        requiredMembership,
        isActive: true,
        isApproved: false, // Requires admin approval
        address: vendor.address || "TBD",
      });

      // Log the deal creation
      await storage.createSystemLog({
        userId: req.user!.id,
        action: "DEAL_CREATED",
        details: {
          dealId: deal.id,
          vendorId: vendor.id,
          title,
          category,
          originalPrice,
          discountedPrice,
          discountPercentage
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        id: deal.id,
        title: deal.title,
        status: 'pending_approval',
        message: "Deal created successfully. Awaiting admin approval."
      });

    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create deal"
      });
    }
  });

  // ===============================
  // MAGIC API ENDPOINTS - External Integration
  // ===============================

  // Admin Login Management
  app.get('/api/magic/admin-login', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching admin login data', { userId: req.user!.id });
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/AdminLogin'),
        'GET AdminLogin'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch admin login data');
      }
    } catch (error) {
      Logger.error('Admin login fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch admin login data' });
    }
  });

  app.post('/api/magic/admin-login', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating admin login', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/AdminLogin/PostAdminLogin', req.body),
        'POST AdminLogin'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create admin login');
      }
    } catch (error) {
      Logger.error('Admin login creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create admin login' });
    }
  });

  app.get('/api/magic/admin-login/:id', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching admin login by ID', { userId: req.user!.id, adminLoginId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/AdminLogin/GetAdminLoginByid/${id}`),
        'GET AdminLoginById'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Admin login not found');
      }
    } catch (error) {
      Logger.error('Admin login fetch by ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch admin login' });
    }
  });

  app.put('/api/magic/admin-login/:id', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Updating admin login', { userId: req.user!.id, adminLoginId: id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.put(`/S0G1IP/AdminLogin/UpdateAdminLoginByid/${id}`, req.body),
        'PUT AdminLogin'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to update admin login');
      }
    } catch (error) {
      Logger.error('Admin login update failed', error);
      res.status(500).json({ success: false, message: 'Failed to update admin login' });
    }
  });

  app.put('/api/magic/admin-login/:id/password', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Updating admin password', { userId: req.user!.id, adminLoginId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.put(`/S0G1IP/AdminLogin/UpdateAdminLoginPassword/${id}`, req.body),
        'PUT AdminPassword'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to update admin password');
      }
    } catch (error) {
      Logger.error('Admin password update failed', error);
      res.status(500).json({ success: false, message: 'Failed to update admin password' });
    }
  });

  // API Generation Management
  app.get('/api/magic/api-generation', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all API generation data', { userId: req.user!.id });
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/APIGeneration/GetAllAPI'),
        'GET AllAPI'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch API generation data');
      }
    } catch (error) {
      Logger.error('API generation fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch API generation data' });
    }
  });

  app.get('/api/magic/api-generation/:id', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching API generation by ID', { userId: req.user!.id, apiGenId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/APIGeneration/GeAPIGenById/${id}`),
        'GET APIGenById'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'API generation not found');
      }
    } catch (error) {
      Logger.error('API generation fetch by ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch API generation' });
    }
  });

  app.post('/api/magic/api-generation', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating API generation', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/APIGeneration/SaveAPIGen', req.body),
        'POST SaveAPIGen'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create API generation');
      }
    } catch (error) {
      Logger.error('API generation creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create API generation' });
    }
  });

  // Banner Management
  app.get('/api/magic/banners', async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all banners');
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/BannerMaster/AllBannerMaster'),
        'GET AllBanners'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch banners');
      }
    } catch (error) {
      Logger.error('Banner fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch banners' });
    }
  });

  app.get('/api/magic/banners/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching banner by ID', { bannerId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/BannerMaster/BannerMasterById/${id}`),
        'GET BannerById'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Banner not found');
      }
    } catch (error) {
      Logger.error('Banner fetch by ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch banner' });
    }
  });

  app.post('/api/magic/banners', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating banner', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/BannerMaster/SaveBanner', req.body),
        'POST SaveBanner'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create banner');
      }
    } catch (error) {
      Logger.error('Banner creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create banner' });
    }
  });

  // Enhanced Blogs Management
  app.get('/api/magic/blogs', async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all blogs');
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/Blogs/GetAllBlogs'),
        'GET AllBlogs'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch blogs');
      }
    } catch (error) {
      Logger.error('Blog fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch blogs' });
    }
  });

  app.get('/api/magic/blogs/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching blog by ID', { blogId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/Blogs/GetBlogById/${id}`),
        'GET BlogById'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Blog not found');
      }
    } catch (error) {
      Logger.error('Blog fetch by ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch blog' });
    }
  });

  app.post('/api/magic/blogs', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating blog', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/Blogs/SaveBlogAdmin', req.body),
        'POST SaveBlog'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create blog');
      }
    } catch (error) {
      Logger.error('Blog creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create blog' });
    }
  });

  // Enhanced Categories Management
  app.get('/api/magic/categories', async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all categories');
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/Category/AllCategories'),
        'GET AllCategories'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch categories');
      }
    } catch (error) {
      Logger.error('Category fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  });

  app.get('/api/magic/categories/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching category by ID', { categoryId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/Category/CategoryById/${id}`),
        'GET CategoryById'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Category not found');
      }
    } catch (error) {
      Logger.error('Category fetch by ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch category' });
    }
  });

  app.get('/api/magic/categories/company/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching categories by company ID', { companyId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/Category/CategoryByCompanyId/${id}`),
        'GET CategoryByCompanyId'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Categories not found for company');
      }
    } catch (error) {
      Logger.error('Category fetch by company ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch company categories' });
    }
  });

  app.post('/api/magic/categories', requireAuth, requireRole(['admin', 'superadmin', 'vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating category', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/Category/AddCategory', req.body),
        'POST AddCategory'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create category');
      }
    } catch (error) {
      Logger.error('Category creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create category' });
    }
  });

  app.post('/api/magic/categories/update', requireAuth, requireRole(['admin', 'superadmin', 'vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Updating category', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/Category/UpdateCategory', req.body),
        'POST UpdateCategory'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to update category');
      }
    } catch (error) {
      Logger.error('Category update failed', error);
      res.status(500).json({ success: false, message: 'Failed to update category' });
    }
  });

  // Enhanced Cities Management
  app.get('/api/magic/cities', async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all cities');
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/City/AllCities'),
        'GET AllCities'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch cities');
      }
    } catch (error) {
      Logger.error('City fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cities' });
    }
  });

  app.get('/api/magic/cities/layout', async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching cities layout');
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/City/GetAllCitiesLayouy'),
        'GET CitiesLayout'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch cities layout');
      }
    } catch (error) {
      Logger.error('Cities layout fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cities layout' });
    }
  });

  app.get('/api/magic/cities/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching city by ID', { cityId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/City/CityById/${id}`),
        'GET CityById'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'City not found');
      }
    } catch (error) {
      Logger.error('City fetch by ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch city' });
    }
  });

  app.get('/api/magic/cities/state/:stateId', async (req: AuthenticatedRequest, res) => {
    try {
      const { stateId } = req.params;
      Logger.info('Fetching cities by state ID', { stateId });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/City/CitiesByStateId/${stateId}`),
        'GET CitiesByStateId'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Cities not found for state');
      }
    } catch (error) {
      Logger.error('Cities fetch by state ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cities by state' });
    }
  });

  app.post('/api/magic/cities', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating city', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/City/AddCity', req.body),
        'POST AddCity'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create city');
      }
    } catch (error) {
      Logger.error('City creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create city' });
    }
  });

  app.post('/api/magic/cities/update', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Updating city', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/City/UpdateCity', req.body),
        'POST UpdateCity'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to update city');
      }
    } catch (error) {
      Logger.error('City update failed', error);
      res.status(500).json({ success: false, message: 'Failed to update city' });
    }
  });

  // Enhanced Deals Management with External API Integration
  app.get('/api/magic/deals', async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all deals from external API');
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/Deals/AllDeals'),
        'GET AllDeals'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch deals');
      }
    } catch (error) {
      Logger.error('External deals fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch deals' });
    }
  });

  app.get('/api/magic/deals/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching deal by ID from external API', { dealId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/Deals/DealById/${id}`),
        'GET DealById'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Deal not found');
      }
    } catch (error) {
      Logger.error('External deal fetch by ID failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch deal' });
    }
  });

  app.get('/api/magic/deals/:dealId/stores', async (req: AuthenticatedRequest, res) => {
    try {
      const { dealId } = req.params;
      Logger.info('Fetching deal stores', { dealId });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/Deals/DealStores/${dealId}`),
        'GET DealStores'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Deal stores not found');
      }
    } catch (error) {
      Logger.error('Deal stores fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch deal stores' });
    }
  });

  app.get('/api/magic/deals/company/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching deals by company ID', { companyId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/Deals/GetDealByCompanyId/${id}`),
        'GET DealsByCompanyId'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Deals not found for company');
      }
    } catch (error) {
      Logger.error('Company deals fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch company deals' });
    }
  });

  app.post('/api/magic/deals', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating deal via external API', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/Deals/AddDeal', req.body),
        'POST AddDeal'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create deal');
      }
    } catch (error) {
      Logger.error('External deal creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create deal' });
    }
  });

  app.post('/api/magic/deals/vendor', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating vendor deal via external API', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/Deals/AddDealVendor', req.body),
        'POST AddDealVendor'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create vendor deal');
      }
    } catch (error) {
      Logger.error('External vendor deal creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create vendor deal' });
    }
  });

  app.put('/api/magic/deals/:id', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Updating deal via external API', { userId: req.user!.id, dealId: id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post(`/S0G1IP/Deals/UpdateDeal/${id}`, req.body),
        'PUT UpdateDeal'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to update deal');
      }
    } catch (error) {
      Logger.error('External deal update failed', error);
      res.status(500).json({ success: false, message: 'Failed to update deal' });
    }
  });

  app.put('/api/magic/deals/vendor/:id', requireAuth, requireRole(['vendor']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Updating vendor deal via external API', { userId: req.user!.id, dealId: id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post(`/S0G1IP/Deals/UpdateDealVendorr/${id}`, req.body),
        'PUT UpdateDealVendor'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to update vendor deal');
      }
    } catch (error) {
      Logger.error('External vendor deal update failed', error);
      res.status(500).json({ success: false, message: 'Failed to update vendor deal' });
    }
  });

  // Enhanced Claims Management
  app.get('/api/magic/claim-deals/admin', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching admin wise claim deals', { userId: req.user!.id });
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/ClaimDeals/GetAdminWiseClaim'),
        'GET AdminWiseClaim'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch admin wise claims');
      }
    } catch (error) {
      Logger.error('Admin wise claims fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch admin wise claims' });
    }
  });

  app.get('/api/magic/claim-deals/store/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching store wise claims', { storeId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/ClaimDeals/GetStoreWiseClaim/${id}`),
        'GET StoreWiseClaim'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Store claims not found');
      }
    } catch (error) {
      Logger.error('Store wise claims fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch store wise claims' });
    }
  });

  app.get('/api/magic/claim-deals/customer/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      Logger.info('Fetching customer wise claims', { userId: req.user!.id, customerId: id });
      const result = await handleExternalApiCall(
        () => externalAPI.get(`/S0G1IP/ClaimDeals/GetCustomerWiseClaim/${id}`),
        'GET CustomerWiseClaim'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(404, result.error || 'Customer claims not found');
      }
    } catch (error) {
      Logger.error('Customer wise claims fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch customer wise claims' });
    }
  });

  app.post('/api/magic/claim-deals', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Saving deal claim', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/ClaimDeals/SaveDealClaims', req.body),
        'POST SaveDealClaims'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to save deal claim');
      }
    } catch (error) {
      Logger.error('Deal claim save failed', error);
      res.status(500).json({ success: false, message: 'Failed to save deal claim' });
    }
  });

  // Enhanced Companies Management for Vendors
  app.get('/api/magic/companies', async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all companies');
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/Company/AllCompanies'),
        'GET AllCompanies'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch companies');
      }
    } catch (error) {
      Logger.error('Companies fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch companies' });
    }
  });

  app.post('/api/magic/companies/vendor', requireAuth, requireRole(['vendor', 'admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Creating vendor company', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/Company/AddCompanyVendor', req.body),
        'POST AddCompanyVendor'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to create vendor company');
      }
    } catch (error) {
      Logger.error('Vendor company creation failed', error);
      res.status(500).json({ success: false, message: 'Failed to create vendor company' });
    }
  });

  // Enhanced Customer Subscription Management
  app.get('/api/magic/customer-subscription', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all customer subscriptions', { userId: req.user!.id });
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/CustomerSubscription/GetAllCustomerSubscriptions'),
        'GET AllCustomerSubscriptions'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch customer subscriptions');
      }
    } catch (error) {
      Logger.error('Customer subscriptions fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch customer subscriptions' });
    }
  });

  app.post('/api/magic/customer-subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Saving customer subscription', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/CustomerSubscription/SaveCustomerSubscription', req.body),
        'POST SaveCustomerSubscription'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to save customer subscription');
      }
    } catch (error) {
      Logger.error('Customer subscription save failed', error);
      res.status(500).json({ success: false, message: 'Failed to save customer subscription' });
    }
  });

  // Enhanced Vendor Subscription Management
  app.get('/api/magic/vendor-subscription', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Fetching all vendor subscriptions', { userId: req.user!.id });
      const result = await handleExternalApiCall(
        () => externalAPI.get('/S0G1IP/VendorSubscription/GetAllVendorSubscriptions'),
        'GET AllVendorSubscriptions'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(500, result.error || 'Failed to fetch vendor subscriptions');
      }
    } catch (error) {
      Logger.error('Vendor subscriptions fetch failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch vendor subscriptions' });
    }
  });

  app.post('/api/magic/vendor-subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      Logger.info('Saving vendor subscription', { userId: req.user!.id, body: req.body });
      const result = await handleExternalApiCall(
        () => externalAPI.post('/S0G1IP/VendorSubscription/SaveVendorSubscription', req.body),
        'POST SaveVendorSubscription'
      );
      if (result.success) {
        res.json(result.data);
      } else {
        throw new ApiError(400, result.error || 'Failed to save vendor subscription');
      }
    } catch (error) {
      Logger.error('Vendor subscription save failed', error);
      res.status(500).json({ success: false, message: 'Failed to save vendor subscription' });
    }
  });

  // Local subscription endpoint with external API integration
  app.post('/api/vendor-subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { planId, paymentId, amount, userId } = req.body;
      
      // Validate request data
      if (!planId || !paymentId || !amount || !userId) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields: planId, paymentId, amount, userId" 
        });
      }

      // Verify the user matches the authenticated user
      if (req.user!.id !== userId) {
        return res.status(403).json({ 
          success: false,
          message: "User ID mismatch" 
        });
      }

      // Get user to update their vendor subscription
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Generate subscription ID
      const subscriptionId = `vendor_sub_${Date.now()}_${userId}`;
      const membershipExpiry = new Date();
      membershipExpiry.setMonth(membershipExpiry.getMonth() + 1); // 1 month from now

      // Log the vendor subscription activity
      await storage.createSystemLog({
        userId: userId,
        action: "VENDOR_SUBSCRIPTION_ACTIVATED",
        details: { 
          planId,
          paymentId,
          amount,
          subscriptionId,
          membershipExpiry: membershipExpiry.toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        subscriptionId,
        paymentId,
        message: `Vendor ${planId} subscription activated successfully`,
        planType: planId,
        expiryDate: membershipExpiry.toISOString()
      });

    } catch (error) {
      Logger.error("Error saving vendor subscription", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process vendor subscription" 
      });
    }
  });

  // ================================
  // CUSTOM DEAL ALERTS API ROUTES (Ultimate members only)
  // ================================

  // Create a new deal alert
  app.post('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      // Check if user has Ultimate membership
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Custom deal alerts are only available for Ultimate membership holders"
        });
      }

      const alertData = insertCustomDealAlertSchema.parse(req.body);
      const alert = await storage.createCustomDealAlert({
        ...alertData,
        userId: user.id
      });

      res.json({ success: true, data: alert });
    } catch (error) {
      Logger.error('Error creating deal alert', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create deal alert' 
      });
    }
  });

  // Get user's deal alerts
  app.get('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Custom deal alerts are only available for Ultimate membership holders"
        });
      }

      const alerts = await storage.getCustomDealAlertsByUser(user.id);
      res.json({ success: true, data: alerts });
    } catch (error) {
      Logger.error('Error fetching deal alerts', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch deal alerts' 
      });
    }
  });

  // Update a deal alert
  app.put('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const alertId = parseInt(req.params.id);
      
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Custom deal alerts are only available for Ultimate membership holders"
        });
      }

      // Check if alert belongs to user
      const existingAlert = await storage.getCustomDealAlert(alertId);
      if (!existingAlert || existingAlert.userId !== user.id) {
        return res.status(404).json({
          success: false,
          message: "Deal alert not found or access denied"
        });
      }

      const updates = req.body;
      const updatedAlert = await storage.updateCustomDealAlert(alertId, updates);
      
      res.json({ success: true, data: updatedAlert });
    } catch (error) {
      Logger.error('Error updating deal alert', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update deal alert' 
      });
    }
  });

  // Delete a deal alert
  app.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const alertId = parseInt(req.params.id);
      
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Custom deal alerts are only available for Ultimate membership holders"
        });
      }

      // Check if alert belongs to user
      const existingAlert = await storage.getCustomDealAlert(alertId);
      if (!existingAlert || existingAlert.userId !== user.id) {
        return res.status(404).json({
          success: false,
          message: "Deal alert not found or access denied"
        });
      }

      await storage.deleteCustomDealAlert(alertId);
      res.json({ success: true, message: "Deal alert deleted successfully" });
    } catch (error) {
      Logger.error('Error deleting deal alert', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete deal alert' 
      });
    }
  });

  // ================================
  // PERSONAL DEAL CONCIERGE API ROUTES (Ultimate members only)
  // ================================

  // Create a new concierge request
  app.post('/api/concierge', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      // Check if user has Ultimate membership
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Personal deal concierge is only available for Ultimate membership holders"
        });
      }

      const requestData = insertDealConciergeRequestSchema.parse(req.body);
      const request = await storage.createDealConciergeRequest({
        ...requestData,
        userId: user.id
      });

      res.json({ success: true, data: request });
    } catch (error) {
      Logger.error('Error creating concierge request', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create concierge request' 
      });
    }
  });

  // Get user's concierge requests
  app.get('/api/concierge', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Personal deal concierge is only available for Ultimate membership holders"
        });
      }

      const requests = await storage.getDealConciergeRequestsByUser(user.id);
      res.json({ success: true, data: requests });
    } catch (error) {
      Logger.error('Error fetching concierge requests', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch concierge requests' 
      });
    }
  });

  // Update a concierge request (used for adding satisfaction rating, etc.)
  app.put('/api/concierge/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const requestId = parseInt(req.params.id);
      
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Personal deal concierge is only available for Ultimate membership holders"
        });
      }

      // Check if request belongs to user
      const existingRequest = await storage.getDealConciergeRequest(requestId);
      if (!existingRequest || existingRequest.userId !== user.id) {
        return res.status(404).json({
          success: false,
          message: "Concierge request not found or access denied"
        });
      }

      const updates = req.body;
      const updatedRequest = await storage.updateDealConciergeRequest(requestId, updates);
      
      res.json({ success: true, data: updatedRequest });
    } catch (error) {
      Logger.error('Error updating concierge request', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update concierge request' 
      });
    }
  });

  // Admin endpoints for managing concierge requests
  app.get('/api/admin/concierge', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.query;
      let requests;
      
      if (status && typeof status === 'string') {
        requests = await storage.getDealConciergeRequestsByStatus(status);
      } else {
        requests = await storage.getAllDealConciergeRequests();
      }

      res.json({ success: true, data: requests });
    } catch (error) {
      Logger.error('Error fetching admin concierge requests', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch concierge requests' 
      });
    }
  });

  // Assign concierge request to admin
  app.put('/api/admin/concierge/:id/assign', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { assigneeId } = req.body;
      
      if (!assigneeId) {
        return res.status(400).json({
          success: false,
          message: "Assignee ID is required"
        });
      }

      const updatedRequest = await storage.assignDealConciergeRequest(requestId, assigneeId);
      
      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: "Concierge request not found"
        });
      }

      res.json({ success: true, data: updatedRequest });
    } catch (error) {
      Logger.error('Error assigning concierge request', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to assign concierge request' 
      });
    }
  });

  // Update concierge request by admin
  app.put('/api/admin/concierge/:id', requireAuth, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedRequest = await storage.updateDealConciergeRequest(requestId, updates);
      
      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: "Concierge request not found"
        });
      }

      res.json({ success: true, data: updatedRequest });
    } catch (error) {
      Logger.error('Error updating concierge request as admin', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update concierge request' 
      });
    }
  });

  // ================================
  // ALERT NOTIFICATIONS API ROUTES
  // ================================

  // Get user's alert notifications
  app.get('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      if (user.membershipPlan !== 'ultimate') {
        return res.status(403).json({
          success: false,
          message: "Alert notifications are only available for Ultimate membership holders"
        });
      }

      const notifications = await storage.getAlertNotificationsByUser(user.id);
      res.json({ success: true, data: notifications });
    } catch (error) {
      Logger.error('Error fetching alert notifications', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch alert notifications' 
      });
    }
  });

  // Mark notification as opened
  app.put('/api/notifications/:id/opened', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationOpened(notificationId);
      res.json({ success: true, message: "Notification marked as opened" });
    } catch (error) {
      Logger.error('Error marking notification as opened', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to mark notification as opened' 
      });
    }
  });

  // Mark notification as clicked
  app.put('/api/notifications/:id/clicked', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationClicked(notificationId);
      res.json({ success: true, message: "Notification marked as clicked" });
    } catch (error) {
      Logger.error('Error marking notification as clicked', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to mark notification as clicked' 
      });
    }
  });

  // Add the error handling middleware at the end
  app.use(errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}
