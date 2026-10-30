"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { departments, emptyIdentity, identityFields, purposes, reasons, steps, type Identity } from "./patient-data";

type Photo = { id: string; file: File; url: string };
const control = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-navy focus:border-sky-600";
const primary = "inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-sky-900";
const secondary = "inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-light-blue";

function EmergencyNotice() {
  return <aside aria-label="Urgence médicale" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
    <p className="font-bold">Une urgence grave ? N’attendez pas une réponse en ligne.</p>
    <p className="mt-1">En cas de difficulté à respirer ou à avaler, de gonflement important du visage ou du cou, de saignement abondant qui ne s’arrête pas ou de traumatisme grave, rendez-vous immédiatement aux urgences ou appelez les services d’urgence locaux.</p>
    <p className="mt-2">Ce formulaire ne fournit pas de diagnostic.</p>
  </aside>;
}

function displayDate(value: string) {
  return value ? value.split("-").reverse().join("/") : "Non renseignée";
}

function PhotoGallery({ photos, onRemove }: { photos: Photo[]; onRemove?: (photo: Photo) => void }) {
  return <ul className="mt-5 grid gap-4 sm:grid-cols-3">{photos.map((photo, index) => <li key={photo.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
    {/* Browser-only object URLs must remain local; Next Image optimization would send them to a server. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.url} alt={`Photo jointe ${index + 1}`} className="h-36 w-full rounded-lg bg-slate-100 object-contain" />
    <p className="mt-2 break-all text-xs text-slate-600">{photo.file.name}</p>
    {onRemove && <button type="button" onClick={() => onRemove(photo)} aria-label={`Supprimer la photo ${index + 1} : ${photo.file.name}`} className="mt-2 min-h-11 text-sm font-semibold text-red-700 underline">Supprimer</button>}
  </li>)}</ul>;
}

export function PatientFlow() {
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [identity, setIdentity] = useState<Identity>(emptyIdentity);
  const [reasonId, setReasonId] = useState("");
  const [answersByReason, setAnswersByReason] = useState<Record<string, Record<string, string>>>({});
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState("");
  const [submissionNotice, setSubmissionNotice] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const photoUrls = useRef(new Set<string>());
  const activeReason = reasons.find((reason) => reason.id === reasonId);
  const answers = answersByReason[reasonId] ?? {};
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  useEffect(() => {
    if (Object.keys(errors).length) errorSummary.current?.focus();
  }, [errors]);

  useEffect(() => {
    const urls = photoUrls.current;
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);

  function moveTo(next: number) {
    setErrors({});
    setSubmissionNotice(false);
    setStep(next);
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step >= steps.length) return;
    const found: Record<string, string> = {};
    if (step === 1) {
      identityFields.forEach((field) => {
        if (field.id !== "email" && !identity[field.id].trim()) found[field.id] = "Ce champ est obligatoire.";
      });
      if (identity.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email.trim())) found.email = "Saisissez une adresse email valide.";
      if (identity.birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(identity.birthDate) || Number.isNaN(Date.parse(identity.birthDate)) || identity.birthDate > today)) found.birthDate = "Saisissez une date de naissance valide, non future.";
      if (identity.phone.trim() && (!/^\+?[\d\s().-]{6,25}$/.test(identity.phone.trim()) || identity.phone.replace(/\D/g, "").length < 6)) found.phone = "Saisissez un numéro de téléphone valide.";
    }
    if (step === 2 && !activeReason) found.reason = "Choisissez un motif de contact.";
    if (step === 3) {
      activeReason?.questions.forEach((question) => {
        if (!answers[question.id]?.trim()) found[question.id] = "Répondez à cette question ou indiquez « Je ne sais pas ».";
      });
      if (!description.trim()) found.description = "Décrivez votre situation en quelques mots.";
    }
    if (step === 5 && !department) found.department = "Choisissez un service.";
    setErrors(found);
    if (!Object.keys(found).length) moveTo(step + 1);
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const added: Photo[] = [];
    const messages: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        messages.push(`${file.name} : choisissez une photo JPEG, PNG ou WebP.`);
      } else if (file.size > 5 * 1024 * 1024) {
        messages.push(`${file.name} : cette photo dépasse 5 Mo.`);
      } else if (photos.length + added.length >= 3) {
        messages.push("Vous pouvez joindre au maximum 3 photos.");
      } else {
        const url = URL.createObjectURL(file);
        photoUrls.current.add(url);
        added.push({ id: crypto.randomUUID(), file, url });
      }
    }
    setPhotos([...photos, ...added]);
    setPhotoError([...new Set(messages)].join(" "));
  }

  function removePhoto(photo: Photo) {
    URL.revokeObjectURL(photo.url);
    photoUrls.current.delete(photo.url);
    setPhotos(photos.filter((item) => item.id !== photo.id));
    setPhotoError("");
  }

  function errorFor(id: string) {
    return errors[id] ? <p id={`${id}-error`} className="mt-2 text-sm text-red-700">{errors[id]}</p> : null;
  }

  return <div lang="fr" className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
    <Link href="/" className="text-sm font-semibold text-navy underline underline-offset-4">← Accueil USJ TeleDent</Link>
    <div className="mb-7 mt-8">
      <p className="eyebrow">Espace patient</p>
      <h1 ref={heading} tabIndex={-1} className="mt-3 text-3xl font-semibold tracking-tight outline-none sm:text-4xl">{step === 0 ? "Comment pouvons-nous vous aider ?" : steps[step - 1]}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{step === 0 ? "Préparez votre demande pour le service dentaire concerné." : "Prenez le temps de compléter les informations ci-dessous."}</p>
    </div>
    <EmergencyNotice />
    <p className="my-5 rounded-xl bg-light-blue px-4 py-3 text-sm leading-6 text-navy">Version locale : rien n’est envoyé ni enregistré. Vos informations et photos restent en mémoire dans cet onglet et sont perdues à son rechargement ou à sa fermeture.</p>

    {step === 0 ? <div className="grid gap-4 sm:grid-cols-2">{purposes.map((item) => <button key={item.title} type="button" onClick={() => { setPurpose(item.title); if (!purpose) setReasonId(item.reason); moveTo(1); }} className="group flex min-h-40 gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left hover:border-sky-500 hover:bg-sky-50">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-light-blue text-2xl text-navy">{item.symbol}</span>
      <span><span className="block text-lg font-semibold">{item.title}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{item.text}</span><span aria-hidden="true" className="mt-3 block text-navy">Continuer →</span></span>
    </button>)}</div> : <>
      <nav aria-label="Progression de la demande" className="mb-6">
        <p className="mb-3 text-sm font-semibold" aria-live="polite">Étape {step} sur {steps.length} · {steps[step - 1]}</p>
        <ol className="grid grid-cols-6 gap-2">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined}>
          <span className={`block h-2 rounded-full ${index < step ? "bg-navy" : "bg-slate-200"}`} /><span className="sr-only">{label}{index + 1 < step ? " : terminée" : ""}</span>
        </li>)}</ol>
      </nav>
      <form noValidate onSubmit={next} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
        {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Veuillez corriger les champs indiqués avant de continuer.</div>}
        <p className="mb-6 text-sm text-slate-500">{step === 4 ? "Les photos sont facultatives." : step === 6 ? "Vérifiez les informations avant de terminer." : "Les champs sont obligatoires, sauf indication contraire."}</p>

        {step === 1 && <div className="grid gap-5 sm:grid-cols-2">{identityFields.map((field) => <div key={field.id}>
          <label htmlFor={field.id} className="text-sm font-semibold">{field.label}</label>
          <input id={field.id} name={field.id} type={field.type} autoComplete={field.autocomplete} required={field.id !== "email"} maxLength={field.type === "date" ? undefined : 200} max={field.type === "date" ? today : undefined} value={identity[field.id]} onChange={(event) => setIdentity({ ...identity, [field.id]: event.target.value })} aria-invalid={!!errors[field.id]} aria-describedby={errors[field.id] ? `${field.id}-error` : undefined} className={control} />
          {errorFor(field.id)}
        </div>)}</div>}

        {step === 2 && <fieldset><legend className="text-base font-semibold">Quel est le motif principal de votre demande ?</legend><div className="mt-4 grid gap-3">{reasons.map((reason) => <label key={reason.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${reasonId === reason.id ? "border-sky-600 bg-light-blue" : "border-slate-200"}`}>
          <input type="radio" name="reason" value={reason.id} checked={reasonId === reason.id} onChange={() => setReasonId(reason.id)} aria-describedby={errors.reason ? "reason-error" : undefined} className="size-4 shrink-0 accent-navy" />{reason.label}
        </label>)}</div>{errorFor("reason")}</fieldset>}

        {step === 3 && <div className="space-y-6">
          <p className="rounded-xl bg-light-blue p-4 text-sm font-semibold">{activeReason?.label}</p>
          <p className="text-sm leading-6 text-slate-600">Si vous ne connaissez pas une réponse, choisissez ou écrivez « Je ne sais pas ». Pour la douleur, 0 signifie aucune douleur et 10 la douleur maximale.</p>
          {activeReason?.questions.map((question) => <div key={`${reasonId}-${question.id}`}>
            <label htmlFor={`question-${question.id}`} className="text-sm font-semibold">{question.label}</label>
            {question.options ? <select id={`question-${question.id}`} required value={answers[question.id] ?? ""} onChange={(event) => setAnswersByReason({ ...answersByReason, [reasonId]: { ...answers, [question.id]: event.target.value } })} aria-invalid={!!errors[question.id]} aria-describedby={errors[question.id] ? `${question.id}-error` : undefined} className={control}>
              <option value="">Choisir une réponse</option>{question.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select> : <input id={`question-${question.id}`} required maxLength={500} value={answers[question.id] ?? ""} onChange={(event) => setAnswersByReason({ ...answersByReason, [reasonId]: { ...answers, [question.id]: event.target.value } })} aria-invalid={!!errors[question.id]} aria-describedby={errors[question.id] ? `${question.id}-error` : undefined} className={control} />}
            {errorFor(question.id)}
          </div>)}
          <div><label htmlFor="description" className="text-sm font-semibold">Décrivez votre situation ou votre question</label><textarea id="description" rows={5} required maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={!!errors.description} aria-describedby={errors.description ? "description-error" : undefined} className={control} />{errorFor("description")}</div>
        </div>}

        {step === 4 && <div>
          <label htmlFor="photos" className="block text-base font-semibold">Ajouter des photos</label>
          <p id="photos-help" className="mt-2 text-sm leading-6 text-slate-600">Jusqu’à 3 photos, 5 Mo maximum par photo. Formats : JPEG, PNG, WebP. Aucun transfert vers un serveur.</p>
          <input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photos-help" onChange={(event) => { addPhotos(event.target.files); event.target.value = ""; }} className={`${control} file:mr-3 file:rounded-lg file:border-0 file:bg-light-blue file:px-3 file:py-2 file:text-navy`} />
          {photoError && <p role="alert" className="mt-3 text-sm text-red-700">{photoError}</p>}
          <p aria-live="polite" className="mt-4 text-sm text-slate-600">{photos.length} / 3 photos sélectionnées</p>
          <PhotoGallery photos={photos} onRemove={removePhoto} />
        </div>}

        {step === 5 && <fieldset><legend className="font-semibold">À quel service souhaitez-vous adresser votre demande ?</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{departments.map((item) => <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${department === item ? "border-sky-600 bg-light-blue" : "border-slate-200"}`}>
          <input type="radio" name="department" checked={department === item} onChange={() => setDepartment(item)} value={item} aria-describedby={errors.department ? "department-error" : undefined} className="size-4 shrink-0 accent-navy" />{item}
        </label>)}</div>{errorFor("department")}</fieldset>}

        {step === 6 && <div className="space-y-7">
          <section aria-labelledby="summary-patient"><h2 id="summary-patient" className="text-lg font-semibold">Vos informations</h2><dl className="mt-3 grid gap-4 sm:grid-cols-2">{identityFields.map((field) => <div key={field.id}><dt className="text-sm text-slate-500">{field.label}</dt><dd className="mt-1 break-words text-sm font-medium">{field.id === "birthDate" ? displayDate(identity.birthDate) : identity[field.id].trim() || "Non renseigné"}</dd></div>)}</dl></section>
          <section aria-labelledby="summary-reason" className="border-t border-slate-200 pt-6"><h2 id="summary-reason" className="text-lg font-semibold">Votre demande</h2><dl className="mt-3 space-y-4">
            <div><dt className="text-sm text-slate-500">Parcours choisi</dt><dd className="mt-1 text-sm">{purpose}</dd></div>
            <div><dt className="text-sm text-slate-500">Motif de contact</dt><dd className="mt-1 text-sm font-semibold">{activeReason?.label}</dd></div>
            {activeReason?.questions.map((question) => <div key={question.id}><dt className="text-sm text-slate-500">{question.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{answers[question.id]?.trim() || "Non renseigné"}</dd></div>)}
            <div><dt className="text-sm text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{description}</dd></div>
            <div><dt className="text-sm text-slate-500">Service sélectionné</dt><dd className="mt-1 text-sm font-semibold">{department}</dd></div>
          </dl></section>
          <section aria-labelledby="summary-photos" className="border-t border-slate-200 pt-6"><h2 id="summary-photos" className="text-lg font-semibold">Photos jointes</h2>{photos.length ? <PhotoGallery photos={photos} /> : <p className="mt-2 text-sm text-slate-500">Aucune photo jointe.</p>}</section>
          <div className="rounded-xl bg-light-blue p-5 text-sm leading-6"><p id="submission-help">L’enregistrement et l’envoi seront disponibles à l’étape 4 du projet. Pour le moment, aucune demande ne peut être transmise.</p>
            <button type="button" aria-describedby="submission-help" onClick={() => setSubmissionNotice(true)} className={`${primary} mt-4 w-full sm:w-auto`}>Envoyer ma demande</button>
            {submissionNotice && <p role="status" className="mt-3 font-semibold">Envoi indisponible pour le moment : rien n’a été envoyé ni enregistré. Cette fonction sera disponible à l’étape 4.</p>}
          </div>
        </div>}

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
          <button type="button" onClick={() => moveTo(step - 1)} className={secondary}>{step === 1 ? "Retour à l’espace patient" : "Précédent"}</button>
          {step < 6 && <button type="submit" className={primary}>{step === 5 ? "Voir le récapitulatif" : "Suivant"}<span aria-hidden="true" className="ml-3">→</span></button>}
        </div>
      </form>
    </>}
  </div>;
}
