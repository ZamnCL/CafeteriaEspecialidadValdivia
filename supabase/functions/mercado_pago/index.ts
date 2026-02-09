import { serve } from "http/server.ts";
import { MercadoPagoConfig, Preference } from 'mercadopago';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  id_producto: number;
  cantidad: number;
  producto: {
    nombre: string;
  };
  formato: {
    precio: number;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("📦 Datos recibidos:", JSON.stringify(body, null, 2));

    const { items, orderId, userEmail } = body;

    if (!items || items.length === 0) {
      throw new Error("No se recibieron items en la solicitud");
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error("MP_ACCESS_TOKEN no está configurado");
    }

    console.log("🔑 Access Token configurado:", accessToken.substring(0, 10) + "...");

    const client = new MercadoPagoConfig({
      accessToken: accessToken
    });
    const preference = new Preference(client);

    const mpItems = items.map((item: CartItem) => ({
      id: String(item.id_producto),
      title: `${item.producto.nombre}`,
      quantity: Number(item.cantidad),
      unit_price: Number(item.formato.precio),
      currency_id: 'CLP',
    }));

    console.log("🛒 Items para MP:", JSON.stringify(mpItems, null, 2));

    const baseUrl = Deno.env.get('BASE_URL') || 'https://cafeteriaespecialidadvaldivia.netlify.app';

    const result = await preference.create({
      body: {
        items: mpItems,
        external_reference: String(orderId),
        payer: {
          email: userEmail || 'test_user_123@test.com'
        },
        back_urls: {
          success: `${baseUrl}/compra-exitosa`,
          failure: `${baseUrl}/compra-fallida`,
          pending: `${baseUrl}/compra-fallida`
        },
        auto_return: "approved",
      }
    });

    console.log("✅ Respuesta MP:", JSON.stringify(result, null, 2));

    const initPoint = result.init_point || result.sandbox_init_point;

    if (!initPoint) {
      console.error("❌ No se recibió init_point de MP:", result);
      throw new Error("Mercado Pago no devolvió URL de pago");
    }

    return new Response(
      JSON.stringify({ init_point: initPoint }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("❌ Error completo:", error);
    console.error("❌ Stack:", error instanceof Error ? error.stack : 'No stack');

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails = error instanceof Error && 'cause' in error ? error.cause : null;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
