# Instoredealz - Deal Discovery Platform

## Overview
Instoredealz is a full-stack deal discovery platform designed to connect customers with local businesses offering discounts and deals. It supports three primary user roles: customers for deal discovery and claiming, vendors for deal creation and management, and administrators for platform oversight. The project aims to provide a seamless experience for finding and redeeming local deals, fostering connections between businesses and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a modern, responsive design built with Radix UI and styled using Tailwind CSS, ensuring accessibility and a consistent user experience across devices. Key UI elements include full-width promotional banners with responsive video display, dynamic category carousels with gradient icons, and enhanced digital membership cards. Dark mode support is comprehensive across all components, optimizing typography and color schemes for readability. Interactive elements like chart controls and smart action buttons enhance user engagement. The logo is a modern square design with an animated gradient border and blue/gold scrolling text animation.

### Documentation & Onboarding
Comprehensive vendor onboarding documentation has been created (VENDOR_ONBOARDING_GUIDE.md) providing step-by-step guidance for new vendors including signup, business registration, verification, POS system training, and best practices for success on the platform.

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
- **Email Service**: SendGrid
- **Payment Gateway**: Razorpay