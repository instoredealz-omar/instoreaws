# Instoredealz - Deal Discovery Platform

## Overview
Instoredealz is a full-stack deal discovery platform designed to connect customers with local businesses offering discounts and deals. It supports three primary user roles: customers for deal discovery and claiming, vendors for deal creation and management, and administrators for platform oversight. The project aims to provide a seamless experience for finding and redeeming local deals, fostering connections between businesses and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (November 28, 2025 - Current Session)
- **Fixed Store Location Data Capture**: Added state, city, sublocation, pincode, and contactPhone fields to deals table schema for capturing store location info during deal creation
- **Simplified Country Selection to India-Only**: Removed multi-country phone validation dropdown since app will be used in India exclusively, hardcoded to 10-digit Indian phone numbers
- **Location Fields Now Always Visible**: Made state, city, sublocation, pincode, and contact number fields permanently visible in deal creation form instead of conditional display
- **Admin Claimed Deals Now Shows Store Location**: Updated `/api/admin/claimed-deals` endpoint to build store location from deal's location fields and display in claimed deals table
- **Store Location Format**: Store locations now display as "Sublocation, City, State, Pincode" format in admin panel

## Recent Changes (October 2025)
- **Separated online and offline deal claim flows**: Online deals now bypass store verification, providing immediate claim codes and affiliate link redirects. Offline deals continue to require in-store PIN verification with bill amount.
- **Enhanced security for online claims**: Implemented crypto-grade randomness (crypto.randomBytes) for generating claim codes instead of Math.random()
- **Added endpoint safeguards**: The `/api/deals/:id/claim-with-bill` endpoint now explicitly rejects online deals to prevent misrouting
- **Improved customer UX**: Different claim buttons and instructions for online vs offline deals, with automatic affiliate link opening for online claims
- **Fixed critical race condition bug in POS transactions**: Implemented atomic SQL increment operations for redemption counters (dealsClaimed, currentRedemptions, totalRedemptions) to prevent lost updates during concurrent POS transactions
- **Added atomic increment methods**: Created three new storage methods (incrementUserDealsClaimed, incrementVendorRedemptions, incrementDealRedemptions) using `UPDATE table SET column = COALESCE(column, 0) + 1` for NULL-safe atomic updates
- **Completed comprehensive end-to-end testing**: Verified complete workflow across all three roles (customer, vendor, admin) from vendor registration through deal redemption
- **Fixed duplicate vendor registration forms**: Consolidated multiple registration prompts into a single VendorRegistrationStatus component across dashboard, profile, and deal creation pages
- **Database workflow confirmed**: All data properly flows from vendor registration through admin approval to customer-facing deals with correct counter updates
- **Commission Tracking Foundation (October 31, 2025)**: Built comprehensive database schema and storage interface for tracking affiliate commissions from online deals without requiring payment gateway integration initially. System supports click tracking, conversion tracking (manual confirmation), commission calculations based on vendor-specific rates, and payout batch management. Ready for implementation phase.
- **Third-Party Vendor API (November 23, 2025)**: Implemented complete RESTful API for external vendor POS integrations with:
  - API key authentication system with automatic key generation and validation
  - Six production-ready endpoints: authenticate, verify claims, complete transactions, check status, analytics, and documentation
  - Comprehensive error handling with standardized error codes and messages
  - Rate limiting support (1000 requests/minute per key)
  - Real-time claim verification and transaction processing
  - Vendor-specific analytics with date range filtering
  - Complete documentation with JavaScript, Python, and cURL code examples (VENDOR_API_DOCUMENTATION.md, VENDOR_API_EXAMPLES.md)
  - Full test coverage with test report (VENDOR_API_TEST_REPORT.md)
  - Security features: API key expiration, vendor approval validation, cross-vendor access prevention
- **Email Service Migration (November 25, 2025)**: Migrated from Resend to ZeptoMail for all transactional emails:
  - Uninstalled Resend package and installed ZeptoMail
  - Completely rewrote server/email.ts to use ZeptoMail's official SendMailClient API
  - Maintained all email templates (welcome, vendor registration, deal approval/rejection, reports, API key generation)
  - Email service gracefully disables when ZMPT_TOKEN is not provided
  - All email functionality tested and working correctly

## System Architecture

### UI/UX Decisions
The platform features a modern, responsive design built with Radix UI and styled using Tailwind CSS, ensuring accessibility and a consistent user experience across devices. Key UI elements include full-width promotional banners with responsive video display, dynamic category carousels with gradient icons, and enhanced digital membership cards. Dark mode support is comprehensive across all components, optimizing typography and color schemes for readability. Interactive elements like chart controls and smart action buttons enhance user engagement. The logo is a modern square design with an animated gradient border and blue/gold scrolling text animation.

### Documentation & Onboarding
Comprehensive documentation covers both manual and API workflows:
- **CUSTOMER_TUTORIAL.md**: Complete guide for customers on deal discovery, claiming (30 seconds), and redemption (5-10 min manual or 2-3 sec with API)
- **VENDOR_ONBOARDING_GUIDE_UPDATED.md**: Vendor guide with two complete paths:
  - Manual Path: For vendors without POS systems (simple 5-minute setup)
  - API Path: For vendors with POS systems (automated, real-time processing)
- **TUTORIAL_UPDATE_SUMMARY.md**: Overview of dual workflow support
Both paths fully supported with clear guidance on choosing the right approach for each vendor's needs.

### Technical Implementations
The application follows a monorepo structure with distinct `client/` (React with TypeScript, Vite), `server/` (Express.js with TypeScript), and `shared/` directories. PostgreSQL with Drizzle ORM is used for the database, and state management is handled by Zustand (for authentication) and TanStack Query (for data fetching). Wouter provides lightweight client-side routing. Authentication is JWT-based with role-based access control (Customer, Vendor, Admin, Super Admin). A 6-character alphanumeric PIN verification system is central to deal redemption, alongside a two-phase claiming process (claim online, verify in-store). Vendor deal creation includes custom categories and requires admin approval for edits. A comprehensive POS (Point of Sale) system is implemented for vendors, including session management and transaction processing.

### Feature Specifications
- **Authentication & Authorization**: JWT-based system with robust role-based access control for customers, vendors, and multiple admin levels.
- **Deal Management**: Vendors can create and manage deals with image uploads, categories, and PINs. Admins manage deal approvals, rejections, and membership tiers.
- **Deal Discovery & Claiming**: Customers can browse deals, claim them, and redeem in-store using a secure PIN verification process. A comprehensive claim code system is also available.
- **User & Vendor Profiles**: Users and vendors have editable profiles with photo upload and business details respectively.
- **Digital Membership Cards**: Enhanced digital membership cards display user stats, support QR codes, and dynamically adapt to membership tiers.
- **Promotional Banners**: A global banner system supports multiple videos, analytics tracking, and theme-aware backgrounds.
- **Geolocation**: Location-based deal discovery with distance calculations and intelligent hints.
- **Admin & Vendor Dashboards**: Comprehensive dashboards provide analytics, user/vendor management, and reporting capabilities.
- **POS System**: Integrated Point of Sale for vendors to manage sessions, process transactions, and verify deals.
- **Reports & Analytics**: Admin reports cover users, vendors, deals, claims, and revenue, with CSV export.
- **Notifications**: Automated email notifications for registrations and business approvals using SendGrid (optional).
- **Commission Tracking System** (Fully Implemented - October 31, 2025): Gateway-less affiliate commission tracking for online deals with:
  - Vendor commission settings with flexible rate tiers (5% click rate, 10% conversion rate by default)
  - Automatic click tracking when customers claim online deals via affiliate links
  - Conversion tracking via manual admin confirmation workflow with sale amount entry
  - Estimated vs confirmed commission calculations (estimated on click, confirmed on conversion)
  - Payout batch creation and processing with status tracking and payment reference management
  - Admin commission reports dashboard with:
    - Overview metrics (total clicks, conversions, estimated/confirmed commissions)
    - Transaction list with status and date range filtering
    - Conversion confirmation UI
    - Payout batch management (create, update, process)
  - Vendor online deal performance analytics page showing:
    - Summary statistics (clicks, conversions, conversion rate, commission earnings)
    - Performance breakdown by deal with metrics and conversion rates
    - Educational information about commission tracking
  - Complete end-to-end flow: customer claims online deal → commission transaction created → admin confirms conversion → payout batch processed
  - Predicate-based cache invalidation ensures real-time data updates after mutations
- **Third-Party Vendor API** (Fully Implemented - November 23, 2025): Complete RESTful API for external POS system integration:
  - **Authentication**: Secure API key generation and management for approved vendors
  - **Claim Verification**: Real-time verification of customer claim codes before transaction processing
  - **Transaction Completion**: Automated claim status updates with bill amount and savings calculation
  - **Status Checking**: Query claim status by code or ID for audit and tracking
  - **Analytics**: Comprehensive vendor performance metrics with date range and deal filtering
  - **Documentation**: Auto-generated API documentation endpoint with all specs and error codes
  - **Security**: API key validation, vendor approval checking, cross-vendor access prevention, rate limiting
  - **Integration Support**: Full documentation with JavaScript, Python, and cURL examples for easy integration
  - **Database Integration**: All endpoints use real database storage with atomic transaction updates

### System Design Choices
The application emphasizes modularity, separation of concerns, and type safety. Database operations are abstracted through an `IStorage` interface. All critical processes like PIN verification and claim management are designed for high security and data integrity. The system supports a flexible workflow where customers can claim deals online and verify them offline at the store. Extensive error handling and robust validation are implemented across the system.

## External Dependencies

- **Database**: PostgreSQL (via `@neondatabase/serverless`)
- **ORM**: Drizzle ORM
- **UI Components**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS
- **Frontend Build Tool**: Vite
- **State Management**: Zustand, TanStack Query (React Query)
- **Routing**: Wouter
- **Type Validation**: Zod
- **Authentication**: `jsonwebtoken`, `bcrypt`
- **QR Code Generation**: `qrcode`
- **Email Service**: ZeptoMail (optional - requires ZMPT_TOKEN in Replit Secrets)
- **Payment Gateway**: Razorpay

## Production Setup Notes

### Email Notifications (Optional)
Email notifications are currently disabled. To enable:
1. Get a ZeptoMail Send Mail Token from https://www.zoho.com/zeptomail/
   - Sign up for a ZeptoMail account
   - Go to Mail Agents tab → Setup Info (gear icon) → API tab
   - Copy your Send Mail Token
2. Add it to Replit Secrets as `ZMPT_TOKEN`
3. Restart the application

Features affected when disabled:
- Welcome emails for new customers
- Vendor registration confirmation emails
- Deal approval/rejection notifications
- Admin report emails
- API key generation notifications

The application works fully without email notifications - they are optional enhancements.

### WhatsApp Business Messaging (Pending Setup)
WhatsApp Business messaging infrastructure has been implemented but requires credentials. To enable:
1. Create a Twilio account at https://twilio.com
2. Enable WhatsApp messaging in your Twilio console
3. Add these credentials to Replit Secrets:
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account ID
   - `TWILIO_AUTH_TOKEN`: Your Twilio authentication token
   - `TWILIO_WHATSAPP_NUMBER`: Your WhatsApp-enabled phone number (format: whatsapp:+1234567890)
4. Restart the application

Features pending activation:
- Deal notifications to customers when new deals match their preferences
- Marketing messages for promotional campaigns
- Bulk WhatsApp messaging from admin panel

The application works fully without WhatsApp messaging - it is an optional marketing enhancement.