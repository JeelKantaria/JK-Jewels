# J.K. Jewels - Luxury E-commerce Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express-4.x-green?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
</p>

<p align="center">
  A stunning, premium luxury jewellery e-commerce platform built with modern technologies.
  <br />
  <a href="#-features"><strong>Explore features »</strong></a>
  ·
  <a href="#-quick-start"><strong>Get started »</strong></a>
</p>

---

## ✨ Features

### 🛍️ Customer Features
- **Product Catalog** - Browse products with advanced filtering (category, metal, purity, price, occasion)
- **Smart Price Filter** - Custom slider with Indian notation (₹20,00,000), logarithmic scale for better UX
- **Search** - Live search with auto-suggestions and instant results
- **Product Details** - Image gallery, size variants, related products
- **Smart Add-to-Cart** - Single-size products add directly, multi-size redirect to product page
- **Shopping Cart** - Animated slide-out cart with real-time counter badge in header
- **Wishlist** - Save favorite products with always-visible heart badges (golden/ruby design)
- **Checkout** - Complete checkout with address selection, promo codes, order notes
- **Promo Codes** - Configurable discount codes with usage limits, expiry, min order rules
- **Order Tracking** - View order status, timeline, items, and cancel pending orders
- **User Authentication** - Email/password login with JWT tokens
- **Account Dashboard** - View orders, manage settings, addresses

### 🛠️ Admin Features
- **Dashboard** - Revenue, orders, products, customers stats with jewel-toned design
- **Inventory Management** - Track stock levels, filter low/out-of-stock, inline editing
- **Products Management** - Add, edit, delete products with variant support
- **Categories Management** - Add, edit, delete product categories
- **Metal Types** - Manage metal types (Gold, Silver, Platinum, Rose Gold, etc.)
- **Purities** - Manage purity levels (24K, 22K, 18K, 925 Sterling, etc.)
- **Occasions** - Manage occasions (Wedding, Festival, Daily Wear, etc.)
- **Orders Management** - View and process customer orders with date filters
- **Analytics** - Charts for revenue and orders trends with custom date ranges

### 🎨 Design Excellence
- Premium, elegant UI with micro-interactions
- Mobile-first responsive design
- Luxury color palette (Antique Gold, Rich Black, Warm Cream)
- Smooth animations with Framer Motion
- Custom Tailwind design system

### 🔧 Technical Features
- **Next.js 14** with App Router and Server Components
- **Express.js** RESTful API with comprehensive routes
- **PostgreSQL** database with Prisma ORM
- **Redis** for session caching
- **JWT** authentication with refresh tokens
- **TypeScript** throughout the codebase
- **React Query** for server state management with global error handling
- **Zustand** for client state management
- **Error Handling** - React Error Boundary, retry logic, user-friendly error messages

## 🏗️ Project Structure

```
JK-Jewels/
├── frontend/              # Next.js 14 application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities and stores
│   └── tailwind.config.ts
│
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Auth, error handling
│   │   └── lib/          # Database clients
│   └── prisma/           # Database schema & migrations
│
├── docker/                # Docker configurations
├── docs/                  # Documentation
└── docker-compose.yml     # Container orchestration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Docker** & Docker Compose
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JeelKantaria/JK-Jewels.git
   cd JK-Jewels
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend && npm install && cd ..
   
   # Backend
   cd backend && npm install && cd ..
   ```

3. **Start database services**
   ```bash
   docker-compose up -d
   ```

4. **Configure environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

5. **Setup database**
   ```bash
   cd backend
   npx prisma db push
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Backend (http://localhost:5000)
   cd backend && npm run dev
   
   # Terminal 2: Frontend (http://localhost:3000)
   cd frontend && npm run dev
   ```

## 🔑 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@jkjewels.com` | `admin123` |
| Customer | `customer@example.com` | `customer123` |

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Session & cache store |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:slug` - Get product details
- `GET /api/products/featured` - Featured products
- `GET /api/products/new-arrivals` - New arrivals

### Cart & Orders
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add to cart
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create order

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:slug` - Category details

### Promo Codes
- `POST /api/promo/validate` - Validate and calculate promo discount
- `GET /api/promo/available` - List available codes for user

### Addresses
- `GET /api/addresses` - List user's addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

## 🎨 Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Primary (Antique Gold) | `#C9A962` | Buttons, accents, highlights |
| Secondary (Rich Black) | `#1A1A1A` | Text, headers, backgrounds |
| Background (Warm Cream) | `#FAF8F5` | Page backgrounds |
| Accent (Ruby) | `#8B2942` | Warnings, sales badges |

## 📁 Key Files

```
frontend/
├── tailwind.config.ts     # Design system tokens
├── src/app/globals.css    # Global styles
├── src/lib/store.ts       # Zustand stores
└── src/lib/api.ts         # API client

backend/
├── prisma/schema.prisma   # Database models
├── src/index.ts           # Server entry point
└── src/routes/            # API routes
```

## 🛠️ Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm run start    # Start production server
npm run db:seed  # Seed database
npm run test     # Run test suite
```

## 📄 License

MIT © J.K. Jewels

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/JeelKantaria">Jeel Kantaria</a>
</p>