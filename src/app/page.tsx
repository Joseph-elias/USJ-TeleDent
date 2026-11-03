import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { Icon } from "@/components/ui";

const journey = [
  { icon: "file", title: "Décrivez votre besoin", text: "Quelques étapes pour transmettre les informations utiles à votre service." },
  { icon: "message", title: "Votre service vous répond", text: "Un dentiste consulte votre demande et vous indique la suite à donner." },
  { icon: "shield", title: "Retrouvez votre suivi", text: "Conservez votre lien privé pour consulter la réponse et les propositions." },
] as const;

export default async function Home() {
  const { t } = await getI18n();
  return <>
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-light-blue/70">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 size-[38rem] rounded-full border-[80px] border-white/45" />
      <div className="page-container relative grid gap-9 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:py-20">
        <div>
          <p className="eyebrow flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" />{t("La proximité, même à distance")}</p>
          <h1 className="mt-5 max-w-xl text-[2.5rem] font-semibold leading-[1.12] tracking-[-0.045em] sm:text-6xl">{t("Votre santé dentaire.")}<br /><span className="text-accent">{t("Gardons le lien.")}</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">{t("Une question, un suivi ou une demande de consultation ? Échangez avec les professionnels dentaires de l’USJ, depuis un seul espace.")}</p>
          <div className="mt-7 flex flex-col gap-3 min-[380px]:flex-row sm:mt-8">
            <Link href="/patient" className="button button-primary">{t("Faire une demande")}<Icon name="arrow" /></Link>
            <Link href="/dentist" className="button button-secondary">{t("Espace dentiste")}</Link>
          </div>
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><Icon name="shield" className="mt-0.5 size-4" />{t("Un lien privé pour retrouver le suivi de votre demande.")}</p>
        </div>
        <div className="surface relative p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <p className="text-sm font-semibold">{t("Un parcours simple, à votre rythme")}</p>
            <span aria-hidden="true" className="icon-tile"><Icon name="plus" /></span>
          </div>
          <ol className="mt-6 space-y-6 sm:space-y-8">
            {journey.map((item, index) => <li key={item.title} className="flex gap-4">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-accent">{t("0")}{index + 1}</span>
              <div><h2 className="text-sm font-semibold sm:text-base">{t(item.title)}</h2><p className="mt-1.5 text-sm leading-6 text-slate-500">{t(item.text)}</p></div>
            </li>)}
          </ol>
          <div className="mt-7 flex items-center gap-3 rounded-xl bg-background px-4 py-3 text-xs leading-5 text-slate-600"><Icon name="user" className="size-4 text-accent" />{t("Patients et professionnels, en lien.")}</div>
        </div>
      </div>
    </section>
    <section aria-labelledby="portal-heading" className="page-container py-10 sm:py-14">
      <div className="mb-6"><p className="eyebrow">{t("À chacun son espace")}</p><h2 id="portal-heading" className="mt-2 text-2xl font-semibold tracking-tight">{t("Comment souhaitez-vous continuer ?")}</h2></div>
      <nav aria-label={t("Les espaces USJ TeleDent")} className="grid gap-4 md:grid-cols-2">
        <Link href="/patient" className="surface group flex items-start gap-4 p-5 transition-colors hover:border-sky-400 sm:p-7">
          <span className="icon-tile"><Icon name="user" /></span>
          <span className="min-w-0 flex-1"><span className="block text-lg font-semibold">{t("Je suis patient")}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{t("Préparez une demande, joignez vos photos et retrouvez la réponse de votre service.")}</span><span className="mt-4 flex items-center gap-2 text-sm font-semibold text-accent">{t("Accéder à mon espace")}<Icon name="arrow" className="size-4" /></span></span>
        </Link>
        <Link href="/dentist" className="surface group flex items-start gap-4 p-5 transition-colors hover:border-sky-400 sm:p-7">
          <span className="icon-tile"><Icon name="grid" /></span>
          <span className="min-w-0 flex-1"><span className="block text-lg font-semibold">{t("Je suis dentiste")}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{t("Consultez les demandes de votre service, évaluez les dossiers et répondez aux patients.")}</span><span className="mt-4 flex items-center gap-2 text-sm font-semibold text-accent">{t("Ouvrir mon tableau de bord")}<Icon name="arrow" className="size-4" /></span></span>
        </Link>
      </nav>
      <p className="mt-6 text-xs leading-6 text-slate-500">{t("Ce service ne fournit pas de diagnostic automatique. En cas d’urgence grave, consultez les urgences sans attendre une réponse en ligne.")}</p>
    </section>
  </>;
}
