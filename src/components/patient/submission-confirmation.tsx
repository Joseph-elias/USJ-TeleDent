"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmissionResult } from "@/lib/requests/types";

export function SubmissionConfirmation({ result }: { result: SubmissionResult }) {
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

  return <div lang="fr" className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
    <p className="eyebrow">Confirmation</p>
    <h1 ref={heading} tabIndex={-1} className="mt-4 text-3xl font-semibold tracking-tight">Votre demande a été enregistrée</h1>
    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm text-slate-500">Référence de la demande</p>
      <p className="mt-2 break-all font-semibold">{result.request_reference}</p>
      <p className="mt-5 inline-block rounded-full bg-light-blue px-4 py-2 text-sm font-semibold">Statut : Nouveau</p>
      <p className="mt-6 text-sm leading-6 text-slate-600">Votre demande et ses photos sont enregistrées sur le serveur local de ce prototype. Conservez votre lien privé : il est nécessaire pour retrouver votre suivi. Toute personne qui possède ce lien peut consulter ce suivi et les photos jointes. Ne le partagez pas publiquement.</p>
      <label htmlFor="tracking-link" className="mt-6 block text-sm font-semibold">Votre lien privé de suivi</label>
      <input ref={link} id="tracking-link" readOnly onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a href={result.tracking_path} referrerPolicy="no-referrer" className="rounded-xl bg-navy px-5 py-3 text-center text-sm font-semibold text-white hover:bg-sky-900">Voir ma demande</a>
        <button type="button" onClick={copyLink} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-light-blue">Copier le lien privé</button>
      </div>
      <p role="status" className="mt-4 text-sm leading-6">{copyMessage}</p>
    </div>
    <a href="/patient" className="mt-6 inline-block text-sm font-semibold underline">Retour à l’espace patient</a>
  </div>;
}
