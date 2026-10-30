import Link from "next/link";
import { Brand } from "@/components/brand";
import type { Dentist } from "@/lib/dentist/auth";

export function DentistShell({ dentist, children, dashboardActive = true }: {
  dentist: Dentist;
  children: React.ReactNode;
  dashboardActive?: boolean;
}) {
  return <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
    <aside aria-label="Espace dentiste" className="flex shrink-0 flex-col bg-navy p-6 text-white lg:w-64 lg:py-9">
      <div className="rounded-xl bg-white p-3"><Brand /></div>
      <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-sky-200">Espace dentiste</p>
      <nav aria-label="Navigation dentiste" className="mt-4">
        <Link href="/dentist" prefetch={false} aria-current={dashboardActive ? "page" : undefined} className="block rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20">Tableau de bord</Link>
      </nav>
      <div className="mt-7 border-t border-white/20 pt-6 lg:mt-auto">
        <p className="font-semibold">{dentist.full_name}</p>
        <p className="mt-2 text-sm leading-6 text-sky-100">{dentist.department}</p>
        <form method="post" action="/api/dentist/logout" className="mt-5">
          <button type="submit" className="min-h-11 w-full rounded-xl border border-white/40 px-4 py-3 text-left text-sm font-semibold hover:bg-white/10">Se déconnecter</button>
        </form>
      </div>
    </aside>
    <div className="min-w-0 flex-1 bg-white px-5 py-8 sm:px-8 lg:py-10">{children}</div>
  </div>;
}
