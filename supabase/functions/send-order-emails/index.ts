import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderEmailQueueItem {
  id: string
  order_id: string
  user_id: string
  email_type: 'order_confirmation' | 'order_shipped' | 'order_delivered'
  recipient_email: string
  order_data: {
    order_number: string
    customer_name: string
    total: number
    subtotal?: number
    tax?: number
    shipping_fee?: number
    status: string
    payment_status?: string
    delivery_mode: string
    placed_at: string
    store: {
      store_name: string
      store_phone: string
    }
  }
}

// Email templates
function getOrderConfirmationEmailHTML(data: OrderEmailQueueItem['order_data']): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .order-number { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: 600; color: #6b7280; }
    .detail-value { color: #111827; }
    .total-row { font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #667eea; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Order Confirmed!</h1>
    <p>Thank you for your purchase</p>
  </div>
  
  <div class="content">
    <p>Hi ${data.customer_name},</p>
    
    <p>Great news! We've received your order and it's being processed. Here are your order details:</p>
    
    <div class="order-box">
      <div class="order-number">Order #${data.order_number}</div>
      <span class="status-badge status-${data.status === 'pending' ? 'pending' : 'confirmed'}">
        ${data.status.toUpperCase()}
      </span>
      
      <div style="margin-top: 20px;">
        <div class="detail-row">
          <span class="detail-label">Order Date:</span>
          <span class="detail-value">${new Date(data.placed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Delivery Mode:</span>
          <span class="detail-value">${data.delivery_mode.replace('_', ' ').toUpperCase()}</span>
        </div>
        
        ${data.subtotal ? `
        <div class="detail-row">
          <span class="detail-label">Subtotal:</span>
          <span class="detail-value">₹${data.subtotal.toFixed(2)}</span>
        </div>
        ` : ''}
        
        ${data.tax ? `
        <div class="detail-row">
          <span class="detail-label">Tax:</span>
          <span class="detail-value">₹${data.tax.toFixed(2)}</span>
        </div>
        ` : ''}
        
        ${data.shipping_fee ? `
        <div class="detail-row">
          <span class="detail-label">Shipping:</span>
          <span class="detail-value">₹${data.shipping_fee.toFixed(2)}</span>
        </div>
        ` : ''}
        
        <div class="detail-row total-row">
          <span class="detail-label">Total:</span>
          <span class="detail-value">₹${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
    
    <div class="order-box">
      <h3 style="margin-top: 0; color: #667eea;">📦 Seller Information</h3>
      <p><strong>${data.store.store_name}</strong></p>
      <p>📞 ${data.store.store_phone}</p>
    </div>
    
    <p style="margin-top: 30px;">We'll send you another email when your order ships. You can track your order status anytime from your account dashboard.</p>
    
    <p>If you have any questions, feel free to contact the seller or our support team.</p>
    
    <p>Thank you for shopping with us!</p>
  </div>
  
  <div class="footer">
    <p>This is an automated email. Please do not reply directly to this message.</p>
    <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
  </div>
</body>
</html>
  `
}

function getOrderShippedEmailHTML(data: OrderEmailQueueItem['order_data']): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .order-number { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
    .shipping-icon { font-size: 60px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚚 Your Order is on the Way!</h1>
    <p>Order has been shipped</p>
  </div>
  
  <div class="content">
    <p>Hi ${data.customer_name},</p>
    
    <div class="shipping-icon">📦➡️🚚</div>
    
    <p style="text-align: center; font-size: 18px; color: #3b82f6; font-weight: 600;">
      Great news! Your order has been shipped and is on its way to you.
    </p>
    
    <div class="order-box">
      <div class="order-number">Order #${data.order_number}</div>
      
      <div style="margin-top: 20px;">
        <p><strong>Order Total:</strong> ₹${data.total.toFixed(2)}</p>
        <p><strong>Delivery Mode:</strong> ${data.delivery_mode.replace('_', ' ').toUpperCase()}</p>
      </div>
    </div>
    
    <div class="order-box">
      <h3 style="margin-top: 0; color: #3b82f6;">📦 Seller Information</h3>
      <p><strong>${data.store.store_name}</strong></p>
      <p>📞 ${data.store.store_phone}</p>
    </div>
    
    <p style="margin-top: 30px;">You can track your delivery status from your account dashboard. We'll notify you again when your order is delivered.</p>
    
    <p>Thank you for your patience!</p>
  </div>
  
  <div class="footer">
    <p>This is an automated email. Please do not reply directly to this message.</p>
    <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
  </div>
</body>
</html>
  `
}

function getOrderDeliveredEmailHTML(data: OrderEmailQueueItem['order_data']): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .order-number { font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 10px; }
    .success-icon { font-size: 80px; text-align: center; margin: 20px 0; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Delivery Complete!</h1>
    <p>Your order has been delivered</p>
  </div>
  
  <div class="content">
    <p>Hi ${data.customer_name},</p>
    
    <div class="success-icon">🎉</div>
    
    <p style="text-align: center; font-size: 18px; color: #10b981; font-weight: 600;">
      Your order has been successfully delivered!
    </p>
    
    <div class="order-box">
      <div class="order-number">Order #${data.order_number}</div>
      
      <div style="margin-top: 20px;">
        <p><strong>Order Total:</strong> ₹${data.total.toFixed(2)}</p>
        <p><strong>Delivered via:</strong> ${data.delivery_mode.replace('_', ' ').toUpperCase()}</p>
      </div>
    </div>
    
    <div class="order-box">
      <h3 style="margin-top: 0; color: #10b981;">📦 Seller Information</h3>
      <p><strong>${data.store.store_name}</strong></p>
      <p>📞 ${data.store.store_phone}</p>
    </div>
    
    <p style="text-align: center; margin-top: 30px;">
      We hope you love your purchase! Your feedback helps us serve you better.
    </p>
    
    <div style="text-align: center;">
      <a href="#" class="cta-button">Leave a Review</a>
    </div>
    
    <p style="margin-top: 30px;">If you have any issues with your order, please don't hesitate to contact the seller or our support team.</p>
    
    <p>Thank you for shopping with us!</p>
  </div>
  
  <div class="footer">
    <p>This is an automated email. Please do not reply directly to this message.</p>
    <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('CUSTOM_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get pending emails from queue (limit 10 per run)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('order_emails_queue')
      .select('*')
      .is('sent_at', null)
      .is('error_message', null)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError)
      throw fetchError
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${pendingEmails.length} order emails...`)

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each email
    for (const emailItem of pendingEmails as OrderEmailQueueItem[]) {
      try {
        // Generate email HTML based on type
        let emailHTML: string
        let subject: string

        switch (emailItem.email_type) {
          case 'order_confirmation':
            emailHTML = getOrderConfirmationEmailHTML(emailItem.order_data)
            subject = `Order Confirmation - #${emailItem.order_data.order_number}`
            break
          case 'order_shipped':
            emailHTML = getOrderShippedEmailHTML(emailItem.order_data)
            subject = `Your Order Has Shipped - #${emailItem.order_data.order_number}`
            break
          case 'order_delivered':
            emailHTML = getOrderDeliveredEmailHTML(emailItem.order_data)
            subject = `Order Delivered - #${emailItem.order_data.order_number}`
            break
          default:
            throw new Error(`Unknown email type: ${emailItem.email_type}`)
        }

        console.log(`Sending ${emailItem.email_type} email to ${emailItem.recipient_email}...`)

        // Send email using Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        
        if (!resendApiKey) {
          console.error('❌ RESEND_API_KEY not configured!');
          throw new Error('RESEND_API_KEY not set. Configure it with: npx supabase secrets set RESEND_API_KEY=your_key');
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'OOPs Project Orders <orders@yourdomain.com>', // Replace yourdomain.com with your verified domain
            to: emailItem.recipient_email,
            subject: subject,
            html: emailHTML
          })
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text()
          console.error(`Resend API error:`, errorData);
          throw new Error(`Email service error: ${errorData}`)
        }

        const emailData = await emailResponse.json();
        console.log(`✅ Email sent to ${emailItem.recipient_email}, Resend ID: ${emailData.id}`);

        // Mark as sent
        const { error: updateError } = await supabase
          .from('order_emails_queue')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', emailItem.id)

        if (updateError) {
          console.error(`Error updating email ${emailItem.id}:`, updateError)
          results.errors.push(`Update failed for ${emailItem.id}`)
          results.failed++
        } else {
          results.sent++
        }

      } catch (emailError) {
        console.error(`Error sending email ${emailItem.id}:`, emailError)
        
        // Record error in database
        await supabase
          .from('order_emails_queue')
          .update({ 
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error'
          })
          .eq('id', emailItem.id)

        results.failed++
        results.errors.push(`${emailItem.id}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`)
      }
    }

    console.log(`Finished processing. Sent: ${results.sent}, Failed: ${results.failed}`)

    return new Response(
      JSON.stringify({
        message: 'Order email processing complete',
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-order-emails function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
