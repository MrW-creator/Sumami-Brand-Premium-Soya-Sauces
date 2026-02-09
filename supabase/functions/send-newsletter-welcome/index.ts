// ==============================================================================
// NEWSLETTER WELCOME EMAIL FUNCTION
// Deploy: npx supabase functions deploy send-newsletter-welcome --no-verify-jwt
// ==============================================================================
// This function sends a welcome email to new newsletter subscribers
// with a link to download the free cookbook
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const MAILTRAP_API_TOKEN = Deno.env.get("MAILTRAP_API_TOKEN");
const COOKBOOK_URL = "https://lnzloecnqcxknozokflr.supabase.co/storage/v1/object/public/ebook/sumami-cookbook.pdf";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
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

    const { email } = await req.json() as RequestBody;

    if (!email) {
      throw new Error("Email is required");
    }

    // Generate Welcome Email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            font-size: 32px;
            font-weight: 900;
            margin: 0 0 10px 0;
          }
          .header p {
            color: #fef3c7;
            font-size: 16px;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #111827;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 20px 0;
          }
          .content p {
            color: #4b5563;
            font-size: 16px;
            margin: 0 0 20px 0;
          }
          .cookbook-section {
            background: #fef3c7;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .cookbook-section h3 {
            color: #92400e;
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 10px 0;
          }
          .cookbook-section p {
            color: #78350f;
            font-size: 14px;
            margin: 0 0 20px 0;
          }
          .download-button {
            display: inline-block;
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(217, 119, 6, 0.3);
          }
          .benefits {
            background: #f9fafb;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
          }
          .benefits h3 {
            color: #111827;
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 15px 0;
          }
          .benefits ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .benefits li {
            color: #4b5563;
            font-size: 15px;
            padding: 8px 0;
            padding-left: 30px;
            position: relative;
          }
          .benefits li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: 900;
            font-size: 18px;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 13px;
            margin: 5px 0;
          }
          .footer a {
            color: #d97706;
            text-decoration: none;
          }
          .social-links {
            margin: 20px 0;
          }
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #6b7280;
            text-decoration: none;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <!-- Header -->
          <div class="header">
            <h1>Welcome to Sumami! 🎉</h1>
            <p>Your free cookbook is waiting...</p>
          </div>

          <!-- Main Content -->
          <div class="content">
            <h2>Thanks for joining our community!</h2>
            <p>
              We're thrilled to have you on board. You're now part of a growing community of food lovers
              who appreciate authentic, handcrafted flavours.
            </p>

            <!-- Cookbook Download Section -->
            <div class="cookbook-section">
              <h3>📖 Your Free Cookbook</h3>
              <p>
                Unlock 25+ delicious recipes featuring our premium soya sauces.
                From quick weeknight meals to impressive dinner party dishes.
              </p>
              <a href="${COOKBOOK_URL}" class="download-button">
                Download Cookbook Now
              </a>
            </div>

            <!-- Benefits Section -->
            <div class="benefits">
              <h3>What you'll get as a subscriber:</h3>
              <ul>
                <li>Exclusive recipes and cooking tips</li>
                <li>Early access to new products and flavours</li>
                <li>Special subscriber-only discounts</li>
                <li>Behind-the-scenes content from our kitchen</li>
                <li>Monthly flavour pairing guides</li>
              </ul>
            </div>

            <p>
              <strong>Ready to order?</strong> Head over to our shop and use your new recipes to
              transform your cooking. We offer free shipping on all orders!
            </p>

            <p style="text-align: center; margin-top: 30px;">
              <a href="https://soyasauce.co.za" style="color: #d97706; font-weight: 600; text-decoration: none;">
                Visit Our Shop →
              </a>
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="social-links">
              <a href="https://wa.me/27662434867">WhatsApp</a> •
              <a href="mailto:info@soyasauce.co.za">Email Us</a>
            </div>
            <p><strong>Sumami Brand</strong></p>
            <p>Amanzimtoti, KwaZulu-Natal, South Africa</p>
            <p>066 243 4867</p>
            <p style="margin-top: 20px; font-size: 11px;">
              You're receiving this email because you subscribed to our newsletter at soyasauce.co.za.
              <br/>
              <a href="https://soyasauce.co.za/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a>
            </p>
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
          email: "info@soyasauce.co.za",
          name: "Sumami Brand"
        },
        to: [{ email: email }],
        subject: "Welcome to Sumami! 🎉 Your Free Cookbook is Here",
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true, message: "Welcome email sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Newsletter welcome email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
