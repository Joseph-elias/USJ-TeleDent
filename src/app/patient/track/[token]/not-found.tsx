import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";

export default async function TrackingNotFound() {
  const { t } = await getI18n();
  return <div className="surface mx-auto my-8 w-[calc(100%_-_2.5rem)] max-w-2xl p-6 sm:my-14 sm:p-10">
    <p className="eyebrow mb-4">{t("Suivi privé")}</p>
    <h1 className="text-3xl font-semibold">{t("Demande introuvable")}</h1>
    <p className="mt-4 text-slate-600">{t("Ce lien ne permet pas de consulter une demande. Vérifiez le lien privé reçu lors de l’enregistrement.")}</p>
    <Link href="/patient" className="button button-primary mt-6">{t("Retour à l’espace patient")}</Link>
  </div>;
}
