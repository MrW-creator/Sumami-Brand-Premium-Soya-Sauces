
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
  // Handle CORS
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log("------------------------------------------------------------------");
    console.log("🚀 Yoco Checkout Function Triggered");

    // 1. Parse Body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Invalid JSON body");
    }

    const { items, successUrl, cancelUrl } = body;
    console.log(`📦 Items: ${items?.length}, SuccessURL: ${successUrl}`);

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid cart items provided.");
    }

    // 2. Init Supabase (Service Role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
       console.error("❌ Missing Supabase Env Vars");
       throw new Error("Server Misconfiguration: Missing DB Keys");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 3. Get Store Settings
    // Use maybeSingle() to avoid error if table is empty
    const { data: settings, error: dbError } = await supabaseClient
        .from('store_settings')
        .select('*')
        .maybeSingle();

    if (dbError) {
        console.error("❌ DB Error:", dbError);
        throw new Error(`Database Error: ${dbError.message}`);
    }

    if (!settings) {
        console.error("❌ Settings Table Empty");
        // Fallback or Error? Error is safer.
        throw new Error("Store Settings not found. Please run the SQL setup script.");
    }

    const isLive = settings.is_live_mode;
    const secretKey = isLive ? settings.yoco_live_key : settings.yoco_test_key;

    console.log(`🔐 Mode: ${isLive ? 'LIVE' : 'TEST'}`);
    
    if (!secretKey || !secretKey.trim().startsWith('sk_')) {
        console.error("❌ Invalid Secret Key format");
        throw new Error(`Invalid Payment Key. Check Admin Dashboard settings.`);
    }

    // 4. Calculate Total
    const amountInCents = items.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    console.log(`💰 Total Cents: ${amountInCents}`);

    // 5. Call Yoco API
    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey.trim()}`
      },
      body: JSON.stringify({
        amount: Math.ceil(amountInCents),
        currency: 'ZAR',
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        metadata: {
            source: 'Sumami Web Funnel',
            itemCount: items.length
        }
      })
    });

    const yocoData = await yocoResponse.json();

    if (!yocoResponse.ok) {
        console.error("❌ Yoco API Error:", yocoData);
        throw new Error(yocoData.message || "Yoco rejected the checkout creation.");
    }

    console.log("✅ Checkout Created:", yocoData.redirectUrl);

    return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("❌ Critical Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400, // Return 400 so client can read JSON message
    });
  }
});
