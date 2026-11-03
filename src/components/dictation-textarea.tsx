"use client";
import { useI18n } from "@/components/i18n";

import { useEffect, useRef, useState, useSyncExternalStore, type TextareaHTMLAttributes } from "react";
import { createDictationSession, mergeDictation, speechConstructor } from "@/lib/speech/dictation";
import { speechLocales } from "@/lib/i18n/shared";
import { Icon } from "./ui";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "maxLength"> & {
  id: string;
  value: string;
  maxLength: number;
  onValueChange(value: string): void;
  onDictatingChange(active: boolean): void;
};

const subscribe = () => () => {};
function supportSnapshot() {
  if (!window.isSecureContext) return "insecure";
  return speechConstructor() ? "supported" : "unsupported";
}

export function DictationTextarea({ id, value, maxLength, onValueChange, onDictatingChange, disabled, readOnly, ...props }: Props) {
  const { t, locale } = useI18n();
  const support = useSyncExternalStore(subscribe, supportSnapshot, () => "checking");
  const [expanded, setExpanded] = useState(false);
  const [languageOverride, setLanguage] = useState<string | null>(null);
  const language = languageOverride ?? speechLocales[locale];
  const [phase, setPhase] = useState<"idle" | "starting" | "listening" | "stopping">("idle");
  const [interim, setInterim] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const session = useRef<ReturnType<typeof createDictationSession> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopping = useRef(false);
  const callbacks = useRef({ onValueChange, onDictatingChange });
  useEffect(() => { callbacks.current = { onValueChange, onDictatingChange }; }, [onValueChange, onDictatingChange]);
  const active = phase !== "idle";

  function clearTimers() {
    if (timer.current) clearTimeout(timer.current);
    if (stopTimer.current) clearTimeout(stopTimer.current);
    timer.current = stopTimer.current = null;
  }

  function finish() {
    clearTimers();
    session.current?.dispose();
    session.current = null;
    stopping.current = false;
    setPhase("idle");
    setInterim("");
    callbacks.current.onDictatingChange(false);
  }

  useEffect(() => {
    function releaseMicrophone() {
      if (timer.current) clearTimeout(timer.current);
      if (stopTimer.current) clearTimeout(stopTimer.current);
      if (session.current) {
        session.current.dispose();
        session.current = null;
        callbacks.current.onDictatingChange(false);
      }
    }
    function leavePage() {
      if (!session.current) return;
      releaseMicrophone();
      stopping.current = false;
      setPhase("idle"); setInterim("");
      setMessage("Dictée arrêtée en quittant la page. Relisez le texte déjà ajouté.");
    }
    function visibilityChanged() { if (document.visibilityState === "hidden") leavePage(); }
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("pagehide", leavePage);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("pagehide", leavePage);
      releaseMicrophone();
    };
  }, []);

  function stop() {
    if (!session.current || stopping.current) return;
    stopping.current = true;
    setPhase("stopping");
    if (timer.current) clearTimeout(timer.current);
    // Some engines delay the final result until stop/end; keep their handlers
    // alive briefly, then release the microphone even if end never arrives.
    stopTimer.current = setTimeout(finish, 5000);
    try { session.current.stop(); } catch { finish(); }
  }

  function start() {
    const Constructor = speechConstructor();
    if (!Constructor || session.current || disabled || readOnly) return;
    const base = value;
    stopping.current = false;
    let hasText = false;
    setError(""); setMessage(""); setInterim(""); setPhase("starting");
    callbacks.current.onDictatingChange(true);
    try {
      session.current = createDictationSession(new Constructor(), {
        language,
        onStart() { setPhase("listening"); },
        onResult(finalText, interimText) {
          setInterim(interimText);
          if (!finalText) return;
          hasText = true;
          const merged = mergeDictation(base, finalText, maxLength);
          callbacks.current.onValueChange(merged.value);
          if (merged.truncated) { setMessage("La limite de caractères est atteinte. Vérifiez le texte conservé."); stop(); }
        },
        onError(text) { setError(text); finish(); },
        onEnd() {
          setMessage(current => current || (hasText ? "Dictée terminée. Relisez et corrigez le texte avant de continuer." : "Aucun texte ajouté. Vous pouvez réessayer ou écrire au clavier."));
          finish();
        },
      });
      session.current.start();
      timer.current = setTimeout(stop, 60000);
    } catch {
      setError("Le micro n’a pas pu démarrer. Vérifiez les autorisations du navigateur ou saisissez votre texte.");
      finish();
    }
  }

  return <div>
    <textarea {...props} dir={props.dir ?? "auto"} ref={textarea} id={id} value={value} maxLength={maxLength} disabled={disabled} readOnly={readOnly || active} onChange={event => onValueChange(event.target.value)} aria-describedby={[props["aria-describedby"], `${id}-voice-help`, active ? `${id}-voice-status` : ""].filter(Boolean).join(" ")} />
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <button type="button" disabled={disabled || readOnly || support !== "supported" || phase === "stopping"} aria-controls={`${id}-voice-panel`} aria-expanded={expanded} onClick={() => { if (active) stop(); else setExpanded(!expanded); }} className="button button-secondary min-h-11 px-3 py-2 text-xs"><Icon name={active ? "stop" : "microphone"} className="size-4" />{phase === "starting" ? t("Annuler l’ouverture du micro") : phase === "stopping" ? t("Fin de la dictée…") : active ? t("Arrêter la dictée") : t("Dicter ce texte")}</button>
      <span className="text-xs tabular-nums text-slate-500">{value.length} {t(" / ")}{maxLength}</span>
    </div>
    <p id={`${id}-voice-help`} className="mt-2 text-xs leading-5 text-slate-500">{support === "unsupported" ? t("Dictée indisponible dans ce navigateur. Vous pouvez saisir le texte ou utiliser le micro du clavier de votre téléphone.") : support === "insecure" ? t("La dictée nécessite une connexion HTTPS ou localhost. La saisie au clavier reste disponible.") : t("Écrivez ou dictez, puis relisez votre texte. La dictée s’ajoute au texte existant.")}</p>
    {expanded && <div id={`${id}-voice-panel`} className="mt-3 rounded-xl border border-slate-200 bg-light-blue/50 p-4">
      {!active && <>
        <label htmlFor={`${id}-voice-language`} className="text-xs font-semibold">{t("Langue de la dictée")}</label>
        <select id={`${id}-voice-language`} value={language} onChange={event => setLanguage(event.target.value)} disabled={disabled} className="form-control"><option value="fr-FR">{t("Français")}</option><option value="ar-LB">{t("العربية")}</option><option value="en-US">{t("English")}</option></select>
        <p className="mt-3 text-xs leading-6 text-slate-600">{t("Le navigateur peut envoyer votre voix à son fournisseur de reconnaissance vocale pour la transcrire. Ce prototype n’enregistre aucun fichier audio. Utilisez uniquement des données fictives.")}</p>
        <button type="button" disabled={disabled || readOnly || value.length >= maxLength} onClick={start} className="button button-primary mt-3 w-full sm:w-auto"><Icon name="microphone" className="size-4" />{t("Démarrer la dictée")}</button>
      </>}
      <p id={`${id}-voice-status`} role="status" className="text-sm leading-6 text-accent">{active ? phase === "starting" ? t("Autorisez le microphone si votre navigateur le demande.") : phase === "stopping" ? t("Finalisation du texte…") : t("Micro actif. Parlez clairement, puis arrêtez la dictée. Arrêt automatique après une minute.") : t(message)}</p>
      {active && interim && <p className="mt-2 break-words text-sm italic leading-6 text-slate-600">{t("En cours : ")}{interim}</p>}
      {active && <p className="mt-2 text-xs leading-5 text-slate-500">{t("Arrêtez la dictée pour modifier le texte ou continuer le formulaire.")}</p>}
      {error && <p role="alert" className="mt-3 text-sm leading-6 text-red-800">{t(error)}</p>}
    </div>}
  </div>;
}
