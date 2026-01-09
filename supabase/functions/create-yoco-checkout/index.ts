
// Use explicit imports to avoid "Module not found" errors
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get(key: string): string | undefined;
  };
};

// Setup CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Use NATIVE Deno.serve (No external import required) for maximum stability
Deno.serve(async (req) => {
  // 1. Handle CORS Preflight - IMMEDIATE RETURN
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("------------------------------------------------------------------");
    console.log("🚀 Yoco Checkout Function Triggered (v3.0 - Native)");

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

    console.log(`📦 Received ${items.length} items.`);
    items.forEach((i: any, idx: number) => {
        console.log(`   Item ${idx+1}: ${i.name} | Qty: ${i.quantity} | Price: ${(i.price / 100).toFixed(2)}`);
    });

    // 4. Init Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
       console.error("Missing Environment Variables");
       throw new Error("Server Misconfiguration: Missing DB Keys.");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 5. Get Settings
    const { data: settings, error: dbError } = await supabaseClient
        .from('store_settings')
        .select('*')
        .maybeSingle();

    if (dbError || !settings) {
        console.error("Database Settings Error:", dbError);
        throw new Error("Could not retrieve Store Settings from Database.");
    }

    const isLive = settings.is_live_mode;
    const secretKey = isLive ? settings.yoco_live_key : settings.yoco_test_key;

    console.log(`🔐 Mode: ${isLive ? 'LIVE' : 'TEST'}`);
    
    // Check key format
    if (!secretKey || !secretKey.trim().startsWith('sk_')) {
        console.error(`Invalid Key Format. Key: ${secretKey?.substring(0, 5)}...`);
        throw new Error(`Invalid Payment Key configured for ${isLive ? 'LIVE' : 'TEST'} mode. Please check Admin Dashboard.`);
    }

    // 6. Calculate Total
    const amountInCents = items.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    console.log(`💰 Total Processing Amount: R${(amountInCents/100).toFixed(2)}`);

    if (amountInCents < 200) {
        throw new Error(`Total amount (R${(amountInCents/100).toFixed(2)}) is too low. Minimum Yoco transaction is R2.00.`);
    }

    // 7. Call Yoco
    console.log("➡️ Requesting Yoco Checkout...");
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
            itemCount: items.length,
            note: 'Created via Supabase Edge Function'
        }
      })
    });

    let yocoData;
    try {
        yocoData = await yocoResponse.json();
    } catch(e) {
        console.error("Yoco Non-JSON Response", e);
        throw new Error("Invalid response from Yoco API (Not JSON).");
    }

    if (!yocoResponse.ok) {
        console.error("❌ Yoco API Rejected:", JSON.stringify(yocoData));
        const msg = yocoData.message || (yocoData.code ? `Yoco Error: ${yocoData.code}` : "Payment Provider Rejected Request");
        throw new Error(msg);
    }

    console.log("✅ Yoco Success. Redirect URL:", yocoData.redirectUrl);

    // 8. Success Response
    return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("❌ Execution Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
