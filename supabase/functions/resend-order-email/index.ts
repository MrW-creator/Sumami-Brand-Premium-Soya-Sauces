
// ==============================================================================
// ORDER CONFIRMATION EMAIL FUNCTION
// Deploy: npx supabase functions deploy resend-order-email --no-verify-jwt
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const MAILTRAP_API_TOKEN = Deno.env.get("MAILTRAP_API_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  variant: string;
  quantity: number;
  price: number;
  is_bonus?: boolean;
}

interface RequestBody {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  orderTotal: number;
  items: OrderItem[];
  orderId: string;
  orderDate?: string;
  // Business details for invoice
  companyName?: string;
  companyAddress?: string;
  invoiceFooterText?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!MAILTRAP_API_TOKEN) {
      throw new Error("Configuration Error: MAILTRAP_API_TOKEN is missing from Supabase Secrets.");
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      orderTotal,
      items,
      orderId,
      orderDate,
      companyName,
      companyAddress,
      invoiceFooterText
    } = await req.json() as RequestBody;

    // Generate Invoice HTML
    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px;">
          <div style="font-weight: 500; color: #1f2937; margin-bottom: 2px;">${item.name}</div>
          <div style="font-size: 11px; color: #6b7280;">${item.variant}${item.is_bonus ? ' (Bonus Item)' : ''}</div>
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #4b5563;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; color: #4b5563;">${item.price === 0 ? 'Free' : `R ${item.price.toFixed(2)}`}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #111827;">${item.price === 0 ? 'R 0.00' : `R ${(item.price * item.quantity).toFixed(2)}`}</td>
      </tr>
    `).join('');

    const businessName = companyName || 'Sumami Brand';
    const businessAddress = companyAddress || 'Amanzimtoti, KwaZulu-Natal\nSouth Africa';
    const footerText = invoiceFooterText || 'Thank you for your business!';
    const invoiceDate = orderDate || new Date().toLocaleDateString('en-ZA');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
          }
          .email-wrapper {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .invoice-container {
            padding: 40px;
            background: white;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 30px;
            border-bottom: 3px solid #111827;
            margin-bottom: 30px;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: 900;
            color: #111827;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
          }
          .invoice-number {
            font-size: 13px;
            color: #6b7280;
            font-weight: 600;
            margin: 0;
          }
          .business-info {
            text-align: right;
            font-size: 13px;
            color: #6b7280;
            line-height: 1.6;
          }
          .business-name {
            font-weight: 700;
            color: #111827;
            font-size: 15px;
            margin-bottom: 4px;
          }
          .section-title {
            font-size: 10px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
          }
          .customer-info {
            margin-bottom: 30px;
          }
          .customer-name {
            font-weight: 700;
            color: #111827;
            font-size: 15px;
            margin-bottom: 4px;
          }
          .customer-details {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.6;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .invoice-table thead th {
            text-align: left;
            padding: 12px 8px;
            font-size: 12px;
            font-weight: 700;
            color: #111827;
            border-bottom: 2px solid #111827;
          }
          .invoice-table thead th:nth-child(2),
          .invoice-table thead th:nth-child(3),
          .invoice-table thead th:nth-child(4) {
            text-align: right;
          }
          .total-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          .total-box {
            width: 280px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
            color: #4b5563;
          }
          .total-final {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 20px;
            font-weight: 900;
            color: #111827;
            border-top: 2px solid #111827;
            margin-top: 8px;
          }
          .action-button {
            display: inline-block;
            background-color: #d97706;
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
            font-size: 14px;
            text-align: center;
            margin: 30px 0;
          }
          .footer-section {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
          }
          .thank-you {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            color: #4b5563;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="invoice-container">
            <!-- Invoice Header -->
            <div class="invoice-header">
              <div>
                <h1 class="invoice-title">INVOICE</h1>
                <p class="invoice-number">#${orderId}</p>
                <div style="margin-top: 16px; font-size: 13px; color: #6b7280;">
                  <div><strong style="color: #374151;">Date:</strong> ${invoiceDate}</div>
                  <div><strong style="color: #374151;">Status:</strong> PAID</div>
                </div>
              </div>
              <div class="business-info">
                <div class="business-name">${businessName}</div>
                <div style="white-space: pre-line;">${businessAddress}</div>
                <div style="margin-top: 8px; font-weight: 600;">066 243 4867</div>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="customer-info">
              <div class="section-title">Bill To</div>
              <div class="customer-name">${customerName}</div>
              <div class="customer-details">
                ${customerEmail}<br/>
                ${customerPhone ? customerPhone + '<br/>' : ''}
                ${customerAddress ? customerAddress : ''}
              </div>
            </div>

            <!-- Items Table -->
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total Section -->
            <div class="total-section">
              <div class="total-box">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>R ${orderTotal.toFixed(2)}</span>
                </div>
                <div class="total-final">
                  <span>Total</span>
                  <span>R ${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="https://wa.me/27662434867" class="action-button">Track Order on WhatsApp</a>
            </div>

            <!-- Footer Text -->
            <div class="footer-section">
              ${footerText}
            </div>
          </div>

          <!-- Thank You Section -->
          <div class="thank-you">
            Questions? Contact us at <strong>orders@soyasauce.co.za</strong> or <strong>066 243 4867</strong>
          </div>
        </div>
      </body>
      </html>
    `;

    // MAILTRAP API CALL
    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILTRAP_API_TOKEN}`,
      },
      body: JSON.stringify({
        from: {
            email: "orders@soyasauce.co.za",
            name: "Sumami Sales"
        },
        to: [{ email: customerEmail, name: customerName }],
        subject: `Invoice & Order Confirmation #${orderId}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(JSON.stringify(data));
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Mailtrap Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
