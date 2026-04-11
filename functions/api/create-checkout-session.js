
import Stripe from 'stripe';
import { PRODUCTS } from '../lib/products.js';

export async function onRequestPost(context) {
  try {
    const stripeKey = context.env.STRIPE_SECRET_KEY;
    const siteUrl = context.env.PUBLIC_SITE_URL || new URL(context.request.url).origin;

    if (!stripeKey) {
      return json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' }, 500);
    }

    const stripe = new Stripe(stripeKey);
    const body = await context.request.json();
    const incomingCart = Array.isArray(body.cart) ? body.cart : [];

    const line_items = incomingCart
      .map((item) => {
        const product = PRODUCTS[item.id];
        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        if (!product) return null;
        return {
          quantity,
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name
            },
            unit_amount: Math.round(product.price * 100)
          }
        };
      })
      .filter(Boolean);

    if (!line_items.length) {
      return json({ error: 'Cart is empty.' }, 400);
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items,
      return_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US']
      },
      customer_creation: 'always',
      consent_collection: {
        promotions: 'none'
      },
      tax_id_collection: {
        enabled: false
      },
      phone_number_collection: {
        enabled: false
      },
      redirect_on_completion: 'always',
      branding_settings: {
        display_name: 'Alder & Cove',
        background_color: '#f4f1ea',
        button_color: '#2f3132',
        border_style: 'rounded',
        font_family: 'pt_serif',
        icon: {
          type: 'url',
          url: `${siteUrl}/assets/favicon.svg`
        },
        logo: {
          type: 'url',
          url: `${siteUrl}/assets/logo.svg`
        }
      },
      metadata: {
        storefront: 'Alder & Cove'
      }
    });

    return json({ clientSecret: session.client_secret });
  } catch (error) {
    return json({ error: error.message || 'Unable to create checkout session.' }, 500);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });
}
