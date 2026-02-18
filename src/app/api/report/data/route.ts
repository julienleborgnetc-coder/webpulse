import { NextRequest, NextResponse } from "next/server";
import { auditStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID d'audit manquant" },
      { status: 400 }
    );
  }

  const entry = auditStore.get(id);

  if (!entry) {
    return NextResponse.json(
      { error: "Audit non trouvé ou expiré" },
      { status: 404 }
    );
  }

  if (!entry.paid) {
    return NextResponse.json(
      { error: "Rapport non payé" },
      { status: 403 }
    );
  }

  return NextResponse.json(entry.result);
}
