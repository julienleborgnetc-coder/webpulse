import { NextRequest, NextResponse } from "next/server";
import { auditStore } from "@/lib/store";
import { AuditResult } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID d'audit manquant" },
      { status: 400 }
    );
  }

  const entry = await auditStore.get(id);

  if (!entry) {
    return NextResponse.json(
      { error: "Audit non trouvé. Il a peut-être expiré." },
      { status: 404 }
    );
  }

  // Verify payment
  if (!entry.paid) {
    return NextResponse.json(
      { error: "Ce rapport n'a pas encore été payé. Veuillez passer par le checkout." },
      { status: 403 }
    );
  }

  const result = entry.result;

  // Generate report as downloadable HTML
  const html = generateReportHTML(result);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="webpulse-report-${id}.html"`,
    },
  });
}

function generateReportHTML(result: AuditResult): string {
  const siteHost = (process.env.NEXT_PUBLIC_SITE_URL || "https://webpulse.vercel.app").replace(/^https?:\/\//, "");

  const getStatusEmoji = (status: string) => {
    if (status === "pass") return "✅";
    if (status === "warning") return "⚠️";
    return "❌";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#22c55e";
    if (score >= 50) return "#eab308";
    return "#ef4444";
  };

  const allItems = [
    ...result.performance.items.map((i) => ({ ...i, category: "Performance" })),
    ...result.seo.items.map((i) => ({ ...i, category: "SEO" })),
    ...result.accessibility.items.map((i) => ({
      ...i,
      category: "Accessibilité",
    })),
  ];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rapport WebPulse - ${result.url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; padding: 40px; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; border-radius: 16px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.8; font-size: 14px; }
    .scores { display: flex; gap: 16px; margin-bottom: 32px; }
    .score-card { flex: 1; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; }
    .score-value { font-size: 48px; font-weight: bold; }
    .score-label { font-size: 14px; color: #64748b; margin-top: 4px; }
    .section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .section h2 { font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .item { padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; gap: 12px; }
    .item:last-child { border-bottom: none; }
    .item-status { flex-shrink: 0; }
    .item-title { font-weight: 600; font-size: 14px; }
    .item-desc { font-size: 13px; color: #64748b; margin-top: 2px; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .detail-card { background: #f8fafc; padding: 16px; border-radius: 8px; }
    .detail-label { font-size: 12px; color: #64748b; }
    .detail-value { font-size: 18px; font-weight: 600; margin-top: 4px; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    @media print { body { padding: 20px; } .header { break-after: avoid; } }
    @media (max-width: 600px) { .scores { flex-direction: column; } .details { grid-template-columns: 1fr; } body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Rapport d'audit WebPulse</h1>
    <p>${result.url} — ${new Date(result.timestamp).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>

  <div class="scores">
    <div class="score-card">
      <div class="score-value" style="color: ${getScoreColor(result.performance.score)}">${result.performance.score}</div>
      <div class="score-label">Performance</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color: ${getScoreColor(result.seo.score)}">${result.seo.score}</div>
      <div class="score-label">SEO</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color: ${getScoreColor(result.accessibility.score)}">${result.accessibility.score}</div>
      <div class="score-label">Accessibilité</div>
    </div>
  </div>

  <div class="section">
    <h2>📊 Métriques clés</h2>
    <div class="details">
      <div class="detail-card">
        <div class="detail-label">Temps de chargement</div>
        <div class="detail-value">${(result.details.loadTime / 1000).toFixed(2)}s</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Taille de la page</div>
        <div class="detail-value">${(result.details.pageSize / 1024).toFixed(0)} KB</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Liens internes</div>
        <div class="detail-value">${result.details.links.internal}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Liens externes</div>
        <div class="detail-value">${result.details.links.external}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Images</div>
        <div class="detail-value">${result.details.images.length}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Titres (headings)</div>
        <div class="detail-value">${result.details.headings.length}</div>
      </div>
    </div>
  </div>

  ${["Performance", "SEO", "Accessibilité"]
    .map((category) => {
      const categoryItems = allItems.filter((i) => i.category === category);
      if (categoryItems.length === 0) return "";
      return `
  <div class="section">
    <h2>${category === "Performance" ? "🚀" : category === "SEO" ? "🔍" : "♿"} ${category}</h2>
    ${categoryItems
      .map(
        (item) => `
    <div class="item">
      <div class="item-status">${getStatusEmoji(item.status)}</div>
      <div>
        <div class="item-title">${item.title}</div>
        <div class="item-desc">${item.description}</div>
      </div>
    </div>`
      )
      .join("")}
  </div>`;
    })
    .join("")}

  ${
    result.details.headings.length > 0
      ? `
  <div class="section">
    <h2>📑 Structure des titres</h2>
    ${result.details.headings
      .map(
        (h) =>
          `<div style="padding: 4px 0 4px ${(parseInt(h.tag.replace("h", "")) - 1) * 20}px; font-size: 13px;"><strong>&lt;${h.tag}&gt;</strong> ${h.text}</div>`
      )
      .join("")}
  </div>`
      : ""
  }

  <div class="footer">
    <p>Généré par WebPulse — ${siteHost}</p>
    <p>Ce rapport a été généré automatiquement. Pour un audit approfondi, consultez un expert.</p>
  </div>
</body>
</html>`;
}
