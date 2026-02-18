import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — WebPulse",
};

export default function ConfidentialitePage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Politique de Confidentialité</h1>
      <p className="text-sm text-slate-500">Dernière mise à jour : février 2026</p>

      <h2>1. Données collectées</h2>
      <p>WebPulse collecte les données suivantes :</p>
      <ul>
        <li><strong>URL du site audité</strong> — nécessaire pour effectuer l&apos;analyse.</li>
        <li><strong>Adresse IP</strong> — utilisée uniquement pour la limitation de requêtes (rate limiting).</li>
        <li><strong>Données de paiement</strong> — traitées exclusivement par Stripe. WebPulse n&apos;a pas accès à vos informations bancaires.</li>
      </ul>

      <h2>2. Utilisation des données</h2>
      <p>Les données sont utilisées uniquement pour :</p>
      <ul>
        <li>Effectuer l&apos;audit du site web demandé.</li>
        <li>Générer et délivrer le rapport d&apos;audit.</li>
        <li>Prévenir les abus (rate limiting).</li>
      </ul>

      <h2>3. Stockage des données</h2>
      <p>
        Les résultats d&apos;audit sont stockés temporairement en mémoire serveur et ne sont
        pas persistés de manière permanente. Ils sont automatiquement supprimés lors du
        redémarrage du serveur ou lorsque la limite de stockage est atteinte.
      </p>
      <p>
        Aucun compte utilisateur n&apos;est créé. Aucune donnée personnelle n&apos;est stockée
        de manière permanente par WebPulse.
      </p>

      <h2>4. Cookies</h2>
      <p>
        WebPulse n&apos;utilise pas de cookies de suivi ou de marketing.
        Seuls les cookies techniques nécessaires au fonctionnement du site peuvent être utilisés.
      </p>

      <h2>5. Partage des données</h2>
      <p>
        WebPulse ne vend, ne loue ni ne partage vos données personnelles avec des tiers,
        à l&apos;exception de Stripe pour le traitement des paiements.
      </p>

      <h2>6. Vos droits (RGPD)</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD),
        vous disposez des droits suivants :
      </p>
      <ul>
        <li>Droit d&apos;accès à vos données</li>
        <li>Droit de rectification</li>
        <li>Droit à l&apos;effacement</li>
        <li>Droit à la portabilité</li>
        <li>Droit d&apos;opposition</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à : <strong>contact@webpulse.app</strong>
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question relative à cette politique, contactez-nous à :{" "}
        <strong>contact@webpulse.app</strong>
      </p>
    </article>
  );
}
