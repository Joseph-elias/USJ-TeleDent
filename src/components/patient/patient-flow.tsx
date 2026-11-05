"use client";
import { useI18n } from "@/components/i18n";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { emptyIdentity, identityFields, purposes, reasons, steps, type Identity } from "./patient-data";
import { RequestValidationError, validateRequest } from "@/lib/requests/validation";
import { getUrgency } from "@/lib/requests/routing";
import type { SubmissionResult } from "@/lib/requests/types";
import { DictationTextarea } from "@/components/dictation-textarea";
import { SubmissionConfirmation } from "./submission-confirmation";
import { Icon, controlClass as control, primaryClass as primary, secondaryClass as secondary } from "@/components/ui";

type Photo = { id: string; file: File; url: string };
const emptyPatientIdentity = { ...emptyIdentity, rememberFileNumber: false, autofilledFileNumber: false };
function EmergencyNotice() {
  const { t } = useI18n();
  return <aside aria-label={t("Urgence médicale")} className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
    <p className="font-semibold">{t("Une urgence grave ? Consultez les urgences sans attendre une réponse en ligne.")}</p>
    <details className="mt-1">
      <summary className="min-h-11 py-3 font-medium underline underline-offset-4">{t("Quand consulter immédiatement ?")}</summary>
      <p className="pb-2">{t("En cas de difficulté à respirer ou à avaler, de gonflement important du visage ou du cou, de saignement abondant qui ne s’arrête pas ou de traumatisme grave, rendez-vous immédiatement aux urgences ou appelez les services d’urgence locaux.")}</p>
      <p className="pb-2">{t("Ce formulaire ne fournit pas de diagnostic.")}</p>
    </details>
  </aside>;
}

function UrgencyNotice({ urgency }: { urgency: ReturnType<typeof getUrgency> }) {
  const { t } = useI18n();
  if (!urgency) return null;
  return <p role="alert" className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
    {urgency === "immediate"
      ? t("Consultez immédiatement les urgences ou appelez les services d’urgence locaux. N’attendez pas une réponse en ligne.")
      : t("Contactez dès maintenant un service d’urgence dentaire. N’attendez pas une réponse en ligne.")}
  </p>;
}

function displayDate(value: string) {
  return value ? value.split("-").reverse().join("/") : "Non renseignée";
}

function PhotoGallery({ photos, onRemove }: { photos: Photo[]; onRemove?: (photo: Photo) => void }) {
  const { t } = useI18n();
  return <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo, index) => <li key={photo.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
    {/* Browser-only object URLs must remain local; Next Image optimization would send them to a server. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.url} alt={t("Photo jointe {0}", [index + 1])} className="h-36 w-full rounded-lg bg-slate-100 object-contain" />
    <p className="mt-2 break-all text-xs text-slate-600">{photo.file.name}</p>
    {onRemove && <button type="button" onClick={() => onRemove(photo)} aria-label={t("Supprimer la photo {0} : {1}", [index + 1, photo.file.name])} className="mt-2 min-h-11 text-sm font-semibold text-red-700 underline">{t("Supprimer")}</button>}
  </li>)}</ul>;
}

export function PatientFlow() {
  const { t } = useI18n();
  const [dictatingField, setDictatingField] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [identity, setIdentity] = useState(emptyPatientIdentity);
  const [reasonId, setReasonId] = useState("");
  const [answersByReason, setAnswersByReason] = useState<Record<string, Record<string, string>>>({});
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [confirmation, setConfirmation] = useState<SubmissionResult | null>(null);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const photoUrls = useRef(new Set<string>());
  const activeReason = reasons.find((reason) => reason.id === reasonId);
  const answers = answersByReason[reasonId] ?? {};
  const urgency = getUrgency(reasonId, answers);
  const today = new Date().toLocaleDateString("en-CA");
  const { name, birthDate } = identity;

  useEffect(() => {
    if (step !== 1 || !name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate > today) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const body = new FormData();
      body.set("name", name);
      body.set("birthDate", birthDate);
      try {
        const response = await fetch("/api/requests/dossier", { method: "POST", body, signal: controller.signal });
        if (!response.ok) return;
        const { fileNumber } = await response.json();
        if (typeof fileNumber !== "string" || !fileNumber || controller.signal.aborted) return;
        setIdentity((current) => current.name === name && current.birthDate === birthDate && !current.fileNumber
          ? { ...current, fileNumber, autofilledFileNumber: true, rememberFileNumber: true }
          : current);
        setErrors((current) => {
          if (!current.fileNumber) return current;
          const next = { ...current };
          delete next.fileNumber;
          return next;
        });
      } catch {
        // Manual entry is available if the browser cannot retrieve a saved number.
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [step, name, birthDate, today]);

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
    setSubmissionError("");
    setStep(next);
  }

  function updateIdentity(field: keyof Identity, value: string) {
    setIdentity((current) => {
      if ((field === "name" || field === "birthDate") && current.autofilledFileNumber) {
        return { ...current, [field]: value, fileNumber: "", autofilledFileNumber: false, rememberFileNumber: false };
      }
      return { ...current, [field]: value, autofilledFileNumber: field !== "fileNumber" && current.autofilledFileNumber };
    });
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dictatingField) return;
    if (step >= steps.length) { void submitRequest(); return; }
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
    setErrors(found);
    if (!Object.keys(found).length) {
      if (returnToReview && step !== 2) { setReturnToReview(false); moveTo(steps.length); }
      else moveTo(step + 1);
    }
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const added: Photo[] = [];
    const messages: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        messages.push(`${file.name} : choisissez une photo JPEG, PNG ou WebP.`);
      } else if (file.size === 0) {
        messages.push(`${file.name} : cette photo est vide.`);
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
    setPhotoError([...new Set(messages)].join("\n"));
  }

  function removePhoto(photo: Photo) {
    URL.revokeObjectURL(photo.url);
    photoUrls.current.delete(photo.url);
    setPhotos(photos.filter((item) => item.id !== photo.id));
    setPhotoError("");
  }

  function editStep(next: number) {
    setReturnToReview(true);
    moveTo(next);
  }

  function errorFor(id: string) {
    return errors[id] ? <p id={`${id}-error`} className="mt-2 text-sm text-red-700">{t(errors[id])}</p> : null;
  }

  async function submitRequest() {
    if (submitting.current || dictatingField) return;
    setSubmissionError("");
    let payload;
    try {
      payload = validateRequest({
        patient_name: identity.name, patient_file_number: identity.fileNumber,
        date_of_birth: identity.birthDate, phone: identity.phone, email: identity.email.trim(),
        reason: reasonId, description, symptom_answers: answers,
      });
    } catch (error) {
      setSubmissionError(error instanceof RequestValidationError ? error.message : "Vérifiez les informations de votre demande.");
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ ...payload, remember_file_number: identity.rememberFileNumber }));
      photos.forEach((photo) => form.append("photos", photo.file));
      const response = await fetch("/api/requests", { method: "POST", body: form, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        setSubmissionError(typeof result.error === "string" ? result.error : "L’enregistrement n’a pas pu être confirmé.");
        return;
      }
      setConfirmation(result as SubmissionResult);
      photoUrls.current.forEach((url) => URL.revokeObjectURL(url));
      photoUrls.current.clear();
      setPhotos([]);
      setIdentity(emptyPatientIdentity);
      setAnswersByReason({});
      setDescription("");
    } catch {
      setSubmissionError("L’enregistrement n’a pas pu être confirmé. Vérifiez le serveur local avant de réessayer.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  if (confirmation) return <SubmissionConfirmation result={confirmation} />;

  return <div className="mx-auto w-full max-w-4xl px-5 py-4 sm:px-8 sm:py-7">
    <Link href="/" className="text-link"><Icon name="back" className="size-4" />{t("Accueil USJ TeleDent")}</Link>
    <div className="mb-6 mt-4 sm:mt-6">
      <p className="eyebrow">{step === 0 ? t("Votre espace patient") : t("Nouvelle demande")}</p>
      <h1 ref={heading} tabIndex={-1} className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">{step === 0 ? t("Comment pouvons-nous vous aider ?") : t(steps[step - 1])}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{step === 0 ? t("Choisissez votre besoin. Nous vous guidons pour préparer votre demande.") : t("Avancez à votre rythme. Vos réponses sont conservées entre les étapes dans cet onglet.")}</p>
    </div>
    <EmergencyNotice />

    {step === 0 ? <>
      <div className="grid gap-3 sm:grid-cols-2">{purposes.map((item, index) => <button key={item.title} type="button" onClick={() => { setPurpose(item.title); if (!purpose) setReasonId(item.reason); setReturnToReview(false); moveTo(1); }} className="surface group flex items-start gap-4 p-5 text-start transition-colors hover:border-sky-500 hover:bg-sky-50 sm:p-6">
        <span className="icon-tile"><Icon name={(["plus", "clock", "calendar", "message"] as const)[index]} /></span>
        <span className="min-w-0 flex-1"><span className="block text-base font-semibold">{t(item.title)}</span><span className="mt-1.5 block text-sm leading-6 text-slate-500">{t(item.text)}</span><span aria-hidden="true" className="mt-3 flex items-center gap-2 text-xs font-semibold text-accent">{t("Commencer")}<Icon name="arrow" className="size-4" /></span></span>
      </button>)}</div>
      <div className="mt-7 flex items-start gap-3 rounded-xl bg-light-blue p-4 text-xs leading-6 text-slate-600"><Icon name="file" className="mt-1 size-4 text-accent" /><p>{t("Vous pouvez mémoriser votre numéro de dossier USJ sur cet appareil pour votre prochaine demande. Après l’envoi, conservez votre lien privé pour retrouver le suivi.")}</p></div>
    </> : <>
      <nav aria-label={t("Progression de la demande")} className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs"><p className="font-semibold" aria-live="polite">{t("Étape {0} sur {1} · {2}", [step, steps.length, t(steps[step - 1])])}</p><span className="text-slate-500">{Math.round(step / steps.length * 100)} {t(" %")}</span></div>
        <ol className="grid grid-cols-5 gap-2">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined}>
          <span className={`block h-1.5 rounded-full ${index < step ? "bg-accent" : "bg-slate-200"}`} /><span aria-hidden="true" className={`mt-2 hidden text-[.6875rem] sm:block ${step === index + 1 ? "font-semibold text-navy" : "text-slate-500"}`}>{t(label)}</span><span className="sr-only">{t(label)}{index + 1 < step ? t(" : terminée") : ""}</span>
        </li>)}</ol>
      </nav>
      <form noValidate onSubmit={next} aria-busy={isSubmitting} className="surface p-5 sm:p-8">
        {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("Veuillez corriger les champs indiqués avant de continuer.")}</div>}
        <p className="mb-6 text-sm text-slate-500">{step === 4 ? t("Les photos sont facultatives.") : step === steps.length ? t("Vérifiez les informations avant de terminer.") : t("Les champs sont obligatoires, sauf indication contraire.")}</p>
        {step >= 4 && urgency && <div className="mb-5"><UrgencyNotice urgency={urgency} /></div>}

        {step === 1 && <div className="grid gap-5 sm:grid-cols-2">{identityFields.map((field) => <div key={field.id}>
          <label htmlFor={field.id} className="text-sm font-semibold">{t(field.label)}</label>
          <input id={field.id} name={field.id} type={field.type} dir={field.type === "tel" || field.type === "email" || field.id === "fileNumber" ? "ltr" : "auto"} inputMode={field.type === "tel" ? "tel" : field.type === "email" ? "email" : undefined} autoComplete={field.autocomplete} required={field.id !== "email"} maxLength={field.type === "date" ? undefined : field.id === "phone" ? 25 : 200} max={field.type === "date" ? today : undefined} value={identity[field.id]} onChange={(event) => updateIdentity(field.id, event.target.value)} aria-invalid={!!errors[field.id]} aria-describedby={errors[field.id] ? `${field.id}-error` : undefined} className={control} />
          {errorFor(field.id)}
          {field.id === "fileNumber" && <p role="status" className="mt-2 text-xs text-slate-600">{identity.autofilledFileNumber && t("Numéro retrouvé sur cet appareil. Vérifiez-le avant de continuer.")}</p>}
        </div>)}<label className="flex items-start gap-3 text-sm text-slate-600 sm:col-span-2">
          <input type="checkbox" checked={identity.rememberFileNumber} onChange={(event) => {
            const checked = event.target.checked;
            setIdentity((current) => ({ ...current, rememberFileNumber: checked }));
          }} className="mt-0.5 size-4 shrink-0 accent-navy" />
          {t("Mémoriser mon numéro de dossier sur cet appareil pendant 90 jours.")}
        </label></div>}

        {step === 2 && <fieldset><legend className="text-base font-semibold">{t("Quel est le motif principal de votre demande ?")}</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{reasons.map((reason) => <label key={reason.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${reasonId === reason.id ? "border-sky-600 bg-light-blue" : "border-slate-200"}`}>
          <input type="radio" name="reason" value={reason.id} checked={reasonId === reason.id} onChange={() => setReasonId(reason.id)} aria-describedby={errors.reason ? "reason-error" : undefined} className="size-4 shrink-0 accent-navy" />{t(reason.label)}
        </label>)}</div>{errorFor("reason")}</fieldset>}

        {step === 3 && <div className="space-y-6">
          <p className="rounded-xl bg-light-blue p-4 text-sm font-semibold">{t(activeReason?.label)}</p>
          <p className="text-sm leading-6 text-slate-600">{t("Si vous ne connaissez pas une réponse, choisissez ou écrivez « Je ne sais pas ». Pour la douleur, 0 signifie aucune douleur et 10 la douleur maximale.")}</p>
          {activeReason?.questions.map((question) => <div key={`${reasonId}-${question.id}`}>
            <label htmlFor={`question-${question.id}`} className="text-sm font-semibold">{t(question.label)}</label>
            {question.options ? <select id={`question-${question.id}`} required value={answers[question.id] ?? ""} onChange={(event) => setAnswersByReason({ ...answersByReason, [reasonId]: { ...answers, [question.id]: event.target.value } })} aria-invalid={!!errors[question.id]} aria-describedby={errors[question.id] ? `${question.id}-error` : undefined} className={control}>
              <option value="">{t("Choisir une réponse")}</option>{question.options.map((option) => <option key={option} value={option}>{t(option)}</option>)}
            </select> : question.description ? <DictationTextarea key={`${reasonId}-${question.id}`} id={`question-${question.id}`} required rows={3} maxLength={500} value={answers[question.id] ?? ""} onValueChange={value => setAnswersByReason(current => ({ ...current, [reasonId]: { ...current[reasonId], [question.id]: value } }))} onDictatingChange={active => setDictatingField(active ? question.id : null)} disabled={!!dictatingField && dictatingField !== question.id} aria-invalid={!!errors[question.id]} aria-describedby={errors[question.id] ? `${question.id}-error` : undefined} className={control} /> : <input id={`question-${question.id}`} required maxLength={500} value={answers[question.id] ?? ""} onChange={(event) => setAnswersByReason({ ...answersByReason, [reasonId]: { ...answers, [question.id]: event.target.value } })} aria-invalid={!!errors[question.id]} aria-describedby={errors[question.id] ? `${question.id}-error` : undefined} className={control} />}
            {errorFor(question.id)}
            {urgency && getUrgency(reasonId, { [question.id]: answers[question.id] }) === urgency && <UrgencyNotice urgency={urgency} />}
          </div>)}
          <div><label htmlFor="description" className="text-sm font-semibold">{t("Décrivez votre situation ou votre question")}</label><DictationTextarea id="description" rows={5} required maxLength={4000} value={description} onValueChange={setDescription} onDictatingChange={active => setDictatingField(active ? "description" : null)} disabled={!!dictatingField && dictatingField !== "description"} aria-invalid={!!errors.description} aria-describedby={errors.description ? "description-error" : undefined} className={control} />{errorFor("description")}</div>
        </div>}

        {step === 4 && <div>
          <div className="flex items-center gap-3"><span className="icon-tile"><Icon name="camera" /></span><label htmlFor="photos" className="block text-base font-semibold">{t("Ajouter des photos")}</label></div>
          <p id="photos-help" className="mt-2 text-sm leading-6 text-slate-600">{t("Jusqu’à 3 photos, 5 Mo maximum par photo. Formats : JPEG, PNG, WebP. Les photos seront enregistrées localement lors de l’envoi de la demande.")}</p>
          <input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photos-help" onChange={(event) => { addPhotos(event.target.files); event.target.value = ""; }} className={`${control} text-sm file:me-2 file:rounded-lg file:border-0 file:bg-light-blue file:px-2 file:py-2 file:text-xs file:text-navy`} />
          <p className="mt-3 text-xs leading-5 text-slate-500">{t("Choisissez une photo nette et bien éclairée. Si votre téléphone utilise le format HEIC, exportez la photo en JPEG avant de l’ajouter.")}</p>
          {photoError && <p role="alert" className="mt-3 whitespace-pre-line text-sm text-red-700">{t(photoError)}</p>}
          <p aria-live="polite" className="mt-4 text-sm text-slate-600">{t("{0} / 3 photos sélectionnées", [photos.length])}</p>
          <PhotoGallery photos={photos} onRemove={removePhoto} />
        </div>}

        {step === steps.length && <div className="space-y-7">
          <section aria-labelledby="summary-patient"><div className="section-heading"><h2 id="summary-patient">{t("Vos informations")}</h2><button type="button" disabled={isSubmitting || !!dictatingField} onClick={() => editStep(1)} className="text-link" aria-label={t("Modifier vos informations")}>{t("Modifier")}</button></div><dl className="mt-3 grid gap-4 sm:grid-cols-2">{identityFields.map((field) => <div key={field.id}><dt className="text-sm text-slate-500">{t(field.label)}</dt><dd className="mt-1 break-words text-sm font-medium">{field.id === "birthDate" ? t(displayDate(identity.birthDate)) : identity[field.id].trim() || t("Non renseigné")}</dd></div>)}</dl></section>
          <section aria-labelledby="summary-reason" className="border-t border-slate-200 pt-6"><div className="section-heading"><h2 id="summary-reason">{t("Votre demande")}</h2><button type="button" disabled={isSubmitting || !!dictatingField} onClick={() => editStep(2)} className="text-link" aria-label={t("Modifier votre demande")}>{t("Modifier")}</button></div><dl className="mt-3 space-y-4">
            <div><dt className="text-sm text-slate-500">{t("Parcours choisi")}</dt><dd className="mt-1 text-sm">{t(purpose)}</dd></div>
            <div><dt className="text-sm text-slate-500">{t("Motif de contact")}</dt><dd className="mt-1 text-sm font-semibold">{t(activeReason?.label)}</dd></div>
            {activeReason?.questions.map((question) => <div key={question.id}><dt className="text-sm text-slate-500">{t(question.label)}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{question.options?.includes(answers[question.id]) ? t(answers[question.id]) : answers[question.id]?.trim() || t("Non renseigné")}</dd></div>)}
            <div><dt className="text-sm text-slate-500">{t("Description")}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{description}</dd></div>
          </dl></section>
          <section aria-labelledby="summary-photos" className="border-t border-slate-200 pt-6"><div className="section-heading"><h2 id="summary-photos">{t("Photos jointes")}</h2><button type="button" disabled={isSubmitting || !!dictatingField} onClick={() => editStep(4)} className="text-link" aria-label={t("Modifier les photos")}>{t("Modifier")}</button></div>{photos.length ? <PhotoGallery photos={photos} /> : <p className="mt-2 text-sm text-slate-500">{t("Aucune photo jointe.")}</p>}</section>
          <div className="rounded-xl bg-light-blue p-5 text-sm leading-6"><p>{t("Vos réponses servent à orienter automatiquement votre demande vers un service.")}</p><p id="submission-help" className="mt-2">{t("En envoyant cette demande, vous enregistrez les informations et les photos sur le serveur local de ce prototype. Utilisez uniquement des données fictives.")}</p>
            <button type="submit" disabled={isSubmitting || !!dictatingField} aria-describedby="submission-help" className={`${primary} mt-4 w-full disabled:cursor-wait disabled:opacity-60 sm:w-auto`}>{isSubmitting ? t("Enregistrement en cours…") : t("Envoyer ma demande")}</button>
            <p role="status" className="mt-3">{isSubmitting ? t("Veuillez patienter pendant l’enregistrement de votre demande.") : ""}</p>
            {submissionError && <p role="alert" className="mt-3 font-semibold text-red-700">{t(submissionError)}</p>}
          </div>
        </div>}

        <div className="step-actions">
          <button type="button" disabled={isSubmitting || !!dictatingField} onClick={() => moveTo(step - 1)} className={`${secondary} disabled:opacity-60`}><Icon name="back" className="size-4" />{step === 1 ? t("Retour") : t("Précédent")}</button>
          {step < steps.length && <button type="submit" disabled={!!dictatingField} className={primary}>{returnToReview && step !== 2 ? t("Valider") : step === steps.length - 1 ? t("Récapitulatif") : t("Continuer")}<Icon name="arrow" className="size-4" /></button>}
        </div>
      </form>
    </>}
    <details className="mt-5 text-xs leading-6 text-slate-500"><summary className="min-h-11 py-3">{t("Prototype local · Données fictives uniquement")}</summary><p>{t("Avant l’envoi, le texte du formulaire reste dans cet onglet et est perdu si vous quittez ou actualisez la page. Si vous activez la dictée, votre navigateur peut transmettre votre voix à son service vocal. Après l’envoi, la demande et ses photos sont enregistrées sur le serveur local.")}</p></details>
  </div>;
}
