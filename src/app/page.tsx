import Link from "next/link";

const portals = [
  { number: "01", title: "Patient Portal", audience: "For patients", description: "Your starting point for connecting with dental professionals.", href: "/patient", action: "Enter Patient Portal" },
  { number: "02", title: "Dentist Portal", audience: "For dental professionals", description: "A dedicated space for the professionals behind your care.", href: "/dentist", action: "Enter Dentist Portal" },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-light-blue">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-36 size-[34rem] rounded-full border-[70px] border-white/40" />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16 sm:px-10 sm:pb-20 sm:pt-24">
          <p className="eyebrow">Welcome to USJ TeleDent</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight text-navy sm:text-6xl lg:text-7xl">
            Dental care.<br />A closer connection.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Connecting patients and dental professionals through teledentistry. A shared space for a healthier smile.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm font-medium text-navy">
            <span aria-hidden="true" className="h-px w-9 bg-sky-600" />
            Two portals. One connection.
          </div>
        </div>
      </section>
      <section aria-labelledby="portal-heading" className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 id="portal-heading" className="text-2xl font-semibold tracking-tight">Find your space</h2>
          <p className="text-sm text-slate-500">Choose a portal to get started.</p>
        </div>
        <nav aria-label="Portals" className="grid gap-5 md:grid-cols-2">
          {portals.map((portal) => (
            <Link key={portal.href} href={portal.href} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-7 transition-colors hover:border-sky-400 hover:bg-sky-50/50 sm:p-9">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{portal.audience}</p>
                <span aria-hidden="true" className="text-sm text-slate-400">{portal.number}</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-navy">{portal.title}</h3>
              <p className="mb-8 mt-3 max-w-sm flex-1 text-base leading-7 text-slate-600">{portal.description}</p>
              <span className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm font-semibold text-navy">
                {portal.action}
                <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-light-blue text-lg group-hover:bg-sky-100">↗</span>
              </span>
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}
