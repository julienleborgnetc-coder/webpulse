import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales — WebPulse",
};

export default function MentionsPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Mentions Légales</h1>
      <p className="text-sm text-slate-500">Dernière mise à jour : février 2026</p>

      <h2>1. Éditeur du site</h2>
      <p>
        <strong>WebPulse</strong><br />
        Service d&apos;audit automatisé de sites web<br />
        Email : contact@webpulse.app
      </p>

      <h2>2. Hébergement</h2>
      <p>
        Ce site est hébergé par :<br />
        <strong>Vercel Inc.</strong><br />
        440 N Barranca Ave #4133<br />
        Covina, CA 91723, États-Unis<br />
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments constituant le site WebPulse (textes, graphismes, logiciels,
        images, etc.) est protégé par les lois relatives à la propriété intellectuelle.
        Toute reproduction ou représentation, totale ou partielle, est interdite sans
        autorisation préalable.
      </p>

      <h2>4. Responsabilité</h2>
      <p>
        WebPulse s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur le site.
        Toutefois, WebPulse ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité
        des informations fournies. Les rapports d&apos;audit sont générés automatiquement et
        fournis à titre informatif uniquement.
      </p>

      <h2>5. Liens hypertextes</h2>
      <p>
        Le site peut contenir des liens vers des sites tiers. WebPulse n&apos;exerce aucun
        contrôle sur le contenu de ces sites et décline toute responsabilité quant à leur contenu.
      </p>

      <h2>6. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont régies par le droit français.
        Tout litige sera soumis à la juridiction des tribunaux compétents.
      </p>
    </article>
  );
}
