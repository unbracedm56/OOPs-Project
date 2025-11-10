import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email templates based on user role
const getEmailTemplate = (name: string, role: string) => {
  const templates = {
    customer: {
      subject: "Welcome to Our Marketplace! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome, ${name}! 🛍️</h1>
          <p>Thank you for joining our marketplace community!</p>
          <p>As a customer, you can:</p>
          <ul>
            <li>Browse products from local retailers and wholesalers</li>
            <li>Add items to your cart and place orders</li>
            <li>Track your orders in real-time</li>
            <li>Leave reviews for products you've purchased</li>
          </ul>
          <p>Start shopping today and discover amazing local products!</p>
          <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/dashboard" 
             style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Go to Dashboard
          </a>
          <p style="margin-top: 32px; color: #666; font-size: 14px;">
            Need help? Contact our support team anytime.
          </p>
        </div>
      `,
    },
    retailer: {
      subject: "Welcome to Our Retailer Community! 🏪",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome, ${name}! 🏪</h1>
          <p>Congratulations on joining as a Retailer!</p>
          <p>You now have access to powerful tools to grow your business:</p>
          <ul>
            <li>Set up your store and showcase your products</li>
            <li>Manage your inventory in real-time</li>
            <li>Process orders from local customers</li>
            <li>Track sales and analytics</li>
          </ul>
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Complete your store profile</li>
            <li>Add your first products</li>
            <li>Set your delivery radius</li>
          </ol>
          <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/retailer/dashboard" 
             style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Set Up Your Store
          </a>
          <p style="margin-top: 32px; color: #666; font-size: 14px;">
            Questions? Our support team is here to help you succeed.
          </p>
        </div>
      `,
    },
    wholesaler: {
      subject: "Welcome to Our Wholesaler Network! 📦",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome, ${name}! 📦</h1>
          <p>Thank you for joining as a Wholesaler!</p>
          <p>Your wholesale business is now connected to retailers across the region:</p>
          <ul>
            <li>List your bulk products and pricing</li>
            <li>Manage wholesale inventory</li>
            <li>Receive orders from retailers</li>
            <li>Set minimum order quantities</li>
          </ul>
          <p><strong>Getting Started:</strong></p>
          <ol>
            <li>Create your wholesaler profile</li>
            <li>Import or add your product catalog</li>
            <li>Configure your delivery options</li>
          </ol>
          <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/wholesaler/dashboard" 
             style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Access Your Dashboard
          </a>
          <p style="margin-top: 32px; color: #666; font-size: 14px;">
            Need assistance? We're here to support your wholesale business.
          </p>
        </div>
      `,
    },
  };

  return templates[role as keyof typeof templates] || templates.customer;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending welcome emails from the queue
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('welcome_emails_queue')
      .select('*')
      .is('sent_at', null)
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending welcome emails', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    
    // Process each pending email
    for (const emailJob of pendingEmails) {
      try {
        const template = getEmailTemplate(emailJob.full_name || 'there', emailJob.role || 'customer');
        
        // NOTE: You need to configure an actual email service here
        // Options:
        // 1. Resend (https://resend.com) - Recommended, easy setup
        // 2. SendGrid
        // 3. AWS SES
        // 4. Postmark
        
        // Example with Resend (you'll need to add RESEND_API_KEY to secrets):
        /*
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Marketplace <noreply@yourdomain.com>',
            to: emailJob.email,
            subject: template.subject,
            html: template.html,
          }),
        });
        
        if (!resendResponse.ok) {
          throw new Error(`Failed to send email: ${await resendResponse.text()}`);
        }
        */
        
        // For now, just mark as sent (simulated)
        console.log(`Would send email to ${emailJob.email}: ${template.subject}`);
        
        // Update the queue to mark as sent
        const { error: updateError } = await supabaseClient
          .from('welcome_emails_queue')
          .update({ 
            sent_at: new Date().toISOString(),
          })
          .eq('id', emailJob.id);

        if (updateError) throw updateError;

        results.push({ 
          success: true, 
          email: emailJob.email,
          message: 'Email sent successfully (simulated)' 
        });

      } catch (emailError) {
        // Log the error in the queue
        await supabaseClient
          .from('welcome_emails_queue')
          .update({ 
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error'
          })
          .eq('id', emailJob.id);

        results.push({ 
          success: false, 
          email: emailJob.email, 
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} welcome emails`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
