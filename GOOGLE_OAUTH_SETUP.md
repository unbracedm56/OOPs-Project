# 🔐 Google OAuth Setup Guide for https://oopsproject.vercel.app

Complete step-by-step guide to enable Google Sign-In for your deployed application.

---

## 📋 Prerequisites

- ✅ Your app is deployed at: **https://oopsproject.vercel.app**
- ✅ You have access to Google Cloud Console
- ✅ You have access to your Supabase Dashboard

---

## Part 1: Google Cloud Console Setup

### Step 1: Access Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select a Project

1. Click on the project dropdown at the top
2. Either:
   - Click **"New Project"** to create a new one
   - Or select an existing project
3. If creating new:
   - Project name: `OOPs Project` (or any name you prefer)
   - Click **"Create"**

### Step 3: Enable Google+ API (Required)

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**
4. Also enable **"Google Identity"** (search and enable it)

### Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**

2. **User Type:**
   - Select **"External"** (unless you have a Google Workspace)
   - Click **"Create"**

3. **App Information:**
   - **App name:** `OOPs Project` (or your app name)
   - **User support email:** Your email address
   - **App logo:** (Optional - upload a logo if you have one)
   - **Application home page:** `https://oopsproject.vercel.app`

4. **App domain (Important!):**
   - **Application privacy policy:** `https://oopsproject.vercel.app/privacy` (create this page or use your own)
   - **Application terms of service:** `https://oopsproject.vercel.app/terms` (create this page or use your own)
   - **Authorized domains:** 
     ```
     vercel.app
     supabase.co
     ```

5. **Developer contact information:**
   - Your email address

6. Click **"Save and Continue"**

7. **Scopes:**
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`
   - Click **"Update"**
   - Click **"Save and Continue"**

8. **Test Users (for development):**
   - Add your email and any test users
   - Click **"Save and Continue"**

9. Click **"Back to Dashboard"**

### Step 5: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**

2. Click **"+ Create Credentials"** → **"OAuth client ID"**

3. **Application type:** Select **"Web application"**

4. **Name:** `OOPs Project Web Client` (or any name)

5. **Authorized JavaScript origins:** (CRITICAL!)
   Add these URLs:
   ```
   https://oopsproject.vercel.app
   https://eyzncjhgtznrczerjdib.supabase.co
   ```

6. **Authorized redirect URIs:** (CRITICAL!)
   Add these exact URLs:
   ```
   https://eyzncjhgtznrczerjdib.supabase.co/auth/v1/callback
   https://oopsproject.vercel.app/auth/callback
   ```

7. Click **"Create"**

8. **IMPORTANT:** Copy your credentials:
   - **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-xxxxx`)
   
   ⚠️ **Save these securely - you'll need them for Supabase!**

---

## Part 2: Supabase Configuration

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `eyzncjhgtznrczerjdib`

### Step 2: Configure Google OAuth Provider

1. Go to **Authentication** → **Providers**

2. Find **"Google"** in the list and click to expand it

3. **Enable Google:**
   - Toggle **"Enable Sign in with Google"** to ON

4. **Enter Credentials:**
   - **Client ID:** Paste the Client ID from Google Console
   - **Client Secret:** Paste the Client Secret from Google Console

5. **Authorized Client IDs:** (Optional, leave blank for now)

6. Click **"Save"**

### Step 3: Configure Redirect URLs in Supabase

1. Still in **Authentication**, go to **URL Configuration**

2. **Site URL:** 
   ```
   https://oopsproject.vercel.app
   ```

3. **Redirect URLs:** Add these (one per line):
   ```
   https://oopsproject.vercel.app/**
   https://oopsproject.vercel.app/auth/callback
   http://localhost:8080/**
   http://localhost:8080/auth/callback
   ```
   (The localhost ones are for local development)

4. Click **"Save"**

---

## Part 3: Verify Your Application Code

Your auth page should already have Google sign-in button. If not, here's what it should look like:

```typescript
// In your Auth.tsx or similar
import { supabase } from '@/integrations/supabase/client'

const handleGoogleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
  }
}
```

---

## Part 4: Testing Google OAuth

### Test Steps:

1. **Clear browser cache and cookies** for your site

2. Go to https://oopsproject.vercel.app

3. Click **"Sign in with Google"** button

4. You should see Google's consent screen

5. Select your Google account

6. Grant permissions

7. You should be redirected back to your app and logged in

### Troubleshooting Common Errors:

**Error: `redirect_uri_mismatch`**
- ✅ Check that `https://eyzncjhgtznrczerjdib.supabase.co/auth/v1/callback` is in Google Console → Authorized redirect URIs
- ✅ Make sure there are no typos
- ✅ No trailing slashes in the URL

**Error: `Access blocked: This app's request is invalid`**
- ✅ Make sure you've added `vercel.app` and `supabase.co` to Authorized domains in OAuth consent screen
- ✅ Check that all required scopes are added

**Error: `unauthorized_client`**
- ✅ Verify Client ID and Secret are correctly copied to Supabase
- ✅ Make sure OAuth consent screen is published (or you're a test user)

**User not redirected after login:**
- ✅ Check Supabase redirect URLs include `https://oopsproject.vercel.app/**`
- ✅ Verify your `AuthCallback.tsx` page exists and handles the callback

---

## Part 5: Publishing Your App (Optional)

By default, your OAuth consent screen is in "Testing" mode, which only allows test users.

### To allow anyone to sign in:

1. Go to Google Cloud Console → **OAuth consent screen**
2. Click **"Publish App"**
3. Click **"Confirm"**

⚠️ **Note:** Google may review your app if you request sensitive scopes. For basic profile and email, this is usually automatic.

---

## Quick Reference - All URLs You Need

### Google Cloud Console - Authorized JavaScript origins:
```
https://oopsproject.vercel.app
https://eyzncjhgtznrczerjdib.supabase.co
```

### Google Cloud Console - Authorized redirect URIs:
```
https://eyzncjhgtznrczerjdib.supabase.co/auth/v1/callback
https://oopsproject.vercel.app/auth/callback
```

### Supabase - Site URL:
```
https://oopsproject.vercel.app
```

### Supabase - Redirect URLs:
```
https://oopsproject.vercel.app/**
https://oopsproject.vercel.app/auth/callback
http://localhost:8080/**
http://localhost:8080/auth/callback
```

---

## Security Best Practices

1. ✅ Never commit Client Secret to Git
2. ✅ Store credentials in Supabase (not in your code)
3. ✅ Use environment variables for sensitive data
4. ✅ Regularly rotate your Client Secret
5. ✅ Monitor OAuth consent screen for suspicious activity
6. ✅ Only request necessary scopes (email, profile)

---

## Next Steps After Setup

1. Test Google login on your live site
2. Test sign-out functionality
3. Verify user data is stored in Supabase
4. Test on different browsers
5. Test on mobile devices
6. Monitor Supabase logs for any auth errors

---

## Support Resources

- **Google OAuth 2.0 Docs:** https://developers.google.com/identity/protocols/oauth2
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth/social-login/auth-google
- **Vercel Deployment Docs:** https://vercel.com/docs

---

## Summary Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen
- [ ] Added authorized domains: `vercel.app`, `supabase.co`
- [ ] Created OAuth 2.0 credentials
- [ ] Added JavaScript origins: Vercel app + Supabase URL
- [ ] Added redirect URIs: Supabase callback + Vercel callback
- [ ] Copied Client ID and Secret
- [ ] Configured Google provider in Supabase
- [ ] Added redirect URLs in Supabase
- [ ] Tested Google login on live site
- [ ] (Optional) Published OAuth consent screen

---

**You're all set!** 🎉

Your Google OAuth should now work on https://oopsproject.vercel.app
