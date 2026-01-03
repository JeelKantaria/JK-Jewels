# 🚀 JK-Jewels Deployment Guide

Deploy the JK-Jewels e-commerce platform to free hosting platforms.

## Architecture Overview

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Frontend | [Vercel](https://vercel.com) | 100GB bandwidth/mo |
| Backend | [Render](https://render.com) | 750 hours/mo |
| Database | [Neon](https://neon.tech) | 0.5GB storage |
| Cache | [Upstash Redis](https://upstash.com) | 10K commands/day (optional) |

---

## Step 1: Create Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **"Create Project"**
3. Name: `jk-jewels`, Region: `US East`
4. Copy the connection string from dashboard:
   ```
   postgresql://neondb_owner:xxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Save this URL** - you'll need it for Render

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. Go to [render.com](https://render.com) and sign up
2. Click **"New" → "Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `jk-jewels-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 2.2 Set Environment Variables

In Render dashboard → Environment:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | *(Neon connection string from Step 1)* |
| `JWT_SECRET` | *(Click "Generate" for random value)* |
| `SESSION_SECRET` | *(Click "Generate" for random value)* |
| `FRONTEND_URL` | `https://jk-jewels.vercel.app` *(update after Step 3)* |

### 2.3 Deploy & Run Migrations

1. Click **"Create Web Service"**
2. Wait for first deployment to complete
3. Go to **Shell** tab and run:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. Note your backend URL: `https://jk-jewels-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"Add New" → "Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)

### 3.2 Set Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://jk-jewels-api.onrender.com/api` |
| `NEXT_PUBLIC_SITE_URL` | `https://jk-jewels.vercel.app` |
| `NEXT_PUBLIC_ENABLE_REVIEWS` | `true` |
| `NEXT_PUBLIC_ENABLE_WISHLIST` | `true` |

5. Click **"Deploy"**

### 3.3 Update Backend CORS

After deployment, copy your Vercel URL and update Render:
- Go to Render → Environment Variables
- Update `FRONTEND_URL` to your actual Vercel URL

---

## Step 4: (Optional) Add Upstash Redis

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create a Redis database (Free tier)
3. Copy the connection URL
4. Add to Render environment:
   - `REDIS_URL`: `rediss://default:xxx@xxx.upstash.io:6379`

---

## Verification Checklist

- [ ] Backend health: `https://your-render-url/api/health`
- [ ] Products API: `https://your-render-url/api/products`
- [ ] Frontend homepage loads
- [ ] Can login with `customer@example.com / customer123`
- [ ] Products display with images
- [ ] Add to cart works

---

## Troubleshooting

### "Application failed to respond"
→ Check Render logs. Usually means database connection failed.

### CORS errors in browser
→ Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly.

### Cold start taking 30+ seconds
→ Normal for Render free tier. First request after 15min inactivity spins up the server.

### Database seed not working
→ Run in Render Shell: `npx prisma migrate deploy && npx prisma db seed`
