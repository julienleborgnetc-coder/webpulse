# ⚡ WebPulse — Audit de site web instantané

> Analysez les performances, le SEO et l'accessibilité de n'importe quel site web en 30 secondes.  
> Obtenez un rapport professionnel prêt à présenter à vos clients.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table des matières

1. [Contexte du projet](#-contexte-du-projet)
2. [Processus de décision](#-processus-de-décision)
3. [Fonctionnalités](#-fonctionnalités)
4. [Architecture technique](#-architecture-technique)
5. [Structure des fichiers](#-structure-des-fichiers)
6. [Stack technique](#-stack-technique)
7. [Comment ça marche](#-comment-ça-marche)
8. [Modèle économique](#-modèle-économique)
9. [Installation et développement](#-installation-et-développement)
10. [Déploiement sur Vercel](#-déploiement-sur-vercel)
11. [Configuration Stripe](#-configuration-stripe)
12. [SEO & Optimisations](#-seo--optimisations)
13. [Prochaines étapes](#-prochaines-étapes)
14. [Rapport de projet](#-rapport-de-projet)

---

## 📋 Contexte du projet

**Objectif** : Créer une entreprise en ligne rentable, sans stock physique, avec un budget de 0 €, en utilisant uniquement des technologies gratuites, et capable de générer des revenus en moins de 7 jours.

**Contraintes** :
- Budget : 0 € (solutions gratuites uniquement)
- Zéro stock / tout dématérialisé
- Automatisation maximale
- Stack moderne et gratuite
- Code versionné sur GitHub

---

## 🧠 Processus de décision

### Idéation

10 idées de business sans stock ont été évaluées selon 6 critères (facilité technique, coût, temps de dev, taille marché, concurrence, modèle de revenus) sur une échelle de /5 :

| # | Idée | Score /30 |
|---|------|-----------|
| 1 | Générateur de prompts IA premium | 24 |
| 2 | Résumeur de PDF par IA (micro-SaaS) | 20 |
| 3 | Templates Notion/Airtable premium | 23 |
| 4 | Générateur de méta-descriptions SEO | 19 |
| 5 | Cours/eBook sur l'automatisation IA | 21 |
| 6 | Générateur de landing pages par IA | 19 |
| **7** | **Audit automatisé de sites web** | **26** |
| 8 | Marketplace de services freelance | 16 |
| 9 | Outil de transformation d'images | 23 |
| 10 | Générateur de factures/devis en ligne | 24 |

### Pourquoi l'audit de site web ?

- **Score le plus élevé (26/30)** — meilleur équilibre entre tous les critères
- **Marché énorme** — tout propriétaire de site (millions) a besoin d'audit performance/SEO
- **Modèle freemium éprouvé** — audit gratuit limité → rapport complet payant (9 €)
- **Pas de coût d'API** — analyse algorithmique (pas de LLM nécessaire)
- **Client type** — freelances web, agences digitales, PME
- **Différenciateur** — rapport professionnel HTML/PDF combinant perf + SEO + accessibilité en un clic

---

## ✨ Fonctionnalités

### Gratuit (sans inscription)
- ✅ Score de performance (temps de réponse, taille page, scripts, CSS)
- ✅ Score SEO (title, meta description, H1, headings, images alt, Open Graph, canonical, liens)
- ✅ Score d'accessibilité (lang, charset, viewport, alt, labels, skip nav)
- ✅ Aperçu des 5 principaux problèmes détectés
- ✅ Métriques clés (temps de chargement, taille page, etc.)

### Pro — 9 € par rapport
- ✅ Tout du plan Gratuit
- ✅ Rapport HTML professionnel téléchargeable (imprimable en PDF)
- ✅ Tous les problèmes détaillés avec recommandations
- ✅ Structure des headings visualisée
- ✅ Métriques complètes (liens internes/externes, images, titres)
- ✅ Badge « Site Audité par WebPulse »

---

## 🏗 Architecture technique

```
┌─────────────────────────────────────────────────┐
│                   UTILISATEUR                    │
│              (navigateur web)                    │
└──────────────┬──────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────┐
│           VERCEL (Next.js 14 App Router)         │
│                                                  │
│  Pages (React + Tailwind CSS)                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Landing  │  │ Résultats │  │   Pricing    │ │
│  │  + Hero  │  │  d'audit  │  │   Section    │ │
│  └──────────┘  └───────────┘  └──────────────┘ │
│                                                  │
│  API Routes (serverless functions)               │
│  ┌──────────────────────────────────────────┐   │
│  │  POST /api/audit   → analyse du site     │   │
│  │  GET  /api/report  → rapport HTML Pro    │   │
│  │  POST /api/checkout→ session Stripe      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Moteur d'analyse                                │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐     │
│  │ Node.js  │  │ Cheerio  │  │  Stripe   │     │
│  │  https   │  │ (parser) │  │   API     │     │
│  └──────────┘  └──────────┘  └───────────┘     │
└─────────────────────────────────────────────────┘
```

### Flux de données

1. L'utilisateur entre une URL dans le formulaire
2. `POST /api/audit` → le serveur fetch la page via `https` natif Node.js
3. Le HTML est parsé avec **Cheerio** (jQuery-like côté serveur)
4. 3 catégories d'analyse (performance, SEO, accessibilité) produisent chacune des items (pass / warning / fail)
5. Un score /100 est calculé par catégorie
6. Les résultats sont stockés en mémoire (clé = ID unique) et renvoyés au client
7. L'utilisateur voit les scores + 5 problèmes gratuits
8. Pour le rapport complet : `GET /api/report?id=XXX` → HTML professionnel
9. Paiement via `POST /api/checkout` → Stripe Checkout

---

## 📁 Structure des fichiers

```
webpulse/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── audit/route.ts       # API d'audit (POST) — cœur du produit
│   │   │   ├── checkout/route.ts     # Création de session Stripe
│   │   │   └── report/route.ts       # Génération du rapport HTML Pro
│   │   ├── globals.css               # Styles globaux + Tailwind
│   │   ├── layout.tsx                # Layout racine (meta, JSON-LD, fonts)
│   │   ├── page.tsx                  # Page principale (SPA-like)
│   │   ├── robots.ts                 # Génération dynamique de robots.txt
│   │   └── sitemap.ts                # Génération dynamique de sitemap.xml
│   ├── components/
│   │   ├── AuditForm.tsx             # Formulaire de saisie d'URL
│   │   ├── Footer.tsx                # Pied de page
│   │   ├── Header.tsx                # Navigation + logo
│   │   ├── Hero.tsx                  # Section héro (titre + accroche)
│   │   ├── PricingSection.tsx        # Grille tarifaire (Gratuit vs Pro)
│   │   ├── ResultsSection.tsx        # Affichage des résultats d'audit
│   │   ├── ScoreGauge.tsx            # Jauge circulaire SVG animée
│   │   └── SocialProof.tsx           # Compteur d'audits + témoignages
│   └── lib/
│       ├── auditor.ts                # Moteur d'analyse (460 lignes)
│       ├── store.ts                  # Store en mémoire (MVP)
│       └── types.ts                  # Types TypeScript partagés
├── .env.example                      # Template des variables d'environnement
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔧 Stack technique

| Composant | Technologie | Coût |
|-----------|-------------|------|
| Framework | Next.js 14 (App Router, SSR) | Gratuit |
| Langage | TypeScript 5 | Gratuit |
| UI/CSS | Tailwind CSS 3 | Gratuit |
| Parsing HTML | Cheerio | Gratuit |
| HTTP client | Module `https` natif Node.js | Gratuit |
| Paiement | Stripe Checkout | 1.4% + 0.25€/tx |
| Hébergement | Vercel (free tier) | Gratuit |
| Versioning | Git + GitHub | Gratuit |
| SEO | robots.ts, sitemap.ts, JSON-LD | Gratuit |

**Coût total de fonctionnement : 0 €** (hors commissions Stripe sur les ventes)

---

## ⚙️ Comment ça marche

### Le moteur d'audit (`src/lib/auditor.ts`)

Le cœur du produit est l'analyseur qui effectue **3 catégories d'audit** :

#### 1. Performance (4 tests)
- **Temps de réponse serveur** — < 600ms = pass, < 2000ms = warning, > 2000ms = fail
- **Taille de la page** — < 500KB = pass, < 2MB = warning, > 2MB = fail
- **Nombre de scripts** — ≤ 5 = pass, ≤ 15 = warning, > 15 = fail
- **Feuilles de styles** — ≤ 3 = pass, > 3 = warning

#### 2. SEO (8 tests)
- Balise `<title>` (présence + longueur 30-60 car.)
- Meta description (présence + longueur 120-160 car.)
- Balise H1 (présence + unicité)
- Hiérarchie des titres (H1 en premier)
- Attributs alt sur les images
- Balises Open Graph
- URL canonique
- Liens internes (maillage ≥ 3)

#### 3. Accessibilité (6 tests)
- Attribut `lang` sur `<html>`
- Encodage `charset`
- Meta viewport
- Alt sur toutes les images
- Labels des formulaires (label, aria-label, aria-labelledby)
- Lien d'évitement (skip navigation)

#### Calcul du score
Chaque item vaut : pass = 1 point, warning = 0.5 point, fail = 0 point.  
Score = (total des points / nombre d'items) × 100, arrondi.

---

## 💰 Modèle économique

| | Gratuit | Pro (9 €) |
|---|---|---|
| Scores (3 catégories) | ✅ | ✅ |
| Métriques clés | ✅ | ✅ |
| Aperçu problèmes (5 max) | ✅ | ✅ |
| Rapport HTML complet | ❌ | ✅ |
| Tous les problèmes détaillés | ❌ | ✅ |
| Recommandations | ❌ | ✅ |
| Structure headings | ❌ | ✅ |
| Badge audité | ❌ | ✅ |

**Projection** : 1 000 visiteurs/mois → 2-5% conversion → 20-50 × 9€ = **180-450€/mois**

---

## 🚀 Installation et développement

### Prérequis
- Node.js 18+ 
- npm

### Installation

```bash
git clone https://github.com/VOTRE_USER/webpulse.git
cd webpulse
npm install
```

### Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

### Build de production

```bash
npm run build
npm start
```

---

## ☁️ Déploiement sur Vercel

### Option 1 : Via l'interface Vercel (recommandé)

1. Poussez le code sur GitHub :
   ```bash
   git remote add origin https://github.com/VOTRE_USER/webpulse.git
   git push -u origin main
   ```
2. Allez sur [vercel.com/new](https://vercel.com/new)
3. Importez le repo `webpulse`
4. Framework : **Next.js** (détecté automatiquement)
5. Cliquez **Deploy**
6. URL attribuée : `https://webpulse-xxxxx.vercel.app`

### Option 2 : Via CLI

```bash
npx vercel
```

---

## 💳 Configuration Stripe

> **Optionnel pour le développement.** L'app fonctionne sans Stripe — le checkout renvoie un message d'instruction si la clé n'est pas configurée.

### Étapes

1. Créez un compte sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Récupérez vos clés dans **Developers > API Keys**
3. Dans **Vercel > Settings > Environment Variables**, ajoutez :

| Variable | Valeur |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` ou `pk_live_...` |

4. Redéployez l'application

### Test en mode sandbox

Utilisez les clés `sk_test_` et `pk_test_` de Stripe pour tester les paiements sans frais réels.

---

## 🔍 SEO & Optimisations

### Implémenté

- **robots.txt** dynamique (`/robots.txt`) — autorise tous les crawlers, pointe vers le sitemap
- **sitemap.xml** dynamique (`/sitemap.xml`) — liste la page d'accueil
- **JSON-LD** — schéma `WebApplication` + `Organization` injecté dans le `<head>`
- **Meta OpenGraph** — titre, description, type pour le partage social
- **Meta keywords** — termes SEO pertinents
- **Titres sémantiques** — hiérarchie H1 > H2 > H3 correcte
- **Section Social Proof** — compteur d'audits + témoignages fictifs (à remplacer par de vrais)
- **Performance** — First Load JS < 93 KB, pages statiques pré-rendues

### Canaux d'acquisition recommandés

1. **Product Hunt** — lancement avec page dédiée
2. **Indie Hackers** — post dans la communauté
3. **Reddit** — r/webdev, r/SEO, r/smallbusiness
4. **Twitter/X** — thread de lancement
5. **LinkedIn** — cibler les freelances et agences
6. **Dev.to / Hashnode** — article technique sur le moteur d'audit

---

## 🔮 Prochaines étapes

### Court terme (semaines 1-2)
- [ ] Remplacer le store en mémoire par **Vercel KV** (Redis) pour persister les audits
- [ ] Ajouter un **vrai système de paiement Stripe** avec webhook de confirmation
- [ ] Générer un **vrai PDF** (via Puppeteer ou @react-pdf) au lieu d'un rapport HTML
- [ ] Ajouter **Google Analytics** ou **Vercel Analytics**
- [ ] Ajouter une page de conditions générales et politique de confidentialité

### Moyen terme (mois 1-2)
- [ ] **Lighthouse API** intégrée pour des métriques Core Web Vitals réelles
- [ ] **Audit récurrent** — abonnement mensuel pour audits automatiques hebdomadaires
- [ ] **Comparaison avec concurrents** — entrez 2 URLs, comparez les scores
- [ ] **Historique d'audits** — voir l'évolution dans le temps
- [ ] **API publique** — endpoint payant pour les développeurs

### Long terme (scale)
- [ ] **Domaine personnalisé** (webpulse.io ou similaire)
- [ ] **White-label** — agences peuvent revendre le rapport sous leur marque
- [ ] **Intégrations** — Slack, Zapier, WordPress plugin
- [ ] **Plan équipe** — dashboard multi-utilisateurs

---

## 📊 Rapport de projet

### Résumé exécutif

| Métrique | Valeur |
|----------|--------|
| Idée sélectionnée | Audit automatisé de sites web |
| Nom du produit | WebPulse |
| Temps de développement | ~4 heures |
| Budget dépensé | 0 € |
| Fichiers créés | 19 fichiers source |
| Lignes de code (estimé) | ~2 000 |
| Build status | ✅ Succès (0 erreur, 1 warning mineur Stripe) |
| API testée | ✅ Fonctionnelle (audit example.com → scores retournés) |
| Rapport HTML | ✅ Fonctionnel |

### Décisions techniques clés

1. **Cheerio au lieu de Lighthouse** — Lighthouse nécessite Chrome headless (lourd, incompatible free tier). Cheerio permet une analyse HTML statique légère et rapide.
2. **Module `https` natif au lieu de `fetch()`** — Meilleure compatibilité avec les environnements Node.js variés (résolution d'un bug de certificats SSL).
3. **Rapport HTML au lieu de PDF** — Plus léger, imprimable en PDF via le navigateur, pas besoin de dépendance lourde comme Puppeteer.
4. **Store en mémoire** — Suffisant pour le MVP. À remplacer par Vercel KV en production.
5. **Stripe en mode conditionnel** — L'app fonctionne sans Stripe configuré, avec un fallback gracieux.

### Ce qui fonctionne
- ✅ Landing page professionnelle et responsive
- ✅ Formulaire d'audit avec validation d'URL
- ✅ API d'audit complète (18 tests sur 3 catégories)
- ✅ Page de résultats avec jauges SVG animées
- ✅ Rapport HTML professionnel généré dynamiquement
- ✅ Grille tarifaire Gratuit vs Pro
- ✅ Section Social Proof
- ✅ SEO technique (robots.txt, sitemap, JSON-LD)
- ✅ Build Next.js propre et déployable

### Ce qui reste à faire (intervention humaine)
- 🔲 Créer le repo GitHub et pusher le code
- 🔲 Déployer sur Vercel (3 clics)
- 🔲 Configurer Stripe (optionnel, 10 min)
- 🔲 Lancer la promotion sur Product Hunt / réseaux

---

## 📄 Licence

MIT

---

Fait avec ⚡ par **WebPulse** — Projet généré et développé de manière autonome par IA.
