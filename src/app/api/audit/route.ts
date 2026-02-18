import { NextRequest, NextResponse } from "next/server";
import { performAudit } from "@/lib/auditor";
import { auditStore } from "@/lib/store";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 audits per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, remaining, resetIn } = rateLimit(ip, 10, 60_000);

    if (!allowed) {
      return NextResponse.json(
        {
          error: `Trop de requêtes. Réessayez dans ${Math.ceil(resetIn / 1000)} secondes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL manquante ou invalide" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Format d'URL invalide. Exemple : https://example.com" },
        { status: 400 }
      );
    }

    const result = await performAudit(url);

    // Store result for later report generation
    auditStore.set(result.id, result);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Audit error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'analyse du site",
      },
      { status: 500 }
    );
  }
}
