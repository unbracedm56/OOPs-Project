# 🚀 Quick Deployment Instructions

Your website is ready to deploy! Here are the fastest ways to get it online:

## ⚡ Fastest Method: Vercel (Recommended)

### Option 1: One-Command Deploy (Easiest)

```powershell
# Run the automated deployment script
.\deploy.ps1
```

This script will:
1. ✅ Build your project
2. ✅ Install Vercel CLI if needed
3. ✅ Deploy to production

### Option 2: Manual Vercel Deploy

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Deploy
vercel --prod
```

Follow the prompts to login and deploy.

## 🌐 After Deployment

### 1. Add Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

```
VITE_SUPABASE_URL = https://eyzncjhgtznrczerjdib.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = [your-key-from-.env]
```

### 2. Update Supabase Redirect URLs

In your Supabase Dashboard:
- Go to Authentication → URL Configuration
- Add your Vercel URL to **Redirect URLs**:
  ```
  https://your-project.vercel.app/auth/callback
  https://your-project.vercel.app/**
  ```

### 3. Redeploy (after adding env vars)

```powershell
vercel --prod
```

## 🎯 Alternative: Deploy to Netlify

```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## 📋 Pre-Deployment Checklist

- ✅ Build test passed (`npm run build`)
- ✅ Environment variables ready
- ✅ Supabase project configured
- ✅ `.env` file NOT committed to Git

## 🆘 Troubleshooting

**Build fails?**
```powershell
rm -r node_modules
npm install
npm run build
```

**Environment variables not working?**
- Make sure they start with `VITE_`
- Add them in your deployment platform's dashboard
- Redeploy after adding variables

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for detailed instructions on all deployment platforms.

---

**Your site is production-ready!** 🎉

Just run `.\deploy.ps1` or `vercel --prod` to go live.
