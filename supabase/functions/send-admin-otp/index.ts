
// ==============================================================================
// ADMIN OTP EMAIL FUNCTION
// Deploy this via CLI: supabase functions deploy send-admin-otp
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Uses the API Token you provided as a fallback if the secret is not set in Supabase
const MAILTRAP_API_TOKEN = Deno.env.get("MAILTRAP_API_TOKEN") || "e266ed83f6fbb7273bc54e12755a2a61";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  code: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json() as RequestBody;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; background-color: #f3f4f6; padding: 40px; text-align: center; }
          .container { max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .code { font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #d97706; margin: 20px 0; background: #fffbeb; padding: 15px; border-radius: 8px; border: 2px dashed #fcd34d; }
          .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color: #1f2937; margin-top: 0;">Admin Access Request</h2>
          <p style="color: #4b5563;">Use the verification code below to access your store dashboard.</p>
          
          <div class="code">${code}</div>
          
          <p style="color: #4b5563; font-size: 14px;">If you did not request this, please ignore this email.</p>
          
          <div class="footer">
            Sumami Brand Security
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILTRAP_API_TOKEN}`,
      },
      body: JSON.stringify({
        from: {
            email: "security@soyasauce.co.za",
            name: "Sumami Security"
        },
        to: [{ email: email }],
        subject: `Admin Login Code: ${code}`,
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
