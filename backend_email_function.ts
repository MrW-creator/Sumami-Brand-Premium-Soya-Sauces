
// ==============================================================================
// SUPABASE EDGE FUNCTION CODE
// ==============================================================================
// 1. Create a new file in your Supabase project: supabase/functions/resend-order-email/index.ts
// 2. Paste this entire file content into it.
// 3. Ensure you have added MAILTRAP_API_TOKEN to your Supabase Secrets.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Add declaration for Deno global to fix TypeScript error in non-Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// SECURITY UPDATE: Removed hardcoded fallback.
// You MUST set MAILTRAP_API_TOKEN in Supabase Secrets.
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
  orderTotal: number;
  items: OrderItem[];
  orderId: string;
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

    const { customerName, customerEmail, orderTotal, items, orderId } = await req.json() as RequestBody;

    // Generate Invoice HTML
    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; color: #333;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 12px; color: #777;">${item.variant} ${item.is_bonus ? '(FREE GIFT)' : ''}</span>
        </td>
        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">R ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; background-color: #f9f9f9; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #111; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .footer { background: #eee; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">Order Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Thank you for your order! We are getting your sauces ready for shipment.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background: #f3f3f3;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Total Paid:</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">R ${orderTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://wa.me/27662434867" class="button">Track Order on WhatsApp</a>
            </div>
          </div>
          <div class="footer">
            <p>Sumami Brand &bull; Amanzimtoti, KZN &bull; 066 243 4867</p>
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
        subject: `Order Confirmation #${orderId}`,
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
