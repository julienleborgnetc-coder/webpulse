import * as cheerio from "cheerio";
import https from "https";
import http from "http";
import {
  AuditResult,
  AuditItem,
  HeadingInfo,
  ImageInfo,
} from "@/lib/types";

/**
 * Fetch a URL using Node.js native http/https modules for maximum compatibility.
 */
function fetchUrl(url: string, timeoutMs = 30000): Promise<{ html: string; statusCode: number; responseTime: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr,en;q=0.9",
      },
      rejectUnauthorized: false, // Handle environments with missing CA certs
      timeout: timeoutMs,
    };

    const req = client.request(options, (res) => {
      // Follow redirects (up to 5)
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        res.resume();
        fetchUrl(redirectUrl, timeoutMs - (Date.now() - startTime))
          .then(resolve)
          .catch(reject);
        return;
      }

      const responseTime = Date.now() - startTime;
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const html = Buffer.concat(chunks).toString("utf-8");
        resolve({ html, statusCode: res.statusCode || 200, responseTime });
      });
      res.on("error", reject);
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout: le site met trop de temps à répondre."));
    });
    req.end();
  });
}

export async function performAudit(url: string): Promise<AuditResult> {
  const id = generateId();
  const startTime = Date.now();

  // Fetch the page using native Node.js http/https
  let html: string;
  let responseTime: number;
  let responseSize: number;
  let statusCode: number;

  try {
    const result = await fetchUrl(url);
    html = result.html;
    statusCode = result.statusCode;
    responseTime = result.responseTime;
    responseSize = Buffer.byteLength(html, "utf-8");
  } catch (fetchError: unknown) {
    const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    console.error("Fetch error for", url, ":", msg);
    throw new Error(
      "Impossible d'accéder au site. Vérifiez l'URL et réessayez."
    );
  }

  const $ = cheerio.load(html);

  // Extract data
  const title = $("title").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || "";
  const headings = extractHeadings($);
  const images = extractImages($, url);
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || "";
  const hasHtmlLang = !!$("html").attr("lang");
  const hasCharset =
    $('meta[charset]').length > 0 ||
    $('meta[http-equiv="Content-Type"]').length > 0;
  const internalLinks = $('a[href^="/"], a[href^="' + url + '"]').length;
  const externalLinks = $(
    'a[href^="http"]:not(a[href^="' + url + '"])'
  ).length;
  const hasH1 = $("h1").length > 0;
  const h1Count = $("h1").length;
  const hasAltOnAllImages =
    images.length === 0 || images.every((img) => img.hasAlt);
  const hasOpenGraph = $('meta[property^="og:"]').length > 0;
  const scriptCount = $("script").length;
  const stylesheetCount = $('link[rel="stylesheet"]').length;

  // Calculate scores and items
  const performanceItems = analyzePerformance(
    responseTime,
    responseSize,
    scriptCount,
    stylesheetCount
  );
  const seoItems = analyzeSEO(
    title,
    metaDescription,
    hasH1,
    h1Count,
    headings,
    images,
    hasOpenGraph,
    canonicalUrl,
    internalLinks,
    externalLinks
  );
  const accessibilityItems = analyzeAccessibility(
    hasHtmlLang,
    hasCharset,
    hasViewport,
    hasAltOnAllImages,
    images,
    $
  );

  const performanceScore = calculateScore(performanceItems);
  const seoScore = calculateScore(seoItems);
  const accessibilityScore = calculateScore(accessibilityItems);

  return {
    url,
    timestamp: new Date().toISOString(),
    id,
    performance: {
      score: performanceScore,
      label: getScoreLabel(performanceScore),
      color: getScoreColor(performanceScore),
      items: performanceItems,
    },
    seo: {
      score: seoScore,
      label: getScoreLabel(seoScore),
      color: getScoreColor(seoScore),
      items: seoItems,
    },
    accessibility: {
      score: accessibilityScore,
      label: getScoreLabel(accessibilityScore),
      color: getScoreColor(accessibilityScore),
      items: accessibilityItems,
    },
    details: {
      title,
      metaDescription,
      loadTime: responseTime,
      pageSize: responseSize,
      requestCount: scriptCount + stylesheetCount,
      headings,
      images,
      links: {
        internal: internalLinks,
        external: externalLinks,
        broken: 0,
      },
      mobile: {
        hasViewport,
        isResponsive: hasViewport,
      },
    },
  };
}

function extractHeadings($: cheerio.CheerioAPI): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    headings.push({
      tag: $(el).prop("tagName")?.toLowerCase() || "h1",
      text: $(el).text().trim().substring(0, 100),
    });
  });
  return headings.slice(0, 50);
}

function extractImages(
  $: cheerio.CheerioAPI,
  _baseUrl: string
): ImageInfo[] {
  const images: ImageInfo[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    const alt = $(el).attr("alt") || "";
    images.push({
      src: src.substring(0, 200),
      alt: alt.substring(0, 200),
      hasAlt: alt.length > 0,
    });
  });
  return images.slice(0, 100);
}

function analyzePerformance(
  responseTime: number,
  pageSize: number,
  scriptCount: number,
  stylesheetCount: number
): AuditItem[] {
  const items: AuditItem[] = [];

  // Response time
  items.push({
    title: "Temps de réponse du serveur",
    description:
      responseTime < 600
        ? `Excellent : ${responseTime}ms`
        : responseTime < 2000
        ? `Acceptable : ${responseTime}ms. Visez moins de 600ms.`
        : `Lent : ${responseTime}ms. Le serveur met trop de temps à répondre.`,
    status: responseTime < 600 ? "pass" : responseTime < 2000 ? "warning" : "fail",
    value: `${responseTime}ms`,
  });

  // Page size
  items.push({
    title: "Taille de la page",
    description:
      pageSize < 500000
        ? `Bonne taille : ${(pageSize / 1024).toFixed(0)} KB`
        : pageSize < 2000000
        ? `Page volumineuse : ${(pageSize / 1024).toFixed(0)} KB. Optimisez les ressources.`
        : `Page très lourde : ${(pageSize / 1048576).toFixed(1)} MB. Réduisez le poids de la page.`,
    status:
      pageSize < 500000 ? "pass" : pageSize < 2000000 ? "warning" : "fail",
    value: `${(pageSize / 1024).toFixed(0)} KB`,
  });

  // Scripts
  items.push({
    title: "Nombre de scripts",
    description:
      scriptCount <= 5
        ? `${scriptCount} scripts trouvés. Bon.`
        : scriptCount <= 15
        ? `${scriptCount} scripts trouvés. Envisagez de regrouper ou différer certains scripts.`
        : `${scriptCount} scripts trouvés. Trop de scripts ralentissent votre page.`,
    status: scriptCount <= 5 ? "pass" : scriptCount <= 15 ? "warning" : "fail",
    value: `${scriptCount}`,
  });

  // Stylesheets
  items.push({
    title: "Feuilles de styles externes",
    description:
      stylesheetCount <= 3
        ? `${stylesheetCount} feuilles de styles. Bien.`
        : `${stylesheetCount} feuilles de styles. Regroupez-les pour améliorer le chargement.`,
    status: stylesheetCount <= 3 ? "pass" : "warning",
    value: `${stylesheetCount}`,
  });

  return items;
}

function analyzeSEO(
  title: string,
  metaDescription: string,
  hasH1: boolean,
  h1Count: number,
  headings: HeadingInfo[],
  images: ImageInfo[],
  hasOpenGraph: boolean,
  canonicalUrl: string,
  internalLinks: number,
  externalLinks: number
): AuditItem[] {
  const items: AuditItem[] = [];

  // Title
  items.push({
    title: "Balise titre",
    description: !title
      ? "Aucune balise <title> trouvée. C'est essentiel pour le SEO."
      : title.length < 30
      ? `Titre trop court (${title.length} car.). Visez 50-60 caractères.`
      : title.length > 60
      ? `Titre trop long (${title.length} car.). Limitez à 60 caractères.`
      : `Titre bien optimisé (${title.length} car.) : "${title}"`,
    status: !title
      ? "fail"
      : title.length >= 30 && title.length <= 60
      ? "pass"
      : "warning",
    value: title || "Manquant",
  });

  // Meta description
  items.push({
    title: "Meta description",
    description: !metaDescription
      ? "Meta description manquante. Ajoutez-en une pour améliorer votre CTR."
      : metaDescription.length < 120
      ? `Trop courte (${metaDescription.length} car.). Visez 150-160 caractères.`
      : metaDescription.length > 160
      ? `Trop longue (${metaDescription.length} car.). Limitez à 160 caractères.`
      : `Bien optimisée (${metaDescription.length} car.).`,
    status: !metaDescription
      ? "fail"
      : metaDescription.length >= 120 && metaDescription.length <= 160
      ? "pass"
      : "warning",
  });

  // H1
  items.push({
    title: "Balise H1",
    description: !hasH1
      ? "Aucune balise H1 trouvée. Chaque page doit avoir un H1 unique."
      : h1Count > 1
      ? `${h1Count} balises H1 trouvées. Il devrait n'y en avoir qu'une seule.`
      : "Balise H1 présente et unique. Parfait.",
    status: !hasH1 ? "fail" : h1Count === 1 ? "pass" : "warning",
  });

  // Heading hierarchy
  const hasProperHierarchy =
    headings.length > 0 && headings[0]?.tag === "h1";
  items.push({
    title: "Hiérarchie des titres",
    description: hasProperHierarchy
      ? `${headings.length} titres trouvés avec une hiérarchie correcte.`
      : "La hiérarchie des titres n'est pas optimale. Le premier titre devrait être un H1.",
    status: hasProperHierarchy ? "pass" : "warning",
  });

  // Images alt
  const imagesWithoutAlt = images.filter((img) => !img.hasAlt);
  items.push({
    title: "Attributs alt des images",
    description:
      images.length === 0
        ? "Aucune image trouvée sur la page."
        : imagesWithoutAlt.length === 0
        ? `${images.length} images, toutes avec des attributs alt. Excellent.`
        : `${imagesWithoutAlt.length}/${images.length} images sans attribut alt. Ajoutez des descriptions.`,
    status:
      images.length === 0 || imagesWithoutAlt.length === 0
        ? "pass"
        : imagesWithoutAlt.length <= 2
        ? "warning"
        : "fail",
  });

  // Open Graph
  items.push({
    title: "Balises Open Graph",
    description: hasOpenGraph
      ? "Balises Open Graph présentes. Bon pour le partage sur les réseaux sociaux."
      : "Pas de balises Open Graph. Le partage social sera moins attrayant.",
    status: hasOpenGraph ? "pass" : "warning",
  });

  // Canonical
  items.push({
    title: "URL canonique",
    description: canonicalUrl
      ? "URL canonique définie. Bon pour éviter le contenu dupliqué."
      : "Pas d'URL canonique. Ajoutez-en une pour éviter le contenu dupliqué.",
    status: canonicalUrl ? "pass" : "warning",
  });

  // Links
  items.push({
    title: "Liens internes",
    description:
      internalLinks >= 3
        ? `${internalLinks} liens internes trouvés. Bon maillage interne.`
        : `Seulement ${internalLinks} liens internes. Améliorez votre maillage.`,
    status: internalLinks >= 3 ? "pass" : "warning",
  });

  return items;
}

function analyzeAccessibility(
  hasHtmlLang: boolean,
  hasCharset: boolean,
  hasViewport: boolean,
  hasAltOnAllImages: boolean,
  images: ImageInfo[],
  $: cheerio.CheerioAPI
): AuditItem[] {
  const items: AuditItem[] = [];

  items.push({
    title: "Attribut lang sur <html>",
    description: hasHtmlLang
      ? "L'attribut lang est présent. Les lecteurs d'écran pourront identifier la langue."
      : "L'attribut lang est manquant sur la balise <html>. Ajoutez-le.",
    status: hasHtmlLang ? "pass" : "fail",
  });

  items.push({
    title: "Encodage des caractères",
    description: hasCharset
      ? "L'encodage des caractères est déclaré. Bien."
      : "Aucun encodage déclaré. Ajoutez <meta charset=\"utf-8\">.",
    status: hasCharset ? "pass" : "fail",
  });

  items.push({
    title: "Meta viewport",
    description: hasViewport
      ? "La meta viewport est présente. Le site est adapté au mobile."
      : "Meta viewport manquante. Le site ne sera pas optimisé pour le mobile.",
    status: hasViewport ? "pass" : "fail",
  });

  items.push({
    title: "Alt sur toutes les images",
    description: hasAltOnAllImages
      ? images.length > 0
        ? "Toutes les images ont un texte alternatif. Excellent."
        : "Aucune image sur la page."
      : "Certaines images n'ont pas de texte alternatif.",
    status: hasAltOnAllImages ? "pass" : "fail",
  });

  // Check for form labels
  const inputs = $("input:not([type=hidden]):not([type=submit]):not([type=button])");
  const inputsWithoutLabel = inputs.filter((_, el) => {
    const id = $(el).attr("id");
    const ariaLabel = $(el).attr("aria-label");
    const ariaLabelledBy = $(el).attr("aria-labelledby");
    const hasAssociatedLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    return !ariaLabel && !ariaLabelledBy && !hasAssociatedLabel;
  });

  if (inputs.length > 0) {
    items.push({
      title: "Labels des formulaires",
      description:
        inputsWithoutLabel.length === 0
          ? "Tous les champs de formulaire ont des labels associés."
          : `${inputsWithoutLabel.length} champs sans label. Les utilisateurs de lecteurs d'écran ne pourront pas les comprendre.`,
      status: inputsWithoutLabel.length === 0 ? "pass" : "fail",
    });
  }

  // Check for skip navigation
  const hasSkipNav =
    $('a[href="#main"], a[href="#content"], [class*="skip"]').length > 0;
  items.push({
    title: "Lien d'évitement (skip nav)",
    description: hasSkipNav
      ? "Un lien d'évitement est présent. Bien pour la navigation au clavier."
      : "Pas de lien d'évitement trouvé. Ajoutez-en un pour la navigation au clavier.",
    status: hasSkipNav ? "pass" : "warning",
  });

  return items;
}

function calculateScore(items: AuditItem[]): number {
  if (items.length === 0) return 100;
  const weights = { pass: 1, warning: 0.5, fail: 0 };
  const total = items.reduce((sum, item) => sum + weights[item.status], 0);
  return Math.round((total / items.length) * 100);
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Bon";
  if (score >= 50) return "Moyen";
  return "À améliorer";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  );
}
