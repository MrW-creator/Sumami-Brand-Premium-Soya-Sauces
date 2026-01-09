
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 1. Handle CORS Preflight - IMMEDIATE RETURN
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("------------------------------------------------------------------");
    console.log("🚀 Yoco Checkout Function Triggered (v2.3)");

    // 2. Parse Body safely
    let body;
    try {
      const text = await req.text(); 
      if (!text) throw new Error("Empty body");
      body = JSON.parse(text);
    } catch (e) {
      console.error("Body Parse Error:", e);
      throw new Error("Invalid or empty JSON body received.");
    }

    const { items, successUrl, cancelUrl } = body;

    // 3. Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid cart items provided (Empty or not an array).");
    }

    // 4. Init Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
       console.error("Missing Environment Variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
       throw new Error("Server Misconfiguration: Missing DB Keys in Edge Function environment.");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 5. Get Settings
    // We select just the needed fields to be efficient
    const { data: settings, error: dbError } = await supabaseClient
        .from('store_settings')
        .select('*')
        .maybeSingle();

    if (dbError) {
        console.error("Database Error:", dbError);
        throw new Error(`Database Connection Failed: ${dbError.message}`);
    }
    
    if (!settings) {
        console.error("Settings Table Empty");
        throw new Error("Store Settings not initialized in database.");
    }

    const isLive = settings.is_live_mode;
    const secretKey = isLive ? settings.yoco_live_key : settings.yoco_test_key;

    console.log(`🔐 Mode: ${isLive ? 'LIVE' : 'TEST'}`);
    
    if (!secretKey || !secretKey.trim().startsWith('sk_')) {
        throw new Error(`Invalid Payment Key. Current Mode: ${isLive ? 'LIVE' : 'TEST'}. Key should start with 'sk_'.`);
    }

    // 6. Calculate Total
    const amountInCents = items.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    console.log(`💰 Processing: R${(amountInCents/100).toFixed(2)}`);

    // 7. Call Yoco
    // We log the URL we are hitting to be sure
    console.log("Connecting to Yoco API...");
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

    let yocoData;
    try {
        yocoData = await yocoResponse.json();
    } catch(e) {
        console.error("Yoco Non-JSON Response", e);
        throw new Error("Invalid response from Yoco API");
    }

    if (!yocoResponse.ok) {
        console.error("❌ Yoco API Rejected:", yocoData);
        // Extract meaningful error from Yoco
        const errorMessage = yocoData.message || (yocoData.code ? `Yoco Error: ${yocoData.code}` : "Payment Provider Rejected Request");
        throw new Error(errorMessage);
    }

    console.log("✅ Redirect generated:", yocoData.redirectUrl);

    // 8. Success Response
    return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("❌ Critical Execution Error:", error.message);
    // 9. Error Response - MUST HAVE CORS HEADERS
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
