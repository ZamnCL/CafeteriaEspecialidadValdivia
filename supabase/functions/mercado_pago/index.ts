// supabase/functions/mercado_pago/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN");

    const { items, orderId, userEmail } = await req.json();

    // 1. IMPORTANTE: Reemplaza esto con TU URL DE VERCEL (sin barra al final)
    const BASE_URL = 'https://cafeteria-especialidad-valdivia-git-desarrollo-zamncls-projects.vercel.app'; 

    const mpItems = items.map((item: any) => ({
      title: `${item.producto.nombre.substring(0, 200)}`,
      quantity: Number(item.cantidad),
      currency_id: 'CLP',
      unit_price: Number(item.formato.precio)
    }));

    // 2. Ahora usamos URLs HTTPS reales
    const backUrls = {
      success: `${BASE_URL}/compra-exitosa?status=approved`,
      failure: `${BASE_URL}/checkout?status=failure`,
      pending: `${BASE_URL}/checkout?status=pending`
    };

    const preferenceData = {
      items: mpItems,
      external_reference: String(orderId),
      payer: { email: userEmail },
      back_urls: backUrls,
      auto_return: 'approved' // ¡AHORA SÍ ACTIVADO! 🟢
    };

    console.log("Enviando Payload PROD:", JSON.stringify(preferenceData));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP Error:", data);
      throw new Error(data.message || "Error al conectar con Mercado Pago");
    }

    return new Response(
      JSON.stringify({ init_point: data.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("Error Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})