
// ==============================================================================
// SHIPPING EMAIL FUNCTION
// Deploy: npx supabase functions deploy resend-shipping-email --no-verify-jwt
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

interface RequestBody {
  customerName: string;
  customerEmail: string;
  orderId: string;
  trackingNumber: string;
  courierName: string;
  trackingUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!MAILTRAP_API_TOKEN) {
      throw new Error("Configuration Error: MAILTRAP_API_TOKEN is missing from Supabase Secrets.");
    }

    const { customerName, customerEmail, orderId, trackingNumber, courierName, trackingUrl } = await req.json() as RequestBody;

    // Detect if this is a collection order
    const isCollection = courierName === 'Self Collection';

    // Dynamic Content based on Fulfillment Type
    const headerTitle = isCollection ? 'Ready for Collection! 🛍️' : 'Order Shipped! 🚚';
    
    const mainMessage = isCollection 
        ? `<p>Hi ${customerName},</p><p>Great news! Your order <strong>#${orderId}</strong> has been packed and is ready for collection.</p>`
        : `<p>Hi ${customerName},</p><p>Great news! Your order <strong>#${orderId}</strong> has been packed and handed over to the courier.</p>`;

    const detailsSection = isCollection
        ? `<div class="card">
              <h3 style="margin-top:0; color: #065f46;">Collection Details</h3>
              <p style="margin: 5px 0;"><strong>Status:</strong> Ready for Pickup</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> Amanzimtoti, KZN</p>
           </div>
           <p>Please contact us on WhatsApp to arrange a specific pickup time if you haven't already.</p>
           <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
              <a href="https://wa.me/27662434867" class="button">Contact for Pickup</a>
           </div>`
        : `<div class="card">
              <h3 style="margin-top:0; color: #065f46;">Tracking Details</h3>
              <p style="margin: 5px 0;"><strong>Courier:</strong> ${courierName}</p>
              <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
            </div>
            <p>You can track the progress of your delivery by clicking the button below:</p>
            <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
              <a href="${trackingUrl}" class="button">Track My Package</a>
            </div>
            <p style="font-size: 14px; color: #666;">Note: Tracking events may take a few hours to update on the courier's website.</p>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; background-color: #f9f9f9; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #064e3b; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background: #eee; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">${headerTitle}</h1>
          </div>
          <div class="content">
            ${mainMessage}
            ${detailsSection}
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
            name: "Sumami Shipping"
        },
        to: [{ email: customerEmail, name: customerName }],
        subject: isCollection ? `Order #${orderId} is Ready for Collection!` : `Shipping Update: Order #${orderId} is on the way!`,
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
