import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auditStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditId, url } = body;

    if (!auditId) {
      return NextResponse.json(
        { error: "ID d'audit manquant" },
        { status: 400 }
      );
    }

    // Verify audit exists
    const audit = await auditStore.getResult(auditId);
    if (!audit) {
      return NextResponse.json(
        { error: "Audit non trouvé ou expiré" },
        { status: 404 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Le système de paiement n'est pas configuré. Contactez l'administrateur." },
        { status: 503 }
      );
    }

    // Create Stripe Checkout session
    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "WebPulse - Rapport d'audit Pro",
              description: `Rapport d'audit complet pour ${url}`,
            },
            unit_amount: 900, // 9€ in cents
            tax_behavior: "inclusive",
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      locale: "auto",
      currency: "eur",
      success_url: `${request.nextUrl.origin}/report/${auditId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}?cancelled=true`,
      metadata: {
        auditId,
        url,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
