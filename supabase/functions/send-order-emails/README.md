# Send Order Emails - Edge Function

This Edge Function processes queued order-related emails including:
- Order confirmation (when order is created)
- Shipping notification (when order status changes to "shipped")
- Delivery confirmation (when order status changes to "delivered")

## How It Works

1. **Database Triggers**: When an order is created or its status changes, triggers automatically queue emails in the `order_emails_queue` table
2. **Edge Function**: This function processes the queue and sends emails using your email service provider
3. **Email Templates**: Role-specific, beautifully formatted HTML emails for each order event

## Setup Instructions

### 1. Deploy the Database Migration

First, apply the database migration that creates the necessary tables and triggers:

```bash
npx supabase db push
```

This creates:
- `order_emails_queue` table to store pending emails
- Triggers on the `orders` table that automatically queue emails
- Helper functions for building email data

### 2. Choose an Email Service Provider

You'll need an email service to actually send emails. Recommended options:

**Option A: Resend (Recommended)**
- Sign up at https://resend.com
- Free tier: 3,000 emails/month
- Great developer experience
- Simple API

**Option B: SendGrid**
- Sign up at https://sendgrid.com
- Free tier: 100 emails/day
- Enterprise-grade features

**Option C: AWS SES**
- Most cost-effective for high volume
- Requires AWS account setup
- 62,000 free emails/month (if sending from EC2)

### 3. Configure Email Service API Key

Set your email service API key as a Supabase secret:

```bash
# For Resend
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here

# For SendGrid
npx supabase secrets set SENDGRID_API_KEY=SG.your_api_key_here

# For AWS SES
npx supabase secrets set AWS_ACCESS_KEY_ID=your_key_here
npx supabase secrets set AWS_SECRET_ACCESS_KEY=your_secret_here
```

### 4. Update the Edge Function Code

In `supabase/functions/send-order-emails/index.ts`, uncomment the email sending code for your chosen provider:

**For Resend:**
```typescript
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const emailResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'orders@yourstore.com', // Update with your verified domain
    to: emailItem.recipient_email,
    subject: subject,
    html: emailHTML
  })
})

if (!emailResponse.ok) {
  const errorData = await emailResponse.text()
  throw new Error(`Email service error: ${errorData}`)
}
```

**For SendGrid:**
```typescript
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!
const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sendgridApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: emailItem.recipient_email }]
    }],
    from: { email: 'orders@yourstore.com' }, // Update with your verified email
    subject: subject,
    content: [{ type: 'text/html', value: emailHTML }]
  })
})

if (!emailResponse.ok) {
  const errorData = await emailResponse.text()
  throw new Error(`Email service error: ${errorData}`)
}
```

### 5. Deploy the Edge Function

```bash
npx supabase functions deploy send-order-emails
```

### 6. Set Up Automated Processing (Optional but Recommended)

You can trigger this function in two ways:

**Option A: Cron Job (Recommended)**

Use Supabase's built-in cron jobs to run the function every few minutes:

1. Go to your Supabase Dashboard → Database → Cron Jobs
2. Create a new cron job:
   - Name: "Process Order Emails"
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - SQL: 
     ```sql
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-order-emails',
       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
     );
     ```

**Option B: Manual Trigger**

You can manually trigger the function when needed:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-order-emails' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Testing

### Test Order Confirmation Email

1. Create a new order in your application
2. Check the `order_emails_queue` table:
   ```sql
   SELECT * FROM order_emails_queue WHERE email_type = 'order_confirmation' ORDER BY created_at DESC LIMIT 5;
   ```
3. Trigger the Edge Function (manually or wait for cron)
4. Verify the email was sent (check `sent_at` timestamp)

### Test Shipping Notification

1. Update an existing order status to 'shipped':
   ```sql
   UPDATE orders SET status = 'shipped' WHERE id = 'some-order-id';
   ```
2. Check the queue for shipping emails
3. Trigger the function

### Test Delivery Confirmation

1. Update an order status to 'delivered':
   ```sql
   UPDATE orders SET status = 'delivered' WHERE id = 'some-order-id';
   ```
2. Check the queue
3. Trigger the function

## Email Templates

The function includes three beautifully designed HTML email templates:

### 1. Order Confirmation
- Sent when: New order is created
- Includes: Order number, items, pricing breakdown, seller info, payment status
- Color scheme: Purple gradient

### 2. Shipping Notification
- Sent when: Order status changes to "shipped"
- Includes: Order number, tracking info, delivery mode, seller contact
- Color scheme: Blue gradient

### 3. Delivery Confirmation
- Sent when: Order status changes to "delivered"
- Includes: Order summary, call-to-action for review, thank you message
- Color scheme: Green gradient

## Customization

### Modify Email Templates

Edit the template functions in `index.ts`:
- `getOrderConfirmationEmailHTML()`
- `getOrderShippedEmailHTML()`
- `getOrderDeliveredEmailHTML()`

### Add Order Items Details

To include individual products in the email, modify the trigger functions in the migration file to include order items in the `order_data` JSON.

### Change Sender Email

Update the `from` field in your email service call to match your verified domain.

## Troubleshooting

### Emails Not Being Sent

1. Check the queue for pending emails:
   ```sql
   SELECT * FROM order_emails_queue WHERE sent_at IS NULL;
   ```

2. Check for errors:
   ```sql
   SELECT * FROM order_emails_queue WHERE error_message IS NOT NULL;
   ```

3. Check Edge Function logs:
   ```bash
   npx supabase functions logs send-order-emails
   ```

### Email Service Errors

- **Resend**: Ensure your sender domain is verified
- **SendGrid**: Check your API key has send permissions
- **General**: Verify the API key is correctly set as a secret

### Triggers Not Firing

1. Verify triggers exist:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%order%';
   ```

2. Check if functions exist:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE '%queue_order%';
   ```

## Security Notes

- RLS policies ensure only admins can view the email queue
- Emails are queued with user data from the database (not user input)
- Service role key is required to access queue and send emails
- Failed emails are logged with error messages for debugging

## Performance

- Function processes up to 10 emails per invocation
- Failed emails are marked and can be retried
- Successfully sent emails are timestamped
- Queue automatically grows and shrinks based on order volume

## Cost Considerations

- **Resend Free Tier**: 3,000 emails/month = ~100 orders/day (3 emails per order)
- **SendGrid Free Tier**: 100 emails/day = ~33 orders/day
- **Edge Function**: Free for first 500K requests, then $2 per 1M requests

For most small to medium businesses, the free tiers are sufficient.
