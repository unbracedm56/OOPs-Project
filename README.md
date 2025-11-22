# Blitz Bazaar - Multi-Tier E-Commerce Marketplace

<div align="center">
  <img src="public/logos/blitz-bazaar-light.jpg" alt="Blitz Bazaar Logo" width="300"/>
  
  ### Lightning-Fast Marketplace Connecting Customers, Retailers & Wholesalers
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features Deep Dive](#features-deep-dive)
- [Database Schema](#database-schema)
- [Security & Authentication](#security--authentication)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

**Blitz Bazaar** is a comprehensive three-tier marketplace platform that revolutionizes the traditional e-commerce model by creating a seamless connection between:

- 👥 **Customers** - Browse and purchase products from local retailers
- 🏪 **Retailers** - Manage inventory, sell to customers, and source from wholesalers
- 🏭 **Wholesalers** - Supply products in bulk to retailers

The platform features an Amazon-inspired UI/UX with lightning-fast performance, real-time updates, and location-based services.

---

## ✨ Key Features

### 🛍️ Customer Features

#### Shopping Experience
- **Amazon-Style Interface** - Familiar, intuitive shopping experience
- **Advanced Product Search** - Full-text search with autocomplete suggestions
- **Smart Filters** - Filter by price, location, stock availability, and distance
- **Product Categories** - Organized browsing with category-based navigation
- **Live Location Tracking** - Real-time order tracking with interactive maps
- **Wishlist Management** - Save favorite products for later
- **Shopping Cart** - Dynamic cart with quantity management and price calculations

#### Product Discovery
- **Best Sellers** - Trending products based on ratings and views
- **New Arrivals** - Latest products from retailers
- **Today's Deals** - Special discounts and offers
- **Continue Shopping** - Resume browsing with viewing history
- **Product Recommendations** - Personalized suggestions

#### Reviews & Ratings
- **Verified Purchase Reviews** - Only customers who purchased can review
- **Star Ratings** - 1-5 star rating system
- **Review Management** - Add, edit, and view product reviews
- **Store Reviews** - Rate and review retailers

#### Order Management
- **Order Tracking** - Real-time status updates (Pending → Confirmed → Packed → Shipped → Delivered)
- **Order History** - Complete purchase history with details
- **Invoice Generation** - PDF invoice download for all orders
- **Calendar Integration** - Add delivery dates to calendar (Google, iCal, Outlook)
- **Delivery Maps** - Live location tracking on interactive maps

### 🏪 Retailer Features

#### Inventory Management
- **Product Catalog** - Add, edit, delete products
- **Stock Management** - Real-time inventory tracking
- **Bulk Operations** - Import products via CSV
- **Image Upload** - Multiple product images with preview
- **Product Variants** - Manage sizes, colors, and other attributes
- **Pricing Controls** - Set price, MRP, and discounts

#### Order Fulfillment
- **Order Dashboard** - Centralized order management
- **Status Updates** - Update order status in real-time
- **Customer Information** - View customer details and delivery addresses
- **Order Analytics** - Revenue, order count, and performance metrics

#### Wholesaler Marketplace
- **Browse Wholesale Products** - Access wholesaler catalogs
- **Bulk Ordering** - Purchase inventory from wholesalers
- **Price Comparison** - Compare prices across wholesalers
- **Supplier Reviews** - Rate and review wholesalers

#### Business Analytics
- **Sales Dashboard** - Revenue tracking and growth metrics
- **Product Performance** - Top-selling products analytics
- **Customer Insights** - Customer demographics and behavior
- **Review Management** - View and respond to customer reviews

### 🏭 Wholesaler Features

#### Product Management
- **Bulk Product Listings** - Manage large product catalogs
- **Wholesale Pricing** - Set bulk pricing tiers
- **Stock Control** - Inventory management at scale
- **Product Categories** - Organize products efficiently

#### Retailer Management
- **Retailer Dashboard** - View all retailer customers
- **Order Management** - Process bulk orders from retailers
- **Business Analytics** - Track sales to retailers
- **Performance Metrics** - Monitor business growth

#### Advanced Analytics
- **Revenue Tracking** - Month-over-month growth analysis
- **Order Statistics** - Total orders, pending, processing counts
- **Retailer Metrics** - Total retailers, new retailers today
- **Product Analytics** - Total products in inventory

### 🌐 Platform-Wide Features

#### User Management
- **Multi-Role System** - Customer, Retailer, Wholesaler, Admin roles
- **Profile Management** - Edit personal information, upload avatar
- **Address Book** - Save multiple delivery addresses
- **Live Location** - Use current GPS location for delivery

#### Payment Integration
- **Stripe Integration** - Secure card payments
- **Cash on Delivery** - COD payment option
- **Payment Tracking** - Transaction history and status
- **Multiple Payment Methods** - Razorpay, Stripe, Offline payments

#### Notifications
- **Real-Time Alerts** - Order updates, payment confirmations
- **Email Notifications** - Order confirmations and updates
- **Push Notifications** - Browser notifications for important events
- **Notification Center** - View all notifications in one place

#### Theme & Branding
- **Light/Dark Mode** - Toggle between themes with persistence
- **Responsive Design** - Mobile-first, works on all devices
- **Custom Branding** - Blitz Bazaar lightning theme
- **Animated UI** - Smooth transitions and loading states

#### Search & Discovery
- **Global Search** - Search across all products
- **Search History** - Recent searches saved per user
- **Smart Suggestions** - AI-powered product recommendations
- **Category Filtering** - Drill down by category hierarchy

---

## 👥 User Roles

### Customer
- Browse and purchase products from retailers
- Track orders with live location
- Write reviews for products and retailers
- Manage wishlist and shopping cart
- Save multiple delivery addresses

### Retailer
- Sell products to customers
- Purchase inventory from wholesalers
- Manage store inventory and orders
- View business analytics and reports
- Set warehouse location for deliveries

### Wholesaler
- Supply products in bulk to retailers
- Manage large product catalogs
- Process bulk orders
- Track retailer relationships
- View detailed business metrics

### Admin (Future Enhancement)
- Manage all users and stores
- Moderate reviews and content
- View platform-wide analytics
- System configuration

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React components
- **Lucide Icons** - Beautiful, consistent icons
- **React Router** - Client-side routing
- **React Query** - Server state management

### Backend & Database
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Database-level security
- **PostgreSQL Functions** - Custom business logic
- **Real-time Subscriptions** - Live data updates
- **Supabase Storage** - File and image storage
- **Supabase Auth** - User authentication

### Maps & Location
- **Leaflet** - Interactive maps
- **OpenStreetMap** - Map tiles
- **Geolocation API** - Browser location access
- **Haversine Formula** - Distance calculations

### Payment Processing
- **Stripe** - Credit card payments
- **Razorpay** - Alternative payment gateway

### Additional Tools
- **Zod** - Schema validation
- **Date-fns** - Date manipulation
- **React Hook Form** - Form management
- **Sonner** - Toast notifications

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm)
- **npm** or **yarn** - Package manager
- **Supabase Account** - [Sign up at supabase.com](https://supabase.com)
- **Stripe Account** - [Sign up at stripe.com](https://stripe.com) (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/unbracedm56/OOPs-Project.git
cd OOPs-Project
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
VITE_APP_URL=http://localhost:5173
```

4. **Database Setup**

Run Supabase migrations:
```bash
npx supabase db push
```

5. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

---

## 📁 Project Structure

```
lovable-project-6b6b1c00/
├── public/
│   ├── logos/                    # Brand logos (light/dark themes)
│   ├── _redirects               # Netlify routing configuration
│   └── robots.txt               # SEO configuration
├── src/
│   ├── components/              # React components
│   │   ├── amazon/              # Amazon-style UI components
│   │   │   ├── AmazonHeader.tsx
│   │   │   ├── AmazonFooter.tsx
│   │   │   ├── AmazonProductCard.tsx
│   │   │   └── ...
│   │   ├── ui/                  # Shadcn UI components
│   │   ├── AdminSidebar.tsx
│   │   ├── CalendarIntegration.tsx
│   │   ├── DeliveryMap.tsx
│   │   ├── FeedbackForm.tsx
│   │   ├── InvoiceGenerator.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── RetailerLayout.tsx
│   │   ├── ReviewButton.tsx
│   │   ├── ReviewsList.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── WholesalerLayout.tsx
│   │   └── ...
│   ├── pages/                   # Route components
│   │   ├── Auth.tsx             # Authentication page
│   │   ├── CustomerDashboardNew.tsx
│   │   ├── RetailerDashboard.tsx
│   │   ├── WholesalerDashboard.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── OrderHistory.tsx
│   │   ├── Profile.tsx
│   │   ├── admin/               # Admin pages
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-toast.ts
│   │   ├── useAdminCheck.ts
│   │   ├── useGeolocation.ts
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/            # Supabase client & types
│   ├── lib/
│   │   └── utils.ts             # Utility functions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── supabase/
│   ├── migrations/              # Database migrations
│   │   ├── 20251016183042_*.sql
│   │   ├── 20251122000000_enhanced_review_system.sql
│   │   └── ...
│   ├── functions/               # Edge functions
│   └── config.toml              # Supabase configuration
├── package.json
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
├── tailwind.config.ts           # Tailwind configuration
└── README.md
```

---

## 🎨 Features Deep Dive

### Review System

The platform implements a comprehensive verified purchase review system:

**Database Functions:**
- `can_review_product()` - Validates if user purchased the product
- `get_product_reviews()` - Fetches published reviews for products
- `get_store_product_reviews()` - Gets all reviews for store owners

**Review Features:**
- Only customers with delivered orders can review
- Star rating (1-5 stars)
- Review title and detailed feedback
- Automatic verification badge for verified purchases
- Store owners can publish/unpublish reviews
- Real-time review updates

### Location-Based Features

**Live Location Tracking:**
- Uses browser Geolocation API
- Real-time order tracking on maps
- Distance calculation between customer and store
- Filter products by proximity

**Address Management:**
- Save multiple addresses
- Set default delivery address
- GPS coordinates stored for each address
- Address validation

### Payment System

**Stripe Integration:**
- Secure card payments
- Payment intent creation
- 3D Secure support
- Graceful fallback if Stripe not configured

**Alternative Payments:**
- Cash on Delivery (COD)
- Razorpay integration
- Offline payments for retailers

### Real-Time Features

**Live Updates:**
- Order status changes broadcast instantly
- New notifications appear without refresh
- Inventory updates reflected in real-time
- Cart synchronization across tabs

**Database Subscriptions:**
- Supabase real-time channels
- Postgres change detection
- Automatic UI updates

---

## 🗄️ Database Schema

### Core Tables

**profiles**
- User information (name, phone, avatar)
- Role assignment (customer/retailer/wholesaler/admin)
- Links to auth.users

**stores**
- Store information for retailers and wholesalers
- Store type (retailer/wholesaler)
- Owner linkage
- Warehouse address

**products**
- Product master data
- Category relationships
- Images and attributes
- SEO-friendly slugs

**inventory**
- Store-specific product listings
- Price and MRP
- Stock quantity
- Active status

**orders**
- Order header information
- Customer and store linkage
- Payment and delivery details
- Order status tracking

**order_items**
- Line items for each order
- Product snapshot (historical data)
- Quantity and pricing

**feedback**
- Product reviews
- Star ratings
- Verified purchase flag
- Publish status

**addresses**
- User addresses
- GPS coordinates
- Default address flag

### Security

**Row Level Security (RLS) Policies:**
- Users can only view their own data
- Store owners can manage their inventory
- Admins have elevated permissions
- Public can view published products

**Database Functions:**
- `get_user_role()` - Retrieve user's role
- `has_role()` - Check if user has specific role
- Custom validation functions

---

## 🔐 Security & Authentication

### Authentication Flow
1. Email/Password signup with OTP verification
2. Role selection during onboarding
3. JWT-based session management
4. Secure password hashing

### Authorization
- Role-based access control (RBAC)
- Database-level security with RLS
- API route protection
- Client-side route guards

### Data Protection
- Encrypted connections (HTTPS)
- Secure payment processing
- PII data protection
- GDPR compliance ready

---

## 🚢 Deployment

### Netlify Deployment

1. **Build Settings**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Environment Variables**
Add all `VITE_*` variables in Netlify dashboard

3. **Deploy**
```bash
netlify deploy --prod
```

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations: `npx supabase db push`
3. Configure authentication providers
4. Set up storage buckets for images

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic


## 👨‍💻 Authors

**Bharghavaram Boddapati** - [GitHub Profile](https://github.com/unbracedm56)

---
