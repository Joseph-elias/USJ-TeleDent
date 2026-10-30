import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DentistDashboard } from "@/components/dentist/dashboard";
import { loadDashboard } from "@/lib/dentist/dashboard";
import { currentDentistToken } from "@/lib/dentist/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tableau de bord dentiste", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function DentistPage({ searchParams }: { searchParams: Promise<{ status?: string; priority?: string }> }) {
  const filters = await searchParams;
  const data = await loadDashboard(await currentDentistToken(), filters.status, filters.priority);
  if (!data) redirect("/dentist/login");
  return <DentistDashboard data={data} />;
}
