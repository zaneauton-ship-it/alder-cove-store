
import Stripe from 'stripe';

export async function onRequestGet(context) {
  try {
    const stripeKey = context.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' }, 500);
    }
    const stripe = new Stripe(stripeKey);
    const url = new URL(context.request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return json({ error: 'Missing session_id.' }, 400);
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return json({
      status: session.status,
      customer_email: session.customer_details?.email || session.customer_email || null
    });
  } catch (error) {
    return json({ error: error.message || 'Unable to retrieve session.' }, 500);
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
