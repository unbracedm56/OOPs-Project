import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface InvoiceGeneratorProps {
  order: any;
}

export const InvoiceGenerator = ({ order }: InvoiceGeneratorProps) => {
  const generateInvoice = () => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.order_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .company-info h1 {
            margin: 0;
            color: #333;
            font-size: 28px;
          }
          .company-info p {
            margin: 5px 0;
            color: #666;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-info h2 {
            margin: 0;
            color: #666;
            font-size: 24px;
          }
          .invoice-info p {
            margin: 5px 0;
          }
          .addresses {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
          }
          .address-box {
            width: 48%;
          }
          .address-box h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 14px;
            text-transform: uppercase;
          }
          .address-box p {
            margin: 3px 0;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #ddd;
            font-weight: 600;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          .text-right {
            text-align: right;
          }
          .summary {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .summary-total {
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            font-size: 18px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-paid {
            background: #dcfce7;
            color: #166534;
          }
          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }
          .status-cod {
            background: #e0e7ff;
            color: #3730a3;
          }
          @media print {
            body {
              padding: 20px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>Blitz Bazaar</h1>
            <p>Lightning deals, lasting thrills</p>
            <p>support@blitzbazaar.com</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Order #:</strong> ${order.order_number}</p>
            <p><strong>Date:</strong> ${new Date(order.placed_at).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
            <p><span class="status-badge status-${order.payment_status}">${order.payment_status.toUpperCase()}</span></p>
          </div>
        </div>

        <div class="addresses">
          <div class="address-box">
            <h3>Bill To:</h3>
            <p><strong>Customer</strong></p>
            ${order.delivery_address ? `
              <p>${order.delivery_address.line1}</p>
              ${order.delivery_address.line2 ? `<p>${order.delivery_address.line2}</p>` : ''}
              <p>${order.delivery_address.city}, ${order.delivery_address.state}</p>
              <p>${order.delivery_address.pincode}</p>
            ` : order.is_store_pickup ? `
              <p><strong>Store Pickup Order</strong></p>
              <p>Pickup Date: ${order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              }) : 'TBD'}</p>
            ` : ''}
          </div>
          <div class="address-box">
            <h3>Ship From:</h3>
            <p><strong>${order.stores?.name || 'Store'}</strong></p>
            ${order.stores?.phone ? `<p>Phone: ${order.stores.phone}</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items?.map((item: any) => `
              <tr>
                <td>${item.inventory?.products?.name || 'Product'}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">₹${item.unit_price.toFixed(2)}</td>
                <td class="text-right">₹${item.line_total.toFixed(2)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₹${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>${order.is_store_pickup ? 'Delivery (Store Pickup):' : 'Delivery:'}</span>
            <span>${order.is_store_pickup ? 'Free' : `₹${order.shipping_fee.toFixed(2)}`}</span>
          </div>
          ${order.tax > 0 ? `
            <div class="summary-row">
              <span>Tax:</span>
              <span>₹${order.tax.toFixed(2)}</span>
            </div>
          ` : ''}
          ${order.discount > 0 ? `
            <div class="summary-row">
              <span>Discount:</span>
              <span>-₹${order.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="summary-row summary-total">
            <span>Total:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Blitz Bazaar!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>For any queries, please contact us at support@blitzbazaar.com</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 30px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            Print Invoice
          </button>
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateInvoice}
      className="gap-2"
    >
      <FileText className="h-4 w-4" />
      Generate Invoice
    </Button>
  );
};
