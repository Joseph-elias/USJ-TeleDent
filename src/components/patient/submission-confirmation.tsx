"use client";
import { useI18n } from "@/components/i18n";

import { useEffect, useRef, useState } from "react";
import type { SubmissionResult } from "@/lib/requests/types";
import { Icon, StatusBadge, controlClass, primaryClass, secondaryClass } from "@/components/ui";

export function SubmissionConfirmation({ result }: { result: SubmissionResult }) {
  const { t } = useI18n();
  const [copyMessage, setCopyMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const link = useRef<HTMLInputElement>(null);
  useEffect(() => {
    heading.current?.focus();
    if (link.current) link.current.value = `${window.location.origin}${result.tracking_path}`;
  }, [result.tracking_path]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${result.tracking_path}`);
      setCopyMessage("Lien privé copié. Conservez-le dans un endroit sûr.");
    } catch {
      link.current?.focus();
      link.current?.select();
      setCopyMessage("La copie automatique est indisponible. Copiez le lien sélectionné ci-dessus.");
    }
  }

  return <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
    <span className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon name="check" className="size-7" /></span>
    <p className="eyebrow">{t("Demande envoyée")}</p>
    <h1 ref={heading} tabIndex={-1} className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("C’est enregistré.")}<br />{t("Gardons le lien.")}</h1>
    <p className="mt-4 text-sm leading-7 text-slate-600">{t("Votre demande et ses photos sont enregistrées sur le serveur local de ce prototype. Retrouvez la réponse de votre service depuis votre suivi privé.")}</p>
    <div className="surface mt-7 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-medium text-slate-500">{t("Référence de la demande")}</p><StatusBadge status="nouveau">{t("Nouveau")}</StatusBadge></div>
      <p className="mt-3 break-all font-mono text-sm font-semibold"><bdi dir="ltr">{result.request_reference}</bdi></p>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Icon name="shield" className="text-accent" />{t("Conservez votre lien privé")}</h2>
        <p id="tracking-link-help" className="mt-3 text-sm leading-6 text-slate-600">{t("Ce lien est nécessaire pour retrouver votre suivi. Toute personne qui le possède peut consulter ce suivi et les photos jointes. Ne le partagez pas publiquement.")}</p>
        <label htmlFor="tracking-link" className="mt-5 block text-sm font-semibold">{t("Votre lien privé de suivi")}</label>
        <input ref={link} id="tracking-link" dir="ltr" readOnly aria-describedby="tracking-link-help" onFocus={(event) => event.currentTarget.select()} className={`${controlClass} font-mono`} />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href={result.tracking_path} referrerPolicy="no-referrer" className={primaryClass}>{t("Voir ma demande")}<Icon name="arrow" className="size-4" /></a>
          <button type="button" onClick={copyLink} className={secondaryClass}>{t("Copier le lien privé")}</button>
        </div>
        <p role="status" className="mt-3 text-sm leading-6 text-accent">{t(copyMessage)}</p>
      </div>
    </div>
    <a href="/patient" className="text-link mt-5"><Icon name="back" className="size-4" />{t("Retour à l’espace patient")}</a>
  </div>;
}
