import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DentistDashboard } from "@/components/dentist/dashboard";
import { loadDashboard } from "@/lib/dentist/dashboard";
import { currentDentistToken } from "@/lib/dentist/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Tableau de bord dentiste"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default async function DentistPage({ searchParams }: { searchParams: Promise<{ status?: string; priority?: string; transferred?: string }> }) {
  const filters = await searchParams;
  const data = await loadDashboard(await currentDentistToken(), filters.status, filters.priority);
  if (!data) redirect("/dentist/login");
  return <DentistDashboard data={data} transferred={filters.transferred === "1"} />;
}
