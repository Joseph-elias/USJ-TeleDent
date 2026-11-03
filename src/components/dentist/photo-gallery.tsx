"use client";
import { useI18n } from "@/components/i18n";

import { useRef, useState } from "react";

export function DentistPhotoGallery({ requestId, photos }: { requestId: string; photos: { id: string }[] }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<{ id: string; index: number } | null>(null);
  const source = (id: string) => `/api/dentist/requests/${requestId}/photos/${id}`;

  if (!photos.length) return <p className="mt-4 text-sm text-slate-600">{t("Aucune photo jointe à cette demande.")}</p>;
  return <>
    <p className="mt-3 text-sm text-slate-600">{t("Sélectionnez une photo pour l’agrandir.")}</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {photos.map((photo, index) => <button key={photo.id} type="button" aria-label={t("Agrandir la photo {0}", [index + 1])} aria-haspopup="dialog"
        onClick={() => { setSelected({ id: photo.id, index }); dialog.current?.showModal(); }}
        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-start hover:border-sky-500">
        {/* These private images must bypass the Next Image optimization cache. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={source(photo.id)} referrerPolicy="no-referrer" alt={t("Photo jointe {0}", [index + 1])} className="h-44 w-full rounded-lg object-contain" />
        <span className="mt-3 block text-sm font-semibold">{t("Photo ")}{index + 1} {t(" · Agrandir")}</span>
      </button>)}
    </div>
    <dialog ref={dialog} aria-labelledby="photo-title" onClose={() => setSelected(null)} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-5xl overflow-auto rounded-2xl bg-white p-5 text-navy shadow-xl backdrop:bg-navy/75">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 id="photo-title" className="font-semibold">{t("Photo ")}{selected ? selected.index + 1 : ""}</h3>
        <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-light-blue">{t("Fermer")}</button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {selected && <img src={source(selected.id)} referrerPolicy="no-referrer" alt={t("Photo {0} agrandie", [selected.index + 1])} className="max-h-[70dvh] w-full object-contain" />}
    </dialog>
  </>;
}
