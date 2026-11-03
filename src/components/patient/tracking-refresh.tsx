"use client";
import { useI18n } from "@/components/i18n";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";

export function TrackingRefresh() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div>
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="button button-secondary w-full sm:w-auto"><Icon name="clock" className="size-4" />{pending ? t("Actualisation…") : t("Actualiser le suivi")}</button>
    <span role="status" className="sr-only">{pending ? t("Actualisation du suivi en cours") : ""}</span>
  </div>;
}
