import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — WebPulse",
};

export default function CGVPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Conditions Générales de Vente</h1>
      <p className="text-sm text-slate-500">Dernière mise à jour : février 2026</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes Conditions Générales de Vente (CGV) régissent les ventes de rapports
        d&apos;audit de sites web effectuées par WebPulse (ci-après &quot;le Service&quot;).
      </p>

      <h2>2. Description du service</h2>
      <p>
        WebPulse propose un service d&apos;audit automatisé de sites web analysant la performance,
        le SEO et l&apos;accessibilité. Le service se décline en deux offres :
      </p>
      <ul>
        <li><strong>Plan Gratuit</strong> : scores résumés et aperçu des 5 principaux problèmes.</li>
        <li><strong>Rapport Pro (9 €)</strong> : rapport complet avec tous les problèmes détaillés, recommandations et structure des headings.</li>
      </ul>

      <h2>3. Prix et paiement</h2>
      <p>
        Le rapport Pro est vendu au prix unitaire de 9 € TTC. Le paiement s&apos;effectue
        par carte bancaire via la plateforme sécurisée Stripe. Le rapport est accessible
        immédiatement après confirmation du paiement.
      </p>

      <h2>4. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation
        ne s&apos;applique pas aux contenus numériques fournis immédiatement après l&apos;achat.
        En validant votre commande, vous acceptez expressément que le rapport vous soit
        fourni immédiatement et renoncez à votre droit de rétractation.
      </p>

      <h2>5. Livraison</h2>
      <p>
        Le rapport est généré et accessible instantanément en ligne après paiement.
        Il peut être téléchargé au format HTML et imprimé en PDF depuis votre navigateur.
      </p>

      <h2>6. Limitation de responsabilité</h2>
      <p>
        WebPulse fournit une analyse automatisée basée sur le contenu HTML accessible publiquement.
        Les résultats sont fournis à titre informatif et ne constituent pas un conseil professionnel.
        WebPulse ne garantit pas l&apos;exhaustivité ni l&apos;exactitude absolue des résultats.
      </p>

      <h2>7. Propriété intellectuelle</h2>
      <p>
        Les rapports générés sont la propriété de l&apos;acheteur. Le design, le code source et
        la marque WebPulse restent la propriété exclusive de WebPulse.
      </p>

      <h2>8. Contact</h2>
      <p>
        Pour toute question relative à ces CGV, contactez-nous à :{" "}
        <strong>contact@webpulse.app</strong>
      </p>
    </article>
  );
}
