import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicializa Mercado Pago con tu Access Token privado
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, title, price } = body;

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            id: productId,
            title: title,
            quantity: 1,
            unit_price: Number(price)
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/pago/resultado?status=success&provider=mercadopago`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/pago/resultado?status=failure&provider=mercadopago`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pago/resultado?status=pending&provider=mercadopago`
        },
        auto_return: "approved",
      }
    });

    // Le devolvemos al frontend la URL segura de Mercado Pago
    return NextResponse.json({ init_point: response.init_point });
  } catch (error) {
    console.error("Error Mercado Pago:", error);
    return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
  }
}