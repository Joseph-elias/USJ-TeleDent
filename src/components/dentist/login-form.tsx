"use client";
import { useI18n } from "@/components/i18n";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon, controlClass, primaryClass } from "@/components/ui";

export function DentistLoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorBox = useRef<HTMLParagraphElement>(null);
  const submitting = useRef(false);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      setError("Saisissez un email valide et votre mot de passe.");
      return;
    }
    setError(""); setBusy(true); submitting.current = true;
    try {
      const response = await fetch("/api/dentist/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), cache: "no-store",
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Connexion impossible pour le moment.");
        return;
      }
      router.replace("/dentist");
      router.refresh();
    } catch { setError("Le serveur local est indisponible. Réessayez dans un instant."); }
    finally { setBusy(false); submitting.current = false; }
  }

  return <form onSubmit={submit} noValidate className="mt-8 space-y-5">
    <div>
      <label htmlFor="dentist-email" className="text-sm font-semibold">{t("Email")}</label>
      <input id="dentist-email" name="email" dir="ltr" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={busy} maxLength={254} required aria-describedby={error ? "login-error" : undefined} className={controlClass} />
    </div>
    <div>
      <label htmlFor="dentist-password" className="text-sm font-semibold">{t("Mot de passe")}</label>
      <input id="dentist-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" disabled={busy} maxLength={256} required aria-describedby={error ? "login-error" : undefined} className={controlClass} />
      <button type="button" disabled={busy} aria-controls="dentist-password" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="text-link mt-1">{showPassword ? t("Masquer le mot de passe") : t("Afficher le mot de passe")}</button>
    </div>
    {error && <p ref={errorBox} tabIndex={-1} id="login-error" role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{t(error)}</p>}
    <button type="submit" disabled={busy} className={`${primaryClass} w-full`}>{busy ? t("Connexion en cours…") : t("Se connecter")}<Icon name="arrow" className="size-4" /></button>
    <p role="status" className="text-sm text-slate-500">{busy ? t("Vérification de vos identifiants…") : ""}</p>
  </form>;
}
