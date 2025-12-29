# Changelog

All notable changes to the J.K. Jewels project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-29

### Added

#### Backend Testing & Reliability
- **Comprehensive Test Suite** - Implemented 66+ automated tests using Jest & Supertest
- **Integration Tests** - Covering Auth, Cart, Orders, Products, Wishlist, and Categories routes
- **Unit Tests** - For critical utilities like error handling and token generation
- **Robust Error Handling** - Centralized `asyncHandler` and standardized error responses
- **Error Codes** - Added specific error codes (e.g. `INSUFFICIENT_STOCK`, `PROMO_EXPIRED`) for better frontend handling
- **Input Validation** - Enhanced Zod schemas for all API endpoints

### Fixed
- **Type Safety** - Resolved TypeScript errors in route handlers and middleware
- **Cart Logic** - Fixed variant ID handling in cart operations
- **JWT Verification** - Improved token validation and error messages

## [1.1.0] - 2024-12-29

### Added

#### Shop Page Enhancements
- **Custom Price Range Slider** with piecewise logarithmic scale for better UX
- **Indian Number Formatting** in price inputs (₹20,00,000 format with rupee symbol)
- **Accurately Positioned Price Labels** matching slider breakpoints (₹0, 1L, 2L, 5L, 1Cr)

#### Product Card Improvements
- **Always-Visible Wishlist Badge** - Charcoal heart with gold accent outline
- **Shimmer Sweep Animation** on wishlist heart (periodic shine effect)
- **Reordered Quick Actions** - View, Add to Cart, Wishlist (left to right)

#### Utility Functions
- `formatIndianNumber()` - Formats numbers to Indian notation (e.g., 2000000 → ₹20,00,000)
- `parseIndianNumber()` - Parses Indian formatted strings back to numbers

### Fixed

- **Categories 404 Error** - Fixed header navigation link from non-existent `/categories` to `/shop`

### Changed

- **Wishlist Heart Design** - Updated from ruby circle badge to elegant charcoal/gold metallic heart
- **Price Filter UX** - Labels now align precisely with slider thumb positions

---

## [1.0.0] - 2024-12-29

### Added

#### Backend
- **Express.js API Server** with comprehensive RESTful routes
- **PostgreSQL database** with Prisma ORM
- **Redis integration** for session caching
- **JWT authentication** with access and refresh tokens
- **API Routes:**
  - Authentication (register, login, profile)
  - Products (list, filter, search, details)
  - Categories (list, hierarchy)
  - Cart (CRUD operations)
  - Wishlist (add/remove products)
  - Orders (create, list, details, cancel)
- **Middleware:**
  - Authentication guards (`authenticate`, `optionalAuth`, `requireAdmin`)
  - Error handling with custom `AppError` class
  - Rate limiting and security headers
- **Database seed** with sample categories, products, and test users

#### Frontend
- **Next.js 14** with App Router
- **Tailwind CSS** with custom luxury design system
- **Pages:**
  - Homepage with hero, featured products, new arrivals
  - Shop page with advanced filtering and sorting
  - Product detail page with image gallery
  - Login/Register page with form validation
  - Account dashboard with orders, settings, addresses
  - Wishlist page
  - About page
- **Components:**
  - Responsive header with dropdown navigation
  - Animated cart drawer
  - Search modal with live results
  - Product cards with hover effects
  - Footer with links
- **State Management:**
  - Zustand for auth, cart, wishlist, UI state
  - React Query for server state
- **Features:**
  - JWT authentication with cookie persistence
  - Real-time search with debouncing
  - Mobile-responsive design
  - Micro-animations with Framer Motion

#### Infrastructure
- **Docker Compose** setup for PostgreSQL and Redis
- **Environment configuration** with example files
- **TypeScript** throughout the codebase

### Technical Details

- Frontend runs on port 3000
- Backend API runs on port 5000
- PostgreSQL on port 5432
- Redis on port 6379

### Test Accounts

- Admin: `admin@jkjewels.com` / `admin123`
- Customer: `customer@example.com` / `customer123`
