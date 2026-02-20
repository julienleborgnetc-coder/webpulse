import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auditStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe non configuré" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur de vérification";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Signature invalide: ${message}` },
      { status: 400 }
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const auditId = session.metadata?.auditId;

    if (auditId) {
      const marked = await auditStore.markPaid(auditId, session.id);
      if (marked) {
        console.log(`✅ Audit ${auditId} marked as paid (session: ${session.id})`);
      } else {
        console.warn(`⚠️ Audit ${auditId} not found in store (may have expired)`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
