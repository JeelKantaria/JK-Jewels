# Changelog

All notable changes to the J.K. Jewels project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-12-30

### Added

#### Promo Code System
- **Promo Code API** (`/api/promo`) - Full validation and listing:
  - `POST /validate` - Validates promo code with all business rules
  - `GET /available` - Lists available codes for current user
- **PromoCodeUsage Model** - Tracks per-user promo usage
- **Configurable Promo Rules**:
  - Percentage or fixed discount types
  - Minimum order amount requirement
  - Maximum discount cap
  - Per-user usage limits
  - First-order-only restriction
  - Validity period (start/end dates)
  - Global usage limits
  - Combinable with other promos flag
- **5 Seeded Promo Codes**: WELCOME10, FLAT500, LUXURY15, FESTIVE20, SAVE200

#### Order Detail Page
- **Dynamic Order Page** (`/account/orders/[orderNumber]`) with:
  - Status timeline (Pending → Confirmed → Processing → Shipped → Delivered)
  - Order items with images, prices, quantities
  - Order summary (subtotal, tax, shipping, discount with promo code)
  - Shipping address display
  - Payment method and status
  - Cancel order button for pending/confirmed orders

#### Date/Time Improvements
- **formatDateTime()** utility - Shows date and time in user's local timezone
- **formatTime()** utility - Shows time only in user's local timezone
- UTC storage in database, automatic timezone conversion on display

### Fixed
- Order totals showing NaN on orders list and account page
- Item prices showing NaN on order detail page (field name corrections)
- Missing promo code display on order summary

### Changed
- Checkout page now validates promo codes via API with real-time feedback
- Shows discount amount and description when promo applied
- Order pages use correct Prisma field names (totalAmount, taxAmount, etc.)

---

## [1.3.0] - 2025-12-29

### Added

#### Checkout Flow
- **Checkout Page** (`/checkout`) - Complete checkout experience with:
  - Order summary with cart items display
  - Shipping address selection from saved addresses
  - Promo code input with apply/remove functionality
  - Order totals breakdown (subtotal, tax, shipping, discount)
  - Customer notes field
  - "Place Order" button with loading state
- **Addresses API** (`/api/addresses`) - Full CRUD for user addresses:
  - Create, read, update, delete addresses
  - Set default address functionality
  - Address validation (pincode, phone format)
- **Addresses Page** - Fully functional UI for managing addresses

#### Reviews & Ratings
- **Reviews API** (`/api/reviews`) - Get/create/delete product reviews
  - Rating distribution and average calculation
  - Verified purchase badges
- **ProductReviews Component** - Interactive reviews section on product pages
  - Star rating input with hover states
  - Review form with title and comment
  - Reviews list with user info and ratings

#### Social Sharing
- **ShareButton Component** - Share products via:
  - WhatsApp, Facebook, Twitter
  - Copy link to clipboard
  - Native Web Share API on mobile

### Changed
- **API Client** - Added `addressesApi` and `reviewsApi`
- **Product Page** - Integrated reviews section and share button

---

## [1.2.2] - 2025-12-29

### Added

#### Frontend Error Handling
- **Centralized Error Utilities** - New `lib/errors.ts` with `getErrorMessage()`, `isNetworkError()`, and typed API error codes
- **Global Mutation Error Handler** - React Query `MutationCache` shows toast for failed mutations without custom handlers
- **Query Retry Logic** - Smart retry with exponential backoff, skips retries for network errors
- **Error Boundary** - Wraps app content to catch React rendering errors with fallback UI

### Changed
- **Cart Drawer** - Added `onError` callbacks to update/remove mutations with user-friendly messages
- **Shop Page** - Added error state with retry button when products fail to load
- **Search Modal** - Added error display with retry button when search fails

---

## [1.2.1] - 2025-12-29

### Changed

#### Wishlist Icon Redesign
- **Golden Heart with Ruby Border** - Replaced charcoal/gold design with luxurious gold gradient fill and ruby red border
- **Triple-Layer Design** - Inner gold gradient fill, ruby red border (2px), and outer gold accent border (1px visible)
- **Contained Shimmer Effect** - Fixed shimmer animation to stay within icon boundaries
- **SVG Gradient Colors** - Uses theme tokens: Antique Gold (`#C9A962`), Light Gold (`#F5E6C8`), Ruby (`#8B2942`)

---

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
