# Overview

This is a full-stack SaaS application called "IGExtract Pro" that combines Instagram handle extraction from websites with automated DM campaign management. The application allows users to upload CSV files containing website URLs, extracts Instagram handles from those sites, and then manages DM campaigns to those extracted handles with personalized templates and spintax variations.

The system implements a freemium business model with four subscription tiers (Free, Starter, Pro, Agency) and daily quota management for both extractions and DM sends. It features real-time updates via WebSockets, authentication through Replit's OAuth system, and a modern, dark-themed UI with gradient accents.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected routes based on authentication state
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Design System**: Dark theme with neon accents, glassmorphism effects, and gradient styling for a modern SaaS appearance

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM with PostgreSQL as the database
- **Real-time Communication**: WebSocket server for live progress updates during extraction and campaign execution
- **File Processing**: Multer for CSV file uploads with csv-parser for processing website lists
- **Session Management**: Express sessions with PostgreSQL session store

## Authentication & Authorization
- **Provider**: Replit's OpenID Connect (OIDC) authentication system
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization Pattern**: Route-level protection with middleware checking authenticated state
- **User Management**: Automatic user creation/updates on successful authentication

## Database Schema Design
- **Users Table**: Stores user profiles, subscription plans, daily quotas, and usage tracking
- **Sessions Table**: Required for Replit auth session persistence
- **Uploads Table**: Tracks CSV file uploads and processing status
- **Jobs Table**: Manages background extraction jobs with progress tracking
- **Results Table**: Stores extracted Instagram handles with confidence scores
- **Templates Table**: User-created DM templates with spintax support
- **Campaigns Table**: DM campaign management with status tracking
- **DM Queue Table**: Individual DM items with sending status and deep links
- **Usage Log Table**: Detailed usage tracking for quota management
- **Instagram Accounts Table**: Multiple IG account support for Agency tier

## Business Logic Architecture
- **Quota System**: Daily limits that reset at midnight UTC with real-time usage tracking
- **Subscription Tiers**: Four plans with different quotas and feature access
- **Extraction Pipeline**: Asynchronous website scraping to find Instagram profile links
- **Template Engine**: Spintax variation generation and placeholder replacement ({{name}}, {{topic}})
- **Campaign Management**: Queue-based DM sending with rate limiting and status tracking

## Data Processing Pipeline
- **CSV Upload**: File validation and domain extraction
- **Website Scraping**: Concurrent fetching of website content to find Instagram links
- **Handle Extraction**: Pattern matching and confidence scoring for Instagram usernames
- **Deduplication**: Removing duplicate handles across uploads
- **Queue Generation**: Creating sendable DM items with Instagram deep links

## Real-time Features
- **WebSocket Integration**: Live updates for job progress, campaign status, and quota usage
- **Progress Tracking**: Real-time feedback during CSV processing and campaign execution
- **User Connection Management**: Per-user WebSocket connections with authentication

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Hosting**: Development and deployment platform with built-in authentication

## Frontend Libraries
- **UI Components**: Extensive Radix UI component library for accessibility
- **Form Management**: React Hook Form with Zod schema validation
- **Icons**: Font Awesome for consistent iconography
- **Styling**: Tailwind CSS with custom design tokens and animations

## Backend Dependencies
- **Web Scraping**: Custom implementation for Instagram handle extraction from websites
- **File Processing**: Standard Node.js file system operations with CSV parsing
- **Session Management**: PostgreSQL session store for scalable session persistence
- **Real-time**: Native WebSocket implementation for live updates

## Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: TypeScript throughout the stack with shared schema definitions
- **Database Tools**: Drizzle Kit for schema management and migrations
- **Code Quality**: ESLint and TypeScript compiler for code validation

## Third-party Integrations
- **Authentication**: Replit's OAuth system for secure user authentication
- **Database**: Neon serverless PostgreSQL for scalable data storage
- **File Storage**: Local file system for temporary CSV processing
- **Email**: Ready for integration with email providers for notifications