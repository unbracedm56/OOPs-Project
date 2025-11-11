# 📧 Email System Setup & Troubleshooting Guide

## Current Status: ❌ Emails Not Sending

### Why emails aren't being sent:

1. **RESEND_API_KEY is not configured** in Supabase
2. Functions need to be redeployed after fixing the code
3. No cron job or trigger is set up to process the email queue

---

## 🚀 Quick Fix - Get Emails Working in 5 Minutes

### Step 1: Get Resend API Key (2 minutes)

1. Go to https://resend.com
2. Sign up (it's free - 3,000 emails/month)
3. Verify your email
4. Go to **API Keys** in the dashboard
5. Click **"Create API Key"**
6. Copy the key (starts with `re_...`)

### Step 2: Configure Supabase Secret (1 minute)

```powershell
# In your terminal, run this command:
npx supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here
```

**Example:**
```powershell
npx supabase secrets set RESEND_API_KEY=re_abc123xyz789
```

### Step 3: Redeploy Edge Functions (1 minute)

```powershell
# Deploy both email functions
npx supabase functions deploy send-welcome-email
npx supabase functions deploy send-order-emails
```

### Step 4: Test Email Sending (1 minute)

```powershell
# Test welcome emails (if any users signed up)
curl -X POST 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-welcome-email' -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5em5jamhndHpucmN6ZXJqZGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODg5NzAsImV4cCI6MjA3ODA2NDk3MH0._w_oFmyyRkILmcG7wVJFGe55nExezxdu-MO4fXPb_vM"

# Test order emails (if any orders exist)
curl -X POST 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-order-emails' -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5em5jamhndHpucmN6ZXJqZGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODg5NzAsImV4cCI6MjA3ODA2NDk3MH0._w_oFmyyRkILmcG7wVJFGe55nExezxdu-MO4fXPb_vM"
```

---

## 🔍 Check If Emails Are Queued

Before sending, check if there are any emails waiting:

### Check Welcome Emails Queue:
```sql
SELECT 
  id,
  email,
  name,
  role,
  sent_at,
  error_message,
  created_at
FROM welcome_emails_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Order Emails Queue:
```sql
SELECT 
  id,
  email_type,
  recipient_email,
  sent_at,
  error_message,
  created_at
FROM order_emails_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

**What to look for:**
- If `sent_at` is NULL → Email not sent yet
- If `error_message` is NOT NULL → There was an error
- If both are NULL → Email is queued and ready to send

---

## ⚙️ Set Up Automatic Email Sending (Recommended)

Currently, emails are queued but **not automatically sent**. Set up cron jobs to process them every 5 minutes:

### Option 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/eyzncjhgtznrczerjdib/database/cron-jobs
2. Click **"Create a new cron job"**

**For Welcome Emails:**
- Name: `Process Welcome Emails`
- Schedule: `*/5 * * * *` (every 5 minutes)
- SQL:
```sql
SELECT net.http_post(
  url := 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-welcome-email',
  headers := jsonb_build_object(
    'Authorization', 
    'Bearer ' || current_setting('app.settings.service_role_key')
  )
) as request_id;
```

**For Order Emails:**
- Name: `Process Order Emails`
- Schedule: `*/5 * * * *` (every 5 minutes)
- SQL:
```sql
SELECT net.http_post(
  url := 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-order-emails',
  headers := jsonb_build_object(
    'Authorization', 
    'Bearer ' || current_setting('app.settings.service_role_key')
  )
) as request_id;
```

### Option 2: GitHub Actions (For more control)

Create `.github/workflows/process-emails.yml`:

```yaml
name: Process Email Queue

on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch: # Allow manual trigger

jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Send Welcome Emails
        run: |
          curl -X POST 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-welcome-email' \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
      
      - name: Send Order Emails
        run: |
          curl -X POST 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-order-emails' \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## 🐛 Troubleshooting

### Problem: "RESEND_API_KEY not configured" error

**Solution:**
```powershell
# Set the secret
npx supabase secrets set RESEND_API_KEY=your_key_here

# Verify it's set
npx supabase secrets list
```

### Problem: Emails queued but not sending

**Check:**
1. Are cron jobs set up? (See above)
2. Are functions deployed?
   ```powershell
   npx supabase functions list
   ```
3. Check function logs:
   ```powershell
   npx supabase functions logs send-welcome-email
   npx supabase functions logs send-order-emails
   ```

### Problem: "Failed to send email" error

**Possible causes:**
1. Invalid Resend API key
2. Sender email not verified (use `onboarding@resend.dev` for testing)
3. Recipient email is invalid

**Check the error:**
```sql
SELECT error_message FROM welcome_emails_queue WHERE error_message IS NOT NULL;
SELECT error_message FROM order_emails_queue WHERE error_message IS NOT NULL;
```

### Problem: Test emails work but real emails don't

**Check:**
1. Make sure triggers are enabled:
   ```sql
   -- Check if triggers exist
   SELECT tgname FROM pg_trigger WHERE tgname LIKE '%email%';
   ```
2. Test creating a new user/order to trigger the queue

---

## 📊 Monitor Email Sending

### Check send statistics:
```sql
-- Welcome emails stats
SELECT 
  COUNT(*) as total,
  COUNT(sent_at) as sent,
  COUNT(error_message) as failed,
  COUNT(*) - COUNT(sent_at) - COUNT(error_message) as pending
FROM welcome_emails_queue;

-- Order emails stats
SELECT 
  email_type,
  COUNT(*) as total,
  COUNT(sent_at) as sent,
  COUNT(error_message) as failed
FROM order_emails_queue
GROUP BY email_type;
```

### Check recent activity:
```sql
-- Last 10 emails sent
SELECT 
  'welcome' as type,
  email,
  sent_at
FROM welcome_emails_queue 
WHERE sent_at IS NOT NULL
ORDER BY sent_at DESC 
LIMIT 10;
```

---

## 🎯 Quick Commands Summary

```powershell
# 1. Set API key
npx supabase secrets set RESEND_API_KEY=re_your_key

# 2. Deploy functions
npx supabase functions deploy send-welcome-email
npx supabase functions deploy send-order-emails

# 3. Test manually
curl -X POST 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-welcome-email' -H "Authorization: Bearer YOUR_ANON_KEY"

# 4. Check logs
npx supabase functions logs send-welcome-email --tail

# 5. List secrets
npx supabase secrets list
```

---

## ✅ Verification Checklist

- [ ] Resend account created and verified
- [ ] RESEND_API_KEY secret set in Supabase
- [ ] Both Edge Functions deployed
- [ ] Tested manual email sending
- [ ] Cron jobs configured (optional but recommended)
- [ ] Checked email queue for pending emails
- [ ] Verified at least one test email was sent

---

## 📧 Production Email Setup (After Testing)

Once everything works with `onboarding@resend.dev`, switch to your own domain:

1. **Add your domain in Resend:**
   - Go to Resend Dashboard → Domains
   - Add your domain (e.g., `oopsproject.com`)
   - Add DNS records as instructed

2. **Update email addresses in code:**
   - In `send-welcome-email/index.ts`: Change `onboarding@resend.dev` to `noreply@yourdomain.com`
   - In `send-order-emails/index.ts`: Change `orders@resend.dev` to `orders@yourdomain.com`

3. **Redeploy:**
   ```powershell
   npx supabase functions deploy send-welcome-email
   npx supabase functions deploy send-order-emails
   ```

---

**Need help?** Run these commands and share the output:
```powershell
npx supabase secrets list
npx supabase functions list
npx supabase functions logs send-welcome-email --tail
```
