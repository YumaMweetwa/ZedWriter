# Zedwriter - Student Research Assistance Platform

## Overview

Zedwriter is a comprehensive web application designed to provide academic research assistance services to students in Zambia. The platform offers professional help with research proposals, dissertations, data analysis, assignments, and related academic writing services. The system features a full-stack architecture with React frontend, Express.js backend, and now exclusively Firebase Firestore for all data storage, featuring three-step submission wizard, student dashboard, comprehensive admin panel, materials library, referral system, WhatsApp chat functionality, and direct payment system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type-safe component development
- **Routing**: Wouter for lightweight client-side routing without React Router dependencies
- **State Management**: React Context API for global state (AuthContext, AppContext) with custom hooks
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system using CSS variables for theming
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture  
- **Server**: Express.js with TypeScript for API endpoints and middleware
- **Authentication**: Firebase Admin SDK for unified authentication
- **Database**: Firebase Firestore for scalable NoSQL document storage
- **File Storage**: Firebase Cloud Storage with fallback to local filesystem
- **Real-time Communication**: WebSocket server for live chat functionality
- **API Design**: RESTful endpoints with structured error handling and logging middleware

### Database Schema Design
The system uses Firebase Firestore with the following core collections:
- **users**: User profiles, roles, referral data, and payment tracking
- **submissions**: Work requests with status tracking and file metadata
- **materials**: Academic resources categorized by program, year, and type
- **chatRooms & messages**: Real-time communication system
- **payments**: Transaction records with provider references and webhook support
- **referrals**: Points-based system for user acquisition tracking
- **announcements**: System announcements and notifications
- **pricingServices**: Dynamic pricing configuration

### Authentication System
The platform implements a hybrid authentication approach:
- **Firebase Auth**: Primary authentication with Google OAuth integration
- **Session-based Auth**: Fallback system with connect-pg-simple for session storage
- **Authorization**: Role-based access control (student/admin) with protected routes
- **Token Management**: JWT tokens for API authentication with Firebase ID token verification

### File Upload and Storage
- **Multi-provider Support**: Firebase Cloud Storage as primary with local filesystem fallback
- **File Validation**: Type checking, size limits (20MB), and secure filename generation
- **Progress Tracking**: Real-time upload progress with chunked transfer support
- **Metadata Storage**: File information stored in database with cloud URLs

## External Dependencies

### Cloud Services
- **Firebase**: Authentication, Firestore, Cloud Storage, and Cloud Functions
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit**: Development environment with integrated deployment pipeline

### Authentication Providers
- **Google OAuth**: Primary social authentication method
- **Firebase Auth**: Identity management and token verification

### Payment Integration
- **Abstract Payment Module**: Designed for Zambian mobile money providers (MTN, Airtel)
- **Webhook System**: Unified endpoint for payment status updates from multiple providers
- **Provider Agnostic**: SDK-swappable design for future payment method additions

### Development Tools
- **TypeScript**: Full-stack type safety with shared schema definitions
- **ESBuild**: Fast bundling for server-side code in production
- **Drizzle Kit**: Database migrations and schema management
- **React Query**: Client-side data fetching and caching (referenced but not fully implemented)

### UI and Styling Dependencies
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide Icons**: Modern icon library with React components
- **Font Awesome**: Legacy icon support for existing components
- **Inter Font**: Primary typography from Google Fonts

### File Processing
- **Multer**: Server-side multipart form handling for file uploads
- **React Dropzone**: Drag-and-drop file upload interface
- **File Validation**: MIME type checking for PDF, DOC, PPT, and Excel formats