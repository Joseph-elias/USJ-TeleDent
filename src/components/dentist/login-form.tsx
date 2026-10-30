"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function DentistLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

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
      <label htmlFor="dentist-email" className="text-sm font-semibold">Email</label>
      <input id="dentist-email" name="email" type="email" autoComplete="username" maxLength={254} required aria-describedby={error ? "login-error" : undefined} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
    </div>
    <div>
      <label htmlFor="dentist-password" className="text-sm font-semibold">Mot de passe</label>
      <input id="dentist-password" name="password" type="password" autoComplete="current-password" maxLength={256} required aria-describedby={error ? "login-error" : undefined} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
    </div>
    {error && <p id="login-error" role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
    <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60">{busy ? "Connexion en cours…" : "Se connecter"}</button>
    <p role="status" className="text-sm text-slate-500">{busy ? "Vérification de vos identifiants…" : ""}</p>
  </form>;
}
