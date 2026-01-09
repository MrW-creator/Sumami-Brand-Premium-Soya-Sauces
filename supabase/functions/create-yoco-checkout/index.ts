
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Expect items array instead of raw amount
    const { items, successUrl, cancelUrl } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Invalid cart items provided.");
    }

    // Calculate Total Amount in Cents server-side for security
    const amountInCents = items.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
    }, 0);

    // 1. Init Supabase Admin Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Get Keys from DB
    const { data: settings } = await supabaseClient.from('store_settings').select('*').single();
    if (!settings) throw new Error("Store settings not found.");

    // Select Key based on mode
    const isLive = settings.is_live_mode;
    const secretKey = isLive ? settings.yoco_live_key : settings.yoco_test_key;

    if (!secretKey || !secretKey.startsWith('sk_')) {
        throw new Error(`Configuration Error: Please update your Admin Settings with a valid Secret Key (sk_) for ${isLive ? 'Live' : 'Test'} mode.`);
    }

    // 3. Create Checkout Session with Yoco
    // API Docs: https://developer.yoco.com/online/checkout-api/creating-a-checkout
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`
      },
      body: JSON.stringify({
        amount: Math.ceil(amountInCents), // Ensure integer
        currency: 'ZAR',
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        metadata: {
            source: 'Sumami Web Funnel',
            itemCount: items.length
        }
      })
    });

    const yocoData = await response.json();

    if (!response.ok) {
        throw new Error(yocoData.message || "Failed to create Yoco Checkout session.");
    }

    // 4. Return the Redirect URL to the frontend
    return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Yoco Checkout Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
