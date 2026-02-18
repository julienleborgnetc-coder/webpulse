import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auditStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, auditId } = body;

    if (!sessionId || !auditId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Already paid — skip verification
    if (auditStore.isPaid(auditId)) {
      return NextResponse.json({ verified: true });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      // Dev mode: already handled by checkout fallback
      return NextResponse.json({ verified: true });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Retrieve the session from Stripe to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.payment_status === "paid" &&
      session.metadata?.auditId === auditId
    ) {
      auditStore.markPaid(auditId, session.id);
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json(
      { error: "Paiement non confirmé" },
      { status: 403 }
    );
  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Erreur de vérification" },
      { status: 500 }
    );
  }
}
