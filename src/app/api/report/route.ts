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
    if (score >= 70) return "#eab308";
    if (score >= 50) return "#f97316";
    return "#ef4444";
  };

  const getImpactBadge = (impact?: string) => {
    if (impact === "high") return '<span class="badge" style="background:#fecaca;color:#dc2626">ÉLEVÉ</span>';
    if (impact === "medium") return '<span class="badge" style="background:#fef3c7;color:#d97706">MOYEN</span>';
    if (impact === "low") return '<span class="badge" style="background:#e2e8f0;color:#64748b">FAIBLE</span>';
    return "";
  };

  const getEffortBadge = (effort: string) => {
    if (effort === "easy") return '<span class="badge" style="background:#d1fae5;color:#059669">Facile</span>';
    if (effort === "medium") return '<span class="badge" style="background:#fef3c7;color:#d97706">Moyen</span>';
    return '<span class="badge" style="background:#fecaca;color:#dc2626">Difficile</span>';
  };

  const allItems = [
    ...result.performance.items.map((i) => ({ ...i, category: "Performance" })),
    ...result.seo.items.map((i) => ({ ...i, category: "SEO" })),
    ...result.accessibility.items.map((i) => ({
      ...i,
      category: "Accessibilité",
    })),
    ...(result.security?.items || []).map((i) => ({
      ...i,
      category: "Sécurité",
    })),
  ];

  const globalScore = result.globalScore ?? Math.round(
    (result.performance.score + result.seo.score + result.accessibility.score + (result.security?.score || 0)) /
    (result.security ? 4 : 3)
  );

  const yesNo = (val?: boolean) => val ? "✓ Oui" : "✗ Non";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rapport WebPulse Pro - ${result.url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; background: #f8fafc; }
    .header { text-align: center; padding: 40px; background: linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1); color: white; border-radius: 16px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.8; font-size: 14px; }
    .global-score { text-align: center; padding: 32px; background: white; border: 2px solid #e2e8f0; border-radius: 16px; margin-bottom: 24px; }
    .global-score .big { font-size: 72px; font-weight: 900; }
    .global-score .label { font-size: 14px; color: #64748b; margin-top: 4px; display: inline-block; padding: 4px 16px; border-radius: 20px; }
    .scores { display: flex; gap: 16px; margin-bottom: 24px; }
    .score-card { flex: 1; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; }
    .score-value { font-size: 48px; font-weight: bold; }
    .score-label { font-size: 14px; color: #64748b; margin-top: 4px; }
    .section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .section h2 { font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .item { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .item:last-child { border-bottom: none; }
    .item-header { display: flex; align-items: center; gap: 12px; }
    .item-status { flex-shrink: 0; }
    .item-title { font-weight: 600; font-size: 14px; }
    .item-desc { font-size: 13px; color: #64748b; margin-top: 2px; margin-left: 28px; }
    .item-reco { font-size: 13px; color: #4f46e5; margin-top: 6px; margin-left: 28px; padding: 8px 12px; background: #eef2ff; border-radius: 8px; border-left: 3px solid #6366f1; }
    .details { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
    .detail-card { background: #f8fafc; padding: 16px; border-radius: 8px; }
    .detail-label { font-size: 12px; color: #64748b; }
    .detail-value { font-size: 18px; font-weight: 600; margin-top: 4px; }
    .detail-good { color: #16a34a; }
    .detail-bad { color: #dc2626; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px; }
    .tech-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .tech-badge { background: #eef2ff; color: #4f46e5; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }
    .priority-item { display: flex; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; background: #fafbfc; }
    .priority-num { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: white; }
    .priority-content { flex: 1; }
    .priority-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
    .priority-cat { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .priority-desc { font-size: 13px; color: #475569; }
    @media print { body { padding: 20px; background: white; } .header { break-after: avoid; } }
    @media (max-width: 600px) { .scores { flex-direction: column; } .details { grid-template-columns: 1fr 1fr; } body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Rapport d'audit WebPulse Pro</h1>
    <p>${result.url} — ${new Date(result.timestamp).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>

  <div class="global-score">
    <div>Score global</div>
    <div class="big" style="color: ${getScoreColor(globalScore)}">${globalScore}<span style="font-size:36px;color:#94a3b8">/100</span></div>
    <div class="label" style="background: ${getScoreColor(globalScore)}20; color: ${getScoreColor(globalScore)}">
      ${globalScore >= 90 ? "Excellent" : globalScore >= 70 ? "Bon" : globalScore >= 50 ? "Moyen" : "Faible"}
    </div>
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
    ${result.security ? `
    <div class="score-card">
      <div class="score-value" style="color: ${getScoreColor(result.security.score)}">${result.security.score}</div>
      <div class="score-label">Sécurité</div>
    </div>` : ""}
  </div>

  <div class="section">
    <h2>📊 Métriques clés</h2>
    <div class="details">
      <div class="detail-card">
        <div class="detail-label">Temps de chargement</div>
        <div class="detail-value ${result.details.loadTime < 3000 ? "detail-good" : "detail-bad"}">${(result.details.loadTime / 1000).toFixed(2)}s</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Taille de la page</div>
        <div class="detail-value ${result.details.pageSize < 3000000 ? "detail-good" : "detail-bad"}">${(result.details.pageSize / 1024).toFixed(0)} KB</div>
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
      <div class="detail-card">
        <div class="detail-label">Éléments DOM</div>
        <div class="detail-value ${(result.details.domElements || 0) < 1500 ? "detail-good" : "detail-bad"}">${result.details.domElements || "—"}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Nombre de mots</div>
        <div class="detail-value ${(result.details.wordCount || 0) >= 300 ? "detail-good" : "detail-bad"}">${result.details.wordCount || "—"}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">robots.txt</div>
        <div class="detail-value ${result.details.hasRobotsTxt ? "detail-good" : "detail-bad"}">${yesNo(result.details.hasRobotsTxt)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">sitemap.xml</div>
        <div class="detail-value ${result.details.hasSitemap ? "detail-good" : "detail-bad"}">${yesNo(result.details.hasSitemap)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Données structurées</div>
        <div class="detail-value ${result.details.hasStructuredData ? "detail-good" : "detail-bad"}">${yesNo(result.details.hasStructuredData)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">HTTPS</div>
        <div class="detail-value ${result.details.httpsRedirect ? "detail-good" : "detail-bad"}">${yesNo(result.details.httpsRedirect)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Favicon</div>
        <div class="detail-value ${result.details.hasFavicon ? "detail-good" : "detail-bad"}">${yesNo(result.details.hasFavicon)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Mobile-friendly</div>
        <div class="detail-value ${result.details.mobile.hasViewport ? "detail-good" : "detail-bad"}">${yesNo(result.details.mobile.hasViewport)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Iframes</div>
        <div class="detail-value">${result.details.iframeCount || 0}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Styles inline</div>
        <div class="detail-value ${(result.details.inlineStyles || 0) < 10 ? "detail-good" : "detail-bad"}">${result.details.inlineStyles || 0}</div>
      </div>
    </div>
  </div>

  ${result.details.technologies && result.details.technologies.length > 0 ? `
  <div class="section">
    <h2>🛠️ Technologies détectées</h2>
    <div class="tech-list">
      ${result.details.technologies.map(t => `<span class="tech-badge">${t}</span>`).join("")}
    </div>
  </div>` : ""}

  ${result.priorities && result.priorities.length > 0 ? `
  <div class="section">
    <h2>🎯 Plan d'action prioritaire</h2>
    <p style="color:#64748b;font-size:13px;margin-bottom:16px">Voici les actions à réaliser, classées par priorité et impact.</p>
    ${result.priorities.map((p, i) => `
    <div class="priority-item">
      <div class="priority-num" style="background: ${i === 0 ? "#ef4444" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : "#94a3b8"}">#${p.priority}</div>
      <div class="priority-content">
        <div class="priority-title">${p.title} ${getImpactBadge(p.impact)} ${getEffortBadge(p.effort)}</div>
        <div class="priority-cat">${p.category}</div>
        <div class="priority-desc">${p.description}</div>
      </div>
    </div>`).join("")}
  </div>` : ""}

  ${["Performance", "SEO", "Accessibilité", "Sécurité"]
    .map((category) => {
      const categoryItems = allItems.filter((i) => i.category === category);
      if (categoryItems.length === 0) return "";
      const emoji = category === "Performance" ? "🚀" : category === "SEO" ? "🔍" : category === "Accessibilité" ? "♿" : "🔒";
      return `
  <div class="section">
    <h2>${emoji} ${category}</h2>
    ${categoryItems
      .map(
        (item) => `
    <div class="item">
      <div class="item-header">
        <div class="item-status">${getStatusEmoji(item.status)}</div>
        <div class="item-title">${item.title}${item.impact ? getImpactBadge(item.impact) : ""}</div>
      </div>
      <div class="item-desc">${item.description}</div>
      ${item.recommendation && item.status !== "pass" ? `<div class="item-reco">💡 ${item.recommendation}</div>` : ""}
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

  ${result.details.images.some(img => !img.hasAlt) ? `
  <div class="section">
    <h2>🖼️ Images sans attribut alt</h2>
    ${result.details.images.filter(img => !img.hasAlt).map(img => `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 12px;margin-bottom:6px;font-size:13px">
      <code style="color:#dc2626;word-break:break-all">${img.src || "(src vide)"}</code>
    </div>`).join("")}
  </div>` : ""}

  <div class="footer">
    <p>Généré par WebPulse Pro — ${siteHost}</p>
    <p>Ce rapport a été généré automatiquement. Pour un audit approfondi, consultez un expert.</p>
  </div>
</body>
</html>`;
}
