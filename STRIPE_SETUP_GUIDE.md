# Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for your application.

## Overview

The application now uses Stripe for card payments while keeping Cash on Delivery (COD) unchanged. Card details are securely stored by Stripe and never touch your servers.

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now" or "Sign in"
3. Complete the registration process
4. Verify your email address

## Step 2: Get Your API Keys

1. Log in to your Stripe Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_...` for test mode)
   - **Secret key** (starts with `sk_test_...` for test mode)

⚠️ **Important**: Never commit your secret key to version control or expose it in client-side code!

## Step 3: Configure Environment Variables

### Frontend (.env.local)

Update your `.env.local` file with your Stripe publishable key:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
```

### Backend (Supabase Edge Functions)

Set your Stripe secret key in Supabase:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
```

## Step 4: Enable Payment Methods in Stripe

1. In your Stripe Dashboard, go to "Settings" → "Payment methods"
2. Enable the following payment methods:
   - ✅ Cards (Visa, Mastercard, American Express, etc.)
   - ✅ Digital wallets (Apple Pay, Google Pay) - Optional but recommended

## Step 5: Apply Database Migration

Run the migration to add Stripe-related fields to your database:

```bash
npx supabase db push
```

This will:
- Add `stripe_customer_id` to the `profiles` table
- Add `payment_method_id` to the `orders` table
- Update `saved_payment_methods` table with Stripe fields
- Remove insecure card storage fields

## Step 6: Deploy Supabase Edge Functions

Deploy the Stripe-related Edge Functions:

```bash
# Deploy the payment intent creation function
npx supabase functions deploy create-payment-intent

# Deploy the customer management function
npx supabase functions deploy manage-stripe-customer
```

Verify deployment:
```bash
npx supabase functions list
```

## Step 7: Test the Integration

### Test Mode Setup

1. Make sure you're using test API keys (they start with `pk_test_` and `sk_test_`)
2. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC

### Testing Workflow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to checkout page
3. Select "Credit/Debit Card" as payment method
4. Check "Save this card for future purchases" (optional)
5. Enter test card details
6. Complete the payment
7. Verify order creation in your database

### Verify in Stripe Dashboard

1. Go to Stripe Dashboard → Payments
2. You should see your test payment listed
3. Check Customers section to see saved payment methods

## Step 8: Configure Webhooks (Production Only)

Webhooks allow Stripe to notify your application about payment events.

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_method.attached`
   - `payment_method.detached`
5. Copy the webhook signing secret (starts with `whsec_...`)
6. Add it to your Supabase secrets:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

⚠️ **Note**: Webhooks are optional for development but required for production.

## Step 9: Go Live

When you're ready to accept real payments:

1. Complete Stripe account verification in the Dashboard
2. Switch to live API keys:
   - Replace `pk_test_...` with `pk_live_...` in `.env.local`
   - Replace `sk_test_...` with `sk_live_...` in Supabase secrets
3. Test with a real card (small amount)
4. Monitor your Stripe Dashboard for payments

## Payment Flow Architecture

```
Customer Checkout
    ↓
Select "Card" payment
    ↓
StripePaymentModal opens
    ↓
Creates/retrieves Stripe Customer ID
    ↓
Creates Payment Intent (via Edge Function)
    ↓
Stripe Elements (secure card form)
    ↓
Customer enters card details
    ↓
Stripe validates & processes
    ↓
Success → Create order with payment_method_id
    ↓
Order confirmed
```

## Security Best Practices

✅ **DO:**
- Use HTTPS in production
- Keep secret keys in environment variables
- Use Stripe's official SDKs
- Validate webhook signatures
- Use Stripe Customer IDs for saved payment methods

❌ **DON'T:**
- Never store raw card numbers
- Never commit API keys to Git
- Never expose secret keys in client code
- Never skip webhook signature verification in production

## Troubleshooting

### Error: "No such customer"
- Ensure customer is created before payment intent
- Check `stripe_customer_id` is saved in profiles table

### Error: "Invalid API key"
- Verify you're using the correct key (test vs live)
- Check the key is set correctly in environment variables

### Payment succeeds but order not created
- Check Edge Function logs: `npx supabase functions logs create-payment-intent`
- Verify database RLS policies allow order insertion
- Check processOrder function for errors

### Card not being saved
- Ensure `savePaymentMethod` is true
- Check `setup_future_usage: 'off_session'` in payment intent
- Verify manage-stripe-customer function is deployed

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)

## Next Steps

After completing this setup:

1. ✅ Test card payments in development
2. ✅ Test COD payments (should work unchanged)
3. ✅ Implement saved payment methods UI in Profile page
4. ✅ Integrate Stripe into retailer proxy orders
5. ✅ Set up webhook handling for production
6. ✅ Complete Stripe account verification for live mode

---

**Need Help?** Check the Stripe Dashboard's logs and your browser console for detailed error messages.
