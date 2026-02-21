import * as cheerio from "cheerio";
import https from "https";
import http from "http";
import dns from "dns/promises";
import { isIP } from "net";
import {
  AuditResult,
  AuditItem,
  HeadingInfo,
  ImageInfo,
  PriorityAction,
} from "@/lib/types";

// ----- SSRF Protection -----
const BLOCKED_RANGES = [
  /^127\./,          // loopback
  /^10\./,           // RFC1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC1918
  /^192\.168\./,     // RFC1918
  /^0\./,            // current network
  /^169\.254\./,     // link-local
  /^::1$/,           // IPv6 loopback
  /^fc00:/i,         // IPv6 unique-local
  /^fe80:/i,         // IPv6 link-local
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
]);

async function assertPublicUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  // Only allow http(s)
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Seules les URLs HTTP/HTTPS sont autorisées.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Cette URL cible une adresse non autorisée.");
  }

  // Resolve hostname to IPs and check each one
  let addresses: string[];
  if (isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      const result = await dns.resolve4(hostname);
      addresses = result;
    } catch {
      throw new Error("Impossible de résoudre le nom de domaine.");
    }
  }

  for (const addr of addresses) {
    if (BLOCKED_RANGES.some((re) => re.test(addr))) {
      throw new Error("Cette URL cible une adresse privée non autorisée.");
    }
  }
}

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
  // SSRF protection: verify the URL targets a public address
  await assertPublicUrl(url);

  const id = generateId();

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
  const nofollowLinks = $('a[rel*="nofollow"]').length;
  const hasH1 = $("h1").length > 0;
  const h1Count = $("h1").length;
  const hasAltOnAllImages =
    images.length === 0 || images.every((img) => img.hasAlt);
  const hasOpenGraph = $('meta[property^="og:"]').length > 0;
  const scriptCount = $("script").length;
  const stylesheetCount = $('link[rel="stylesheet"]').length;

  // New extractions
  const technologies = detectTechnologies($, html);
  const domElements = $("*").length;
  const htmlSize = Buffer.byteLength(html, "utf-8");
  const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0 || $('[itemscope]').length > 0;
  const httpsRedirect = url.startsWith("https://");
  const mixedContent = httpsRedirect && (html.includes('src="http://') || html.includes("src='http://"));
  const inlineStyles = $('[style]').length;
  const iframeCount = $('iframe').length;
  const hasTouchIcons = $('link[rel="apple-touch-icon"]').length > 0;
  const wordCount = $('body').text().replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 1).length;

  // Check robots.txt and sitemap asynchronously
  let hasRobotsTxt: boolean | undefined;
  let hasSitemap: boolean | undefined;
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
    const robotsRes = await fetchUrl(robotsUrl, 5000);
    hasRobotsTxt = robotsRes.statusCode === 200 && robotsRes.html.toLowerCase().includes('user-agent');
    hasSitemap = robotsRes.html.toLowerCase().includes('sitemap:') || false;
    if (!hasSitemap) {
      try {
        const sitemapUrl = `${parsedUrl.protocol}//${parsedUrl.host}/sitemap.xml`;
        const sitemapRes = await fetchUrl(sitemapUrl, 5000);
        hasSitemap = sitemapRes.statusCode === 200 && sitemapRes.html.includes('<urlset');
      } catch { hasSitemap = false; }
    }
  } catch { hasRobotsTxt = undefined; hasSitemap = undefined; }

  // Detect small text (simple heuristic)
  const textTooSmall = $('*').filter((_, el) => {
    const fontSize = $(el).css('font-size');
    return fontSize !== undefined && parseInt(fontSize) < 12;
  }).length > 0;

  // Calculate scores and items
  const performanceItems = analyzePerformance(
    responseTime,
    responseSize,
    scriptCount,
    stylesheetCount,
    domElements,
    images,
    inlineStyles,
    htmlSize
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
    externalLinks,
    hasRobotsTxt,
    hasSitemap,
    hasStructuredData,
    wordCount,
    url
  );
  const accessibilityItems = analyzeAccessibility(
    hasHtmlLang,
    hasCharset,
    hasViewport,
    hasAltOnAllImages,
    images,
    $,
    hasTouchIcons,
    iframeCount
  );
  const securityItems = analyzeSecurity(
    httpsRedirect,
    mixedContent,
    iframeCount,
    $,
    html
  );

  const performanceScore = calculateScore(performanceItems);
  const seoScore = calculateScore(seoItems);
  const accessibilityScore = calculateScore(accessibilityItems);
  const securityScore = calculateScore(securityItems);
  const globalScore = Math.round((performanceScore + seoScore + accessibilityScore + securityScore) / 4);

  // Generate prioritized action plan
  const allItems = [
    ...performanceItems.map(i => ({ ...i, cat: "Performance" })),
    ...seoItems.map(i => ({ ...i, cat: "SEO" })),
    ...accessibilityItems.map(i => ({ ...i, cat: "Accessibilité" })),
    ...securityItems.map(i => ({ ...i, cat: "Sécurité" })),
  ];

  const priorities = generatePriorities(allItems);

  return {
    url,
    timestamp: new Date().toISOString(),
    id,
    globalScore,
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
    security: {
      score: securityScore,
      label: getScoreLabel(securityScore),
      color: getScoreColor(securityScore),
      items: securityItems,
    },
    priorities,
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
        nofollow: nofollowLinks,
      },
      mobile: {
        hasViewport,
        isResponsive: hasViewport,
        hasTouchIcons,
        textTooSmall,
      },
      technologies,
      htmlSize,
      domElements,
      hasRobotsTxt,
      hasSitemap,
      hasFavicon,
      hasStructuredData,
      httpsRedirect,
      mixedContent,
      inlineStyles,
      iframeCount,
      wordCount,
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
    const loading = $(el).attr("loading") || "";
    images.push({
      src: src.substring(0, 200),
      alt: alt.substring(0, 200),
      hasAlt: alt.length > 0,
      isLazy: loading === "lazy",
    });
  });
  return images.slice(0, 100);
}

function detectTechnologies($: cheerio.CheerioAPI, html: string): string[] {
  const techs: string[] = [];
  if (html.includes('__next') || html.includes('_next/static')) techs.push('Next.js');
  if (html.includes('__nuxt') || html.includes('/_nuxt/')) techs.push('Nuxt.js');
  if ($('meta[name="generator"]').attr('content')?.includes('WordPress')) techs.push('WordPress');
  if ($('meta[name="generator"]').attr('content')?.includes('Shopify')) techs.push('Shopify');
  if ($('meta[name="generator"]').attr('content')?.includes('Wix')) techs.push('Wix');
  if (html.includes('wp-content') || html.includes('wp-includes')) techs.push('WordPress');
  if (html.includes('cdn.shopify.com')) techs.push('Shopify');
  if (html.includes('squarespace.com')) techs.push('Squarespace');
  if (html.includes('webflow.com') || html.includes('wf-')) techs.push('Webflow');
  if (html.includes('react') || html.includes('__REACT')) techs.push('React');
  if (html.includes('vue') || html.includes('__VUE')) techs.push('Vue.js');
  if (html.includes('angular') || $('[ng-app], [ng-controller]').length > 0) techs.push('Angular');
  if (html.includes('jquery') || html.includes('jQuery')) techs.push('jQuery');
  if (html.includes('bootstrap')) techs.push('Bootstrap');
  if (html.includes('tailwind')) techs.push('Tailwind CSS');
  if (html.includes('gtag') || html.includes('google-analytics') || html.includes('GA_MEASUREMENT_ID')) techs.push('Google Analytics');
  if (html.includes('gtm.js') || html.includes('googletagmanager')) techs.push('Google Tag Manager');
  if (html.includes('hotjar')) techs.push('Hotjar');
  if (html.includes('fbevents') || html.includes('facebook.net')) techs.push('Facebook Pixel');
  if (html.includes('cloudflare')) techs.push('Cloudflare');
  return Array.from(new Set(techs));
}

function analyzePerformance(
  responseTime: number,
  pageSize: number,
  scriptCount: number,
  stylesheetCount: number,
  domElements: number,
  images: ImageInfo[],
  inlineStyles: number,
  htmlSize: number
): AuditItem[] {
  const items: AuditItem[] = [];

  // Response time
  items.push({
    title: "Temps de réponse du serveur",
    description:
      responseTime < 600
        ? `Excellent : ${responseTime}ms — Le serveur répond rapidement.`
        : responseTime < 2000
        ? `Acceptable : ${responseTime}ms. Visez moins de 600ms pour une expérience optimale.`
        : `Lent : ${responseTime}ms. Le serveur met trop de temps à répondre. Cela impacte directement votre taux de rebond.`,
    status: responseTime < 600 ? "pass" : responseTime < 2000 ? "warning" : "fail",
    value: `${responseTime}ms`,
    impact: responseTime >= 2000 ? "high" : responseTime >= 600 ? "medium" : "low",
    recommendation: responseTime >= 600 ? "Utilisez un CDN, activez la mise en cache serveur, ou passez à un hébergement plus performant." : undefined,
  });

  // Page size
  items.push({
    title: "Taille de la page",
    description:
      pageSize < 500000
        ? `Bonne taille : ${(pageSize / 1024).toFixed(0)} KB — Page légère et rapide.`
        : pageSize < 2000000
        ? `Page volumineuse : ${(pageSize / 1024).toFixed(0)} KB. Optimisez les ressources pour descendre sous 500 KB.`
        : `Page très lourde : ${(pageSize / 1048576).toFixed(1)} MB. Cela augmente significativement le temps de chargement.`,
    status: pageSize < 500000 ? "pass" : pageSize < 2000000 ? "warning" : "fail",
    value: `${(pageSize / 1024).toFixed(0)} KB`,
    impact: pageSize >= 2000000 ? "high" : pageSize >= 500000 ? "medium" : "low",
    recommendation: pageSize >= 500000 ? "Compressez les images, minifiez le CSS/JS, activez la compression Gzip/Brotli." : undefined,
  });

  // Scripts
  items.push({
    title: "Nombre de scripts JavaScript",
    description:
      scriptCount <= 5
        ? `${scriptCount} scripts trouvés. Bien optimisé.`
        : scriptCount <= 15
        ? `${scriptCount} scripts trouvés. Envisagez de regrouper (bundle) ou de différer certains scripts avec defer/async.`
        : `${scriptCount} scripts trouvés. Trop de scripts bloquent le rendu et ralentissent l'affichage initial.`,
    status: scriptCount <= 5 ? "pass" : scriptCount <= 15 ? "warning" : "fail",
    value: `${scriptCount}`,
    impact: scriptCount > 15 ? "high" : scriptCount > 5 ? "medium" : "low",
    recommendation: scriptCount > 5 ? "Regroupez vos scripts avec un bundler (Webpack, Vite), utilisez defer/async, et supprimez les scripts inutilisés." : undefined,
  });

  // Stylesheets
  items.push({
    title: "Feuilles de styles CSS",
    description:
      stylesheetCount <= 3
        ? `${stylesheetCount} feuilles de styles — Bien.`
        : `${stylesheetCount} feuilles de styles. Chaque fichier CSS ajoute une requête HTTP et bloque le rendu.`,
    status: stylesheetCount <= 3 ? "pass" : "warning",
    value: `${stylesheetCount}`,
    impact: stylesheetCount > 3 ? "medium" : "low",
    recommendation: stylesheetCount > 3 ? "Regroupez vos fichiers CSS en un seul, supprimez le CSS inutilisé (PurgeCSS)." : undefined,
  });

  // DOM complexity
  items.push({
    title: "Complexité du DOM",
    description:
      domElements < 800
        ? `${domElements} éléments — DOM léger et performant.`
        : domElements < 1500
        ? `${domElements} éléments — Acceptable, mais pourrait être optimisé.`
        : `${domElements} éléments — DOM très complexe. Cela ralentit le rendu et la réactivité.`,
    status: domElements < 800 ? "pass" : domElements < 1500 ? "warning" : "fail",
    value: `${domElements}`,
    impact: domElements >= 1500 ? "medium" : "low",
    recommendation: domElements >= 1500 ? "Simplifiez la structure HTML, utilisez la virtualisation pour les longues listes." : undefined,
  });

  // Lazy loading images
  const totalImages = images.length;
  const lazyImages = images.filter(i => i.isLazy).length;
  if (totalImages > 3) {
    items.push({
      title: "Chargement différé des images (lazy loading)",
      description:
        lazyImages >= totalImages * 0.5
          ? `${lazyImages}/${totalImages} images utilisent loading="lazy". Bon.`
          : `Seulement ${lazyImages}/${totalImages} images utilisent loading="lazy". Les images hors écran devraient être chargées tardivement.`,
      status: lazyImages >= totalImages * 0.5 ? "pass" : "warning",
      value: `${lazyImages}/${totalImages}`,
      impact: lazyImages < totalImages * 0.5 ? "medium" : "low",
      recommendation: lazyImages < totalImages * 0.5 ? "Ajoutez loading=\"lazy\" sur les images qui ne sont pas visibles immédiatement (below the fold)." : undefined,
    });
  }

  // Inline styles
  if (inlineStyles > 10) {
    items.push({
      title: "Styles en ligne excessifs",
      description: `${inlineStyles} éléments avec des styles en ligne. Cela augmente le poids HTML et empêche la mise en cache CSS.`,
      status: inlineStyles > 30 ? "fail" : "warning",
      value: `${inlineStyles}`,
      impact: "low",
      recommendation: "Déplacez les styles en ligne vers des classes CSS dédiées.",
    });
  }

  // HTML size vs total size
  if (htmlSize > 100000) {
    items.push({
      title: "Taille du HTML brut",
      description: `Le HTML fait ${(htmlSize / 1024).toFixed(0)} KB. Un HTML trop volumineux peut indiquer du code en ligne inutile ou du HTML non optimisé.`,
      status: htmlSize > 200000 ? "fail" : "warning",
      value: `${(htmlSize / 1024).toFixed(0)} KB`,
      impact: "medium",
      recommendation: "Réduisez le HTML en extrayant les styles et scripts en ligne vers des fichiers externes.",
    });
  }

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
  externalLinks: number,
  hasRobotsTxt: boolean | undefined,
  hasSitemap: boolean | undefined,
  hasStructuredData: boolean,
  wordCount: number,
  url: string
): AuditItem[] {
  const items: AuditItem[] = [];

  // Title
  items.push({
    title: "Balise titre",
    description: !title
      ? "Aucune balise <title> trouvée. C'est essentiel pour le SEO — Google l'utilise comme titre dans les résultats de recherche."
      : title.length < 30
      ? `Titre trop court (${title.length} car.). Visez 50-60 caractères pour maximiser votre visibilité. Titre actuel : "${title}"`
      : title.length > 60
      ? `Titre trop long (${title.length} car.). Google tronquera après ~60 caractères. Titre actuel : "${title}"`
      : `Titre bien optimisé (${title.length} car.) : "${title}"`,
    status: !title
      ? "fail"
      : title.length >= 30 && title.length <= 60
      ? "pass"
      : "warning",
    value: title || "Manquant",
    impact: !title ? "high" : "medium",
    recommendation: !title ? "Ajoutez une balise <title> descriptive avec votre mot-clé principal." : undefined,
  });

  // Meta description
  items.push({
    title: "Meta description",
    description: !metaDescription
      ? "Meta description manquante. Google affichera un extrait aléatoire — vous perdez le contrôle de votre snippet."
      : metaDescription.length < 120
      ? `Trop courte (${metaDescription.length} car.). Visez 150-160 caractères pour maximiser le CTR.`
      : metaDescription.length > 160
      ? `Trop longue (${metaDescription.length} car.). Google la tronquera.`
      : `Bien optimisée (${metaDescription.length} car.).`,
    status: !metaDescription
      ? "fail"
      : metaDescription.length >= 120 && metaDescription.length <= 160
      ? "pass"
      : "warning",
    impact: !metaDescription ? "high" : "medium",
    recommendation: !metaDescription ? "Rédigez une meta description engageante de 150-160 car. avec un appel à l'action." : undefined,
  });

  // H1
  items.push({
    title: "Balise H1",
    description: !hasH1
      ? "Aucune balise H1 trouvée. Le H1 est le titre principal de votre page — essentiel pour le SEO."
      : h1Count > 1
      ? `${h1Count} balises H1 trouvées. Il devrait n'y en avoir qu'une seule par page pour éviter de diluer le signal SEO.`
      : "Balise H1 présente et unique. Parfait.",
    status: !hasH1 ? "fail" : h1Count === 1 ? "pass" : "warning",
    impact: !hasH1 ? "high" : "medium",
    recommendation: !hasH1 ? "Ajoutez un unique H1 contenant votre mot-clé cible." : undefined,
  });

  // Heading hierarchy
  const hasProperHierarchy =
    headings.length > 0 && headings[0]?.tag === "h1";
  items.push({
    title: "Hiérarchie des titres",
    description: hasProperHierarchy
      ? `${headings.length} titres trouvés avec une hiérarchie correcte (H1 → H2 → H3...).`
      : "La hiérarchie des titres n'est pas optimale. Le premier titre devrait être un H1, suivi de H2, H3, etc.",
    status: hasProperHierarchy ? "pass" : "warning",
    impact: "medium",
    recommendation: !hasProperHierarchy ? "Restructurez vos titres : H1 → H2 → H3 dans l'ordre hiérarchique." : undefined,
  });

  // Images alt
  const imagesWithoutAlt = images.filter((img) => !img.hasAlt);
  items.push({
    title: "Attributs alt des images",
    description:
      images.length === 0
        ? "Aucune image trouvée sur la page."
        : imagesWithoutAlt.length === 0
        ? `${images.length} images, toutes avec des attributs alt. Excellent pour le SEO et l'accessibilité.`
        : `${imagesWithoutAlt.length}/${images.length} images sans attribut alt. Google ne peut pas « lire » ces images.`,
    status:
      images.length === 0 || imagesWithoutAlt.length === 0
        ? "pass"
        : imagesWithoutAlt.length <= 2
        ? "warning"
        : "fail",
    impact: imagesWithoutAlt.length > 2 ? "high" : "medium",
    recommendation: imagesWithoutAlt.length > 0 ? "Ajoutez un attribut alt descriptif à chaque image incluant des mots-clés pertinents." : undefined,
  });

  // Open Graph
  items.push({
    title: "Balises Open Graph",
    description: hasOpenGraph
      ? "Balises Open Graph présentes — Le partage sur Facebook, LinkedIn et Twitter sera optimisé."
      : "Pas de balises Open Graph. Vos pages seront mal présentées quand partagées sur les réseaux sociaux.",
    status: hasOpenGraph ? "pass" : "warning",
    impact: "medium",
    recommendation: !hasOpenGraph ? "Ajoutez og:title, og:description, og:image et og:url." : undefined,
  });

  // Canonical
  items.push({
    title: "URL canonique",
    description: canonicalUrl
      ? "URL canonique définie — Évite le contenu dupliqué et renforce l'autorité SEO."
      : "Pas d'URL canonique. Risque de contenu dupliqué si votre page est accessible via plusieurs URLs.",
    status: canonicalUrl ? "pass" : "warning",
    impact: "medium",
    recommendation: !canonicalUrl ? "Ajoutez <link rel=\"canonical\" href=\"URL\"> pour indiquer l'URL préférée." : undefined,
  });

  // Links
  items.push({
    title: "Maillage interne",
    description:
      internalLinks >= 3
        ? `${internalLinks} liens internes — Bon maillage. Aide Google à explorer votre site.`
        : `Seulement ${internalLinks} liens internes. Un bon maillage interne aide Google à découvrir toutes vos pages.`,
    status: internalLinks >= 3 ? "pass" : "warning",
    impact: internalLinks < 3 ? "medium" : "low",
    recommendation: internalLinks < 3 ? "Ajoutez des liens vers vos autres pages importantes dans le contenu." : undefined,
  });

  // Robots.txt
  if (hasRobotsTxt !== undefined) {
    items.push({
      title: "Fichier robots.txt",
      description: hasRobotsTxt
        ? "Le fichier robots.txt est présent et correctement configuré."
        : "Pas de fichier robots.txt. Google ne sait pas quelles pages explorer ou ignorer.",
      status: hasRobotsTxt ? "pass" : "warning",
      impact: "medium",
      recommendation: !hasRobotsTxt ? "Créez un fichier robots.txt à la racine de votre site avec les directives User-agent et Sitemap." : undefined,
    });
  }

  // Sitemap
  if (hasSitemap !== undefined) {
    items.push({
      title: "Sitemap XML",
      description: hasSitemap
        ? "Sitemap XML détecté — Aide Google à indexer efficacement votre site."
        : "Pas de sitemap XML. Google peut avoir du mal à découvrir toutes vos pages.",
      status: hasSitemap ? "pass" : "warning",
      impact: "medium",
      recommendation: !hasSitemap ? "Générez un sitemap.xml et référencez-le dans votre robots.txt." : undefined,
    });
  }

  // Structured data
  items.push({
    title: "Données structurées (Schema.org)",
    description: hasStructuredData
      ? "Données structurées détectées — Permet l'affichage de rich snippets dans Google (étoiles, prix, FAQ...)."
      : "Aucune donnée structurée. Vous passez à côté des rich snippets qui augmentent le CTR de 20-30%.",
    status: hasStructuredData ? "pass" : "warning",
    impact: "medium",
    recommendation: !hasStructuredData ? "Ajoutez du JSON-LD (Organization, WebPage, FAQ...) pour obtenir des rich snippets." : undefined,
  });

  // Word count (content thinness)
  items.push({
    title: "Contenu textuel",
    description:
      wordCount >= 300
        ? `${wordCount} mots détectés — Contenu suffisamment riche pour le SEO.`
        : wordCount >= 100
        ? `${wordCount} mots détectés — Contenu un peu léger. Google préfère les pages avec au moins 300 mots.`
        : `${wordCount} mots détectés — Contenu très faible. Les pages avec peu de texte ont du mal à se positionner.`,
    status: wordCount >= 300 ? "pass" : wordCount >= 100 ? "warning" : "fail",
    value: `${wordCount} mots`,
    impact: wordCount < 100 ? "high" : wordCount < 300 ? "medium" : "low",
    recommendation: wordCount < 300 ? "Enrichissez votre page avec du contenu qualitatif de 300+ mots ciblant vos mots-clés." : undefined,
  });

  // HTTPS
  items.push({
    title: "HTTPS",
    description: url.startsWith("https://")
      ? "Le site utilise HTTPS — C'est un facteur de classement Google."
      : "Le site n'utilise pas HTTPS. Google pénalise les sites non sécurisés dans le classement.",
    status: url.startsWith("https://") ? "pass" : "fail",
    impact: !url.startsWith("https://") ? "high" : "low",
    recommendation: !url.startsWith("https://") ? "Installez un certificat SSL et redirigez HTTP vers HTTPS." : undefined,
  });

  return items;
}

function analyzeAccessibility(
  hasHtmlLang: boolean,
  hasCharset: boolean,
  hasViewport: boolean,
  hasAltOnAllImages: boolean,
  images: ImageInfo[],
  $: cheerio.CheerioAPI,
  hasTouchIcons: boolean,
  iframeCount: number
): AuditItem[] {
  const items: AuditItem[] = [];

  items.push({
    title: "Attribut lang sur <html>",
    description: hasHtmlLang
      ? "L'attribut lang est présent — Les lecteurs d'écran identifient la langue correctement."
      : "L'attribut lang est manquant. Les lecteurs d'écran ne pourront pas identifier la langue de la page.",
    status: hasHtmlLang ? "pass" : "fail",
    impact: !hasHtmlLang ? "high" : "low",
    recommendation: !hasHtmlLang ? "Ajoutez <html lang=\"fr\"> (ou la langue appropriée) sur la balise html." : undefined,
  });

  items.push({
    title: "Encodage des caractères",
    description: hasCharset
      ? "Encodage UTF-8 déclaré — Les caractères spéciaux s'affichent correctement."
      : "Aucun encodage déclaré. Les caractères accentués peuvent ne pas s'afficher.",
    status: hasCharset ? "pass" : "fail",
    impact: !hasCharset ? "medium" : "low",
    recommendation: !hasCharset ? "Ajoutez <meta charset=\"utf-8\"> dans le <head>." : undefined,
  });

  items.push({
    title: "Meta viewport (mobile)",
    description: hasViewport
      ? "La meta viewport est présente — Le site s'adapte aux mobiles."
      : "Meta viewport manquante. Le site ne sera pas optimisé pour les smartphones et tablettes (55%+ du trafic web).",
    status: hasViewport ? "pass" : "fail",
    impact: !hasViewport ? "high" : "low",
    recommendation: !hasViewport ? "Ajoutez <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">." : undefined,
  });

  items.push({
    title: "Images avec texte alternatif",
    description: hasAltOnAllImages
      ? images.length > 0
        ? `Toutes les ${images.length} images ont un texte alternatif — Excellent pour l'accessibilité.`
        : "Aucune image sur la page."
      : `${images.filter(i => !i.hasAlt).length} images sans texte alternatif. Les personnes malvoyantes ne peuvent pas les comprendre.`,
    status: hasAltOnAllImages ? "pass" : "fail",
    impact: !hasAltOnAllImages ? "high" : "low",
    recommendation: !hasAltOnAllImages ? "Ajoutez un attribut alt décrivant le contenu de chaque image." : undefined,
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
          ? "Tous les champs de formulaire ont des labels associés — Accessible aux lecteurs d'écran."
          : `${inputsWithoutLabel.length} champs sans label. Les utilisateurs de lecteurs d'écran ne pourront pas comprendre ces champs.`,
      status: inputsWithoutLabel.length === 0 ? "pass" : "fail",
      impact: inputsWithoutLabel.length > 0 ? "high" : "low",
      recommendation: inputsWithoutLabel.length > 0 ? "Associez un <label for=\"id\"> ou un aria-label à chaque champ de formulaire." : undefined,
    });
  }

  // Check for skip navigation
  const hasSkipNav =
    $('a[href="#main"], a[href="#content"], [class*="skip"]').length > 0;
  items.push({
    title: "Lien d'évitement (skip nav)",
    description: hasSkipNav
      ? "Un lien d'évitement est présent — Facilite la navigation au clavier."
      : "Pas de lien d'évitement. Les utilisateurs au clavier doivent parcourir tout le menu à chaque page.",
    status: hasSkipNav ? "pass" : "warning",
    impact: "low",
    recommendation: !hasSkipNav ? "Ajoutez <a href=\"#main\" class=\"sr-only\">Aller au contenu</a> en début de page." : undefined,
  });

  // ARIA landmarks
  const hasLandmarks = $('main, [role="main"], nav, [role="navigation"], footer, [role="contentinfo"]').length >= 2;
  items.push({
    title: "Régions ARIA / landmarks",
    description: hasLandmarks
      ? "Les landmarks HTML5/ARIA sont utilisés — Navigation structurée pour les technologies d'assistance."
      : "Peu ou pas de landmarks (main, nav, footer). Les technologies d'assistance ne peuvent pas naviguer par sections.",
    status: hasLandmarks ? "pass" : "warning",
    impact: "medium",
    recommendation: !hasLandmarks ? "Utilisez les balises sémantiques <main>, <nav>, <footer>, <header>, <aside>." : undefined,
  });

  // Touch icons
  items.push({
    title: "Icône mobile (apple-touch-icon)",
    description: hasTouchIcons
      ? "Apple touch icon présent — Icône personnalisée quand le site est ajouté à l'écran d'accueil."
      : "Pas d'icône mobile. L'icône par défaut sera utilisée si quelqu'un ajoute votre site à son écran d'accueil.",
    status: hasTouchIcons ? "pass" : "warning",
    impact: "low",
    recommendation: !hasTouchIcons ? "Ajoutez <link rel=\"apple-touch-icon\" href=\"/icon-180.png\">." : undefined,
  });

  // Buttons with accessible text
  const buttonsWithoutText = $('button, [role="button"]').filter((_, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr("aria-label") || "";
    const title = $(el).attr("title") || "";
    return !text && !ariaLabel && !title;
  });
  if (buttonsWithoutText.length > 0) {
    items.push({
      title: "Boutons accessibles",
      description: `${buttonsWithoutText.length} boutons sans texte ni aria-label. Les lecteurs d'écran annoncent \"bouton\" sans contexte.`,
      status: "fail",
      impact: "high",
      recommendation: "Ajoutez un texte visible ou un aria-label descriptif à chaque bouton.",
    });
  }

  // Iframes
  if (iframeCount > 0) {
    const iframesWithoutTitle = $('iframe').filter((_, el) => !$(el).attr('title'));
    items.push({
      title: "Iframes accessibles",
      description: iframesWithoutTitle.length === 0
        ? `${iframeCount} iframe(s) avec attribut title — Accessible.`
        : `${iframesWithoutTitle.length}/${iframeCount} iframes sans attribut title.`,
      status: iframesWithoutTitle.length === 0 ? "pass" : "warning",
      impact: "low",
      recommendation: iframesWithoutTitle.length > 0 ? "Ajoutez un attribut title descriptif à chaque iframe." : undefined,
    });
  }

  return items;
}

function analyzeSecurity(
  httpsRedirect: boolean,
  mixedContent: boolean,
  iframeCount: number,
  $: cheerio.CheerioAPI,
  html: string
): AuditItem[] {
  const items: AuditItem[] = [];

  // HTTPS
  items.push({
    title: "Connexion HTTPS",
    description: httpsRedirect
      ? "Le site utilise HTTPS — Les données sont chiffrées entre le serveur et l'utilisateur."
      : "Le site n'utilise pas HTTPS. Les données transitent en clair — Google Chrome affiche \"Non sécurisé\".",
    status: httpsRedirect ? "pass" : "fail",
    impact: !httpsRedirect ? "high" : "low",
    recommendation: !httpsRedirect ? "Installez un certificat SSL (gratuit avec Let's Encrypt) et forcez la redirection HTTPS." : undefined,
  });

  // Mixed content
  if (httpsRedirect) {
    items.push({
      title: "Contenu mixte (HTTP sur HTTPS)",
      description: mixedContent
        ? "⚠️ Du contenu HTTP est chargé sur une page HTTPS. Le cadenas peut ne pas apparaître."
        : "Pas de contenu mixte — Toutes les ressources se chargent en HTTPS.",
      status: mixedContent ? "fail" : "pass",
      impact: mixedContent ? "high" : "low",
      recommendation: mixedContent ? "Remplacez toutes les URLs http:// par https:// ou utilisez des URLs relatives." : undefined,
    });
  }

  // External scripts
  const externalScripts = $('script[src]').filter((_, el) => {
    const src = $(el).attr('src') || '';
    return src.startsWith('http') && !src.includes(new URL(`https://placeholder.com`).hostname);
  });
  items.push({
    title: "Scripts externes",
    description: externalScripts.length <= 3
      ? `${externalScripts.length} scripts externes — Maîtrisé.`
      : `${externalScripts.length} scripts externes — Chaque script tiers est un risque potentiel de sécurité et de confidentialité.`,
    status: externalScripts.length <= 3 ? "pass" : "warning",
    impact: externalScripts.length > 5 ? "medium" : "low",
    recommendation: externalScripts.length > 3 ? "Auditez les scripts tiers, utilisez des attributs integrity (SRI) et réduisez les dépendances externes." : undefined,
  });

  // Content Security Policy
  const hasCSP = $('meta[http-equiv="Content-Security-Policy"]').length > 0;
  items.push({
    title: "Content Security Policy (CSP)",
    description: hasCSP
      ? "Une politique CSP est définie via meta tag. Bon premier pas."
      : "Aucune Content Security Policy détectée dans le HTML. Votre site est plus vulnérable aux attaques XSS.",
    status: hasCSP ? "pass" : "warning",
    impact: "medium",
    recommendation: !hasCSP ? "Ajoutez une en-tête Content-Security-Policy via votre serveur ou hébergeur." : undefined,
  });

  // X-Frame-Options / frame-ancestors (check meta)
  const hasXFrameOptions = html.includes('X-Frame-Options') || $('meta[http-equiv="X-Frame-Options"]').length > 0;
  // Note: headers can't be checked from HTML alone, this is a best-effort check

  // Iframes from external sources
  if (iframeCount > 0) {
    items.push({
      title: "Iframes externes",
      description: `${iframeCount} iframe(s) détectée(s). Les iframes peuvent être utilisées pour du clickjacking si non protégées.`,
      status: iframeCount <= 2 ? "warning" : "fail",
      impact: "low",
      recommendation: "Vérifiez que les iframes proviennent de sources de confiance. Utilisez l'attribut sandbox.",
    });
  }

  // Email addresses exposed
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const exposedEmails = html.match(emailRegex);
  if (exposedEmails && exposedEmails.length > 0) {
    items.push({
      title: "Adresses email exposées",
      description: `${exposedEmails.length} adresse(s) email visible(s) dans le code source. Les bots spam les collectent.`,
      status: "warning",
      impact: "low",
      recommendation: "Utilisez un formulaire de contact ou obfusquez l'email (ex: contact [at] domain.com).",
    });
  }

  // Favicon (trust signal)
  const hasFav = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
  items.push({
    title: "Favicon",
    description: hasFav
      ? "Un favicon est défini — Renforce la crédibilité et la reconnaissance dans les onglets."
      : "Pas de favicon. Un onglet sans icône paraît moins professionnel et digne de confiance.",
    status: hasFav ? "pass" : "warning",
    impact: "low",
    recommendation: !hasFav ? "Ajoutez un favicon en 32x32 et 16x16 dans votre <head>." : undefined,
  });

  return items;
}

function generatePriorities(allItems: (AuditItem & { cat: string })[]): PriorityAction[] {
  const priorities: PriorityAction[] = [];
  let priority = 1;

  // Sort: fail + high impact first, then fail + medium, then warning + high, etc.
  const impactWeight = { high: 3, medium: 2, low: 1 };
  const statusWeight = { fail: 10, warning: 3, pass: 0 };

  const issues = allItems
    .filter(i => i.status !== "pass" && i.recommendation)
    .sort((a, b) => {
      const scoreA = statusWeight[a.status] + impactWeight[a.impact || "medium"];
      const scoreB = statusWeight[b.status] + impactWeight[b.impact || "medium"];
      return scoreB - scoreA;
    });

  for (const issue of issues.slice(0, 15)) {
    const effort = issue.impact === "high" ? "easy" as const :
                   issue.impact === "medium" ? "medium" as const : "easy" as const;
    priorities.push({
      priority: priority++,
      title: issue.title,
      description: issue.recommendation || issue.description,
      impact: issue.impact || "medium",
      category: issue.cat,
      effort,
    });
  }

  return priorities;
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
