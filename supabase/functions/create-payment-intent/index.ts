import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const { amount, currency = 'inr', metadata, savePaymentMethod, customerId } = await req.json()

    const createParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to smallest currency unit (paise for INR)
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    }

    // If customer wants to save payment method, attach customer
    if (savePaymentMethod && customerId) {
      createParams.customer = customerId
      createParams.setup_future_usage = 'off_session'
    }

    const paymentIntent = await stripe.paymentIntents.create(createParams)

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
