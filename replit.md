# Instoredealz - Deal Discovery Platform

## Overview
Instoredealz is a full-stack deal discovery platform connecting customers with local businesses offering discounts. It supports three user roles: customers for deal discovery and claiming, vendors for deal creation and management, and administrators for platform oversight. The project aims to provide a seamless experience for finding and redeeming local deals, fostering connections between businesses and consumers, and offers significant market potential by streamlining local commerce.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a modern, responsive design built with Radix UI and styled using Tailwind CSS, ensuring accessibility and a consistent user experience. Key UI elements include full-width promotional banners with responsive video display, dynamic category carousels, and enhanced digital membership cards. Dark mode support is comprehensive, optimizing typography and color schemes for readability. The logo is a modern square design with an animated gradient border and blue/gold scrolling text.

### Technical Implementations
The application follows a monorepo structure with `client/` (React with TypeScript, Vite), `server/` (Express.js with TypeScript), and `shared/` directories. PostgreSQL with Drizzle ORM is used for the database, and state management is handled by Zustand (for authentication) and TanStack Query (for data fetching). Wouter provides lightweight client-side routing. Authentication is JWT-based with role-based access control (Customer, Vendor, Admin, Super Admin). A 6-character alphanumeric PIN verification system is central to deal redemption, alongside a two-phase claiming process (claim online, verify in-store). Vendor deal creation includes custom categories and requires admin approval for edits. A comprehensive POS (Point of Sale) system is implemented for vendors. Atomic SQL increment operations are used for redemption counters to prevent race conditions.

### Feature Specifications
- **Authentication & Authorization**: JWT-based system with robust role-based access control.
- **Deal Management**: Vendors can create and manage deals with image uploads, categories, and PINs. Admins manage approvals and rejections.
- **Deal Discovery & Claiming**: Customers can browse, claim, and redeem deals in-store using PIN verification or a comprehensive claim code system. Online deals bypass store verification, providing immediate claim codes and affiliate link redirects.
- **User & Vendor Profiles**: Editable profiles with photo upload and business details.
- **Digital Membership Cards**: Enhanced digital membership cards display user stats, support QR codes, and adapt to membership tiers.
- **Promotional Banners**: A global banner system supporting multiple videos, analytics tracking, and theme-aware backgrounds.
- **Geolocation**: Location-based deal discovery with distance calculations.
- **Admin & Vendor Dashboards**: Comprehensive dashboards provide analytics, user/vendor management, and reporting.
- **POS System**: Integrated Point of Sale for vendors to manage sessions, process transactions, and verify deals.
- **Reports & Analytics**: Admin reports cover users, vendors, deals, claims, and revenue, with CSV export.
- **Commission Tracking System**: Gateway-less affiliate commission tracking for online deals including vendor commission settings, click tracking, manual admin confirmation for conversion tracking, payout batch management, and comprehensive admin/vendor reporting dashboards.
- **Third-Party Vendor API**: A complete RESTful API for external POS integrations with API key authentication, claim verification, transaction completion, status checking, analytics, auto-generated documentation, and security features like rate limiting and cross-vendor access prevention.
- **Communication**: Automated email notifications (optional) and WhatsApp Business messaging (pending setup).

### System Design Choices
The application emphasizes modularity, separation of concerns, and type safety. Database operations are abstracted through an `IStorage` interface. PIN verification and claim management are designed for high security and data integrity. The system supports a flexible workflow for online and offline deal claiming. Extensive error handling and robust validation are implemented.

## External Dependencies

- **Database**: PostgreSQL (via `@neondatabase/serverless`)
- **ORM**: Drizzle ORM
- **UI Components**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS
- **Frontend Build Tool**: Vite
- **State Management**: Zustand, TanStack Query
- **Routing**: Wouter
- **Type Validation**: Zod
- **Authentication**: `jsonwebtoken`, `bcrypt`
- **QR Code Generation**: `qrcode`
- **Email Service**: ZeptoMail (optional, requires `ZMPT_TOKEN`)
- **Payment Gateway**: Razorpay
- **SMS/WhatsApp Messaging**: Twilio (pending setup)