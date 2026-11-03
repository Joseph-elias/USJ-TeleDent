import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/i18n";
import Link from "next/link";

export default async function DentistRequestNotFound() {
  const { t } = await getI18n();
  return <div className="surface mx-auto my-8 w-[calc(100%_-_2.5rem)] max-w-2xl p-6 sm:my-14 sm:p-10">
    <div className="mb-4 flex justify-end"><LanguageSwitcher /></div>
    <p className="eyebrow mb-4">{t("Espace dentiste")}</p>
    <h1 className="text-3xl font-semibold">{t("Demande introuvable")}</h1>
    <p className="mt-4 text-sm leading-6 text-slate-600">{t("Cette demande n’est pas disponible dans votre espace.")}</p>
    <Link href="/dentist" prefetch={false} className="button button-primary mt-6">{t("Retour au tableau de bord")}</Link>
  </div>;
}
