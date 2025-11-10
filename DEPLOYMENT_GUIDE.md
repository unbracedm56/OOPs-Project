# 🚀 Website Deployment Guide

This guide covers multiple deployment options for your React + Vite + Supabase application.

## Prerequisites

Before deploying, ensure:
- ✅ Your Supabase project is set up (already done - `eyzncjhgtznrczerjdib`)
- ✅ Environment variables are configured in `.env`
- ✅ The application builds successfully: `npm run build`

## Quick Start - Recommended Platforms

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel?**
- ✅ Free tier with generous limits
- ✅ Automatic deployments from Git
- ✅ Built-in CDN and SSL
- ✅ Perfect for React/Vite apps
- ✅ Zero configuration needed

**Steps:**

1. **Install Vercel CLI** (optional, or use web interface):
   ```powershell
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```powershell
   vercel
   ```
   - Follow the prompts
   - Connect your GitHub account (recommended for auto-deployments)
   - Vercel will auto-detect Vite settings

3. **Or Deploy via Dashboard**:
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your Git repository
   - Vercel auto-detects Vite configuration
   - Add environment variables in project settings:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Click "Deploy"

4. **Configure Environment Variables** (in Vercel dashboard):
   - Go to Project Settings → Environment Variables
   - Add your Supabase credentials from `.env`

### Option 2: Netlify

**Why Netlify?**
- ✅ Free tier with 100GB bandwidth
- ✅ Excellent for static sites
- ✅ Easy continuous deployment
- ✅ Built-in form handling

**Steps:**

1. **Create `netlify.toml`** in your project root (I'll create this for you)

2. **Deploy via Netlify CLI**:
   ```powershell
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

3. **Or Deploy via Dashboard**:
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Build settings (auto-detected):
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables
   - Click "Deploy site"

### Option 3: GitHub Pages (Free)

**Why GitHub Pages?**
- ✅ Completely free
- ✅ Good for public projects
- ✅ Integrated with GitHub

**Steps:**

1. **Install gh-pages**:
   ```powershell
   npm install --save-dev gh-pages
   ```

2. **Update `vite.config.ts`** to set base path (already configured)

3. **Add deployment script to `package.json`**:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. **Deploy**:
   ```powershell
   npm run deploy
   ```

5. **Configure GitHub**:
   - Go to your repository → Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - Your site will be at: `https://yourusername.github.io/lovable-project-6b6b1c00/`

### Option 4: Cloudflare Pages

**Why Cloudflare Pages?**
- ✅ Unlimited bandwidth (free tier)
- ✅ Fast global CDN
- ✅ Excellent performance
- ✅ Great security features

**Steps:**

1. **Via Cloudflare Dashboard**:
   - Go to https://pages.cloudflare.com
   - Click "Create a project"
   - Connect your Git repository
   - Build settings:
     - Framework preset: `Vite`
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Add environment variables
   - Click "Save and Deploy"

### Option 5: Self-Hosted (VPS/Cloud Server)

**For AWS, DigitalOcean, Linode, etc.**

**Steps:**

1. **Build the production bundle**:
   ```powershell
   npm run build
   ```

2. **Install a web server** (on your server):
   ```bash
   # Using Nginx (recommended)
   sudo apt update
   sudo apt install nginx
   ```

3. **Upload the `dist` folder** to your server:
   ```powershell
   # Using SCP
   scp -r dist/* user@your-server:/var/www/html/
   ```

4. **Configure Nginx** (`/etc/nginx/sites-available/default`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. **Restart Nginx**:
   ```bash
   sudo systemctl restart nginx
   ```

## Pre-Deployment Checklist

Before deploying to any platform, complete these steps:

### 1. Build Test
```powershell
npm run build
```
Ensure it completes without errors.

### 2. Preview Build Locally
```powershell
npm run preview
```
Test the production build at `http://localhost:4173`

### 3. Environment Variables

Make sure these are set in your deployment platform:

```env
VITE_SUPABASE_URL=https://eyzncjhgtznrczerjdib.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

**⚠️ IMPORTANT**: Never commit `.env` to Git! Add it to `.gitignore`.

### 4. Verify Supabase Settings

In your Supabase Dashboard:
- Go to Authentication → URL Configuration
- Add your deployment URL to **Redirect URLs**
- Example: `https://yourapp.vercel.app/auth/callback`

### 5. Update CORS Settings (if needed)

In Supabase Dashboard → Settings → API:
- Add your production domain to allowed origins

## Post-Deployment Steps

### 1. Test Critical Features
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Database read/write operations
- ✅ Order creation
- ✅ File uploads (if applicable)
- ✅ Email notifications

### 2. Set Up Custom Domain (Optional)

**Vercel:**
- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

**Netlify:**
- Go to Site Settings → Domain Management
- Add custom domain
- Configure DNS

### 3. Enable Analytics (Optional)

**Vercel Analytics:**
```powershell
npm install @vercel/analytics
```

Add to your app:
```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

## Continuous Deployment Setup

### Automatic Deployments from Git

**Vercel/Netlify (Recommended):**
1. Connect your GitHub repository
2. Every push to `main` branch auto-deploys
3. Pull requests get preview deployments

**GitHub Actions (Alternative):**
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
        run: npm run build
        
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Troubleshooting

### Build Fails
```powershell
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Ensure they start with `VITE_`
- Restart the build after adding new variables
- Check platform-specific syntax (some use different formats)

### 404 Errors on Routes
Make sure your hosting platform is configured for SPA routing:
- **Vercel**: Automatic with `vercel.json` (I'll create this)
- **Netlify**: Add `_redirects` file (I'll create this)
- **Nginx**: Use `try_files $uri /index.html`

### Supabase Connection Issues
1. Verify environment variables are set correctly
2. Check Supabase dashboard for API keys
3. Ensure URLs match exactly (no trailing slashes)
4. Add deployment domain to Supabase allowed origins

## Performance Optimization

### 1. Enable Compression
Most platforms (Vercel, Netlify) handle this automatically.

### 2. Optimize Images
Consider using:
- WebP format
- CDN for static assets
- Lazy loading

### 3. Code Splitting
Vite handles this automatically, but you can improve with:
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 4. Caching Strategy
Add cache headers in `vercel.json` or `netlify.toml`

## Monitoring & Maintenance

### Set Up Error Tracking
Consider adding:
- **Sentry**: Error monitoring
- **LogRocket**: Session replay
- **Vercel Analytics**: Performance metrics

### Regular Updates
```powershell
# Check for updates
npm outdated

# Update dependencies
npm update

# Test and redeploy
npm run build
```

## Cost Estimates

| Platform | Free Tier | Paid Plans Start At |
|----------|-----------|---------------------|
| Vercel | 100GB bandwidth | $20/month |
| Netlify | 100GB bandwidth | $19/month |
| GitHub Pages | Unlimited (public repos) | N/A |
| Cloudflare Pages | Unlimited bandwidth | $20/month (Pro features) |

## Recommended: Vercel Deployment

For this project, **Vercel is the best choice** because:
- Zero configuration needed
- Automatic HTTPS
- Edge network for fast loading
- Seamless Vite integration
- Free tier is generous
- Great developer experience

**Quick Deploy Command:**
```powershell
npx vercel
```

That's it! Your site will be live in minutes. 🚀

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Vite Deploy Guide**: https://vitejs.dev/guide/static-deploy.html
- **Supabase Docs**: https://supabase.com/docs
