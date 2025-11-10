# Welcome Email Feature Setup

This feature automatically sends personalized welcome emails to users when they create an account.

## How It Works

1. **User Signs Up** → Trigger fires in database
2. **Email Queued** → User info stored in `welcome_emails_queue` table
3. **Edge Function Processes** → Sends email and marks as sent

## Setup Instructions

### Step 1: Apply the Database Migration

Run this command to create the necessary tables and triggers:

```powershell
npx supabase db push
```

This will create:
- `welcome_emails_queue` table
- `send_welcome_email()` function
- Database trigger that fires on new user creation

### Step 2: Deploy the Edge Function

```powershell
npx supabase functions deploy send-welcome-email
```

### Step 3: Set Up Email Service (REQUIRED)

The function currently **simulates** sending emails. To actually send emails, you need to:

#### Option A: Use Resend (Recommended - Easiest)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add it to Supabase secrets:
   ```powershell
   npx supabase secrets set RESEND_API_KEY="re_your_key_here"
   ```
4. Uncomment the Resend code in `supabase/functions/send-welcome-email/index.ts` (lines 128-143)
5. Update `from` email to match your verified domain
6. Redeploy the function

#### Option B: Use SendGrid

1. Get SendGrid API key
2. Set secret: `npx supabase secrets set SENDGRID_API_KEY="your_key"`
3. Update the function to use SendGrid API

#### Option C: Use Supabase's Built-in SMTP (Simple but Limited)

Supabase can send emails using your SMTP server configured in the dashboard.

### Step 4: Test It

1. Sign up a new user on your app
2. Check the `welcome_emails_queue` table in Supabase
3. Call the edge function to process the queue:
   ```bash
   curl -X POST https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-welcome-email \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

### Step 5: Automate Email Sending (Optional)

Set up a cron job or scheduled task to periodically call the edge function:

#### Using Supabase Cron (if available in your plan):
```sql
-- Call the function every 5 minutes
SELECT cron.schedule(
  'process-welcome-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://eyzncjhgtznrczerjdib.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

#### Or use an external cron service:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions

## Email Templates

The function includes three role-specific templates:

### Customer Template
- Welcome message
- Shopping features overview
- Link to dashboard

### Retailer Template
- Store setup instructions
- Business tools overview
- Link to retailer dashboard

### Wholesaler Template
- Wholesale network introduction
- Catalog management guide
- Link to wholesaler dashboard

## Customization

### Edit Email Templates

Open `supabase/functions/send-welcome-email/index.ts` and modify the `getEmailTemplate` function.

### Add Environment Variables

Set your site URL:
```powershell
npx supabase secrets set SITE_URL="https://yourdomain.com"
```

## Monitoring

### Check Queue Status

```sql
-- See pending emails
SELECT * FROM welcome_emails_queue WHERE sent_at IS NULL;

-- See sent emails
SELECT * FROM welcome_emails_queue WHERE sent_at IS NOT NULL;

-- See failed emails
SELECT * FROM welcome_emails_queue WHERE error_message IS NOT NULL;
```

### View Logs

Check Edge Function logs in Supabase Dashboard → Edge Functions → send-welcome-email → Logs

## Troubleshooting

### Emails not being queued?
- Check if the trigger is active: Run `\df send_welcome_email` in SQL editor
- Verify user signup is working

### Emails queued but not sent?
- Make sure you've configured an email service (Resend, SendGrid, etc.)
- Check the function logs for errors
- Verify secrets are set correctly

### Emails sent but not received?
- Check spam folder
- Verify "from" email domain is verified with your email provider
- Check email service dashboard for delivery status

## Cost Considerations

- **Resend**: 100 emails/day free, then $20/month for 50k emails
- **SendGrid**: 100 emails/day free, then pay-as-you-go
- **Supabase**: Edge Function calls are free up to 500k/month

## Next Steps

After basic setup works, consider:
1. Adding unsubscribe links
2. Creating more email templates (password reset, order confirmation, etc.)
3. Adding email preferences to user profiles
4. Implementing email analytics

---

**Note**: The current implementation queues emails immediately but requires manual/scheduled processing. For instant emails, you could trigger the Edge Function directly from the database trigger (requires additional setup).
