# TOOLSMAN — Professional Power Tools E-Commerce Platform

TOOLSMAN is a modern, full-stack, production-grade e-commerce system built for power tools, machinery, and industrial accessories.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack, TypeScript)
- **Styling**: Tailwind CSS v4 with custom Black & Orange Industrial aesthetic design tokens
- **Database & Auth**: Supabase (PostgreSQL with 16 tables, RLS security policies, and Triggers)
- **Media**: Cloudinary (Multi-image upload, image transformations, server-side secure uploads)
- **Payments**: Razorpay (UPI, Cards, Net Banking) & Cash on Delivery
- **Transactional Emails**: Brevo (Order confirmation and fulfillment notifications)

---

## 🛠️ Getting Started

### 1. Database Initialization
1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Run `supabase/seed.sql` to seed initial categories, brands, banners, and power tools.

### 2. Configure Environment
Copy `.env.example` to `.env.local` and configure your API keys:
```bash
cp .env.example .env.local
```

### 3. Run the Development Server
```bash
npm run dev
```

- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Control Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Catalog Shop**: [http://localhost:3000/shop](http://localhost:3000/shop)
- **Customer Account**: [http://localhost:3000/account](http://localhost:3000/account)
