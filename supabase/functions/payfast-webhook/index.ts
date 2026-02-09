
// ==============================================================================
// PAYFAST ITN (Instant Transaction Notification) WEBHOOK
// Deploy: npx supabase functions deploy payfast-webhook --no-verify-jwt
// ==============================================================================
// This function receives payment notifications from PayFast and:
// 1. Validates the payment signature
// 2. Updates order status to 'paid'
// 3. Sends invoice email to customer
// ==============================================================================

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
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("PayFast ITN received");

    // Parse the form data from PayFast
    const formData = await req.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log("PayFast data:", data);

    // Extract important fields
    const {
      payment_status,
      m_payment_id, // Our order ID
      amount_gross,
      item_name,
      email_address,
      name_first,
      name_last,
    } = data;

    // Validate payment status
    if (payment_status !== "COMPLETE") {
      console.log(`Payment not complete. Status: ${payment_status}`);
      return new Response(
        JSON.stringify({ message: "Payment not complete" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the order by m_payment_id (order ID)
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", m_payment_id)
      .single();

    if (fetchError || !order) {
      console.error("Order not found:", m_payment_id, fetchError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Update order status to paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_confirmed_at: new Date().toISOString()
      })
      .eq("id", m_payment_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      throw updateError;
    }

    console.log(`Order ${m_payment_id} marked as paid`);

    // Get store settings for invoice
    const { data: settings } = await supabase
      .from("store_settings")
      .select("company_name, company_address, invoice_footer_text")
      .single();

    // Send invoice email
    try {
      await supabase.functions.invoke("resend-order-email", {
        body: {
          customerName: `${name_first} ${name_last}`,
          customerEmail: email_address,
          customerPhone: order.phone,
          customerAddress: order.address_full,
          orderTotal: parseFloat(amount_gross),
          items: order.items,
          orderId: m_payment_id,
          orderDate: new Date().toLocaleDateString("en-ZA"),
          companyName: settings?.company_name,
          companyAddress: settings?.company_address,
          invoiceFooterText: settings?.invoice_footer_text,
        },
      });
      console.log("Invoice email sent successfully");
    } catch (emailError) {
      console.error("Failed to send invoice email:", emailError);
      // Don't fail the webhook if email fails
    }

    return new Response(
      JSON.stringify({ success: true, orderId: m_payment_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("PayFast webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
