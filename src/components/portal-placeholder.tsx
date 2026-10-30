import Link from "next/link";

type PortalPlaceholderProps = {
  audience: "Patient" | "Dentist";
  description: string;
};

export function PortalPlaceholder({ audience, description }: PortalPlaceholderProps) {
  return (
    <section className={`mx-auto w-full px-6 py-16 sm:py-24 ${audience === "Patient" ? "max-w-2xl" : "max-w-5xl"}`}>
      <Link href="/" className="text-sm font-semibold text-navy underline decoration-sky-300 underline-offset-4 hover:decoration-navy">
        <span aria-hidden="true">← </span>Back to home
      </Link>
      <div className="mt-9 rounded-3xl border border-sky-100 bg-white p-7 sm:p-12">
        <p className="eyebrow">USJ TeleDent</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">{audience} Portal</h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
        <div className="mt-8 inline-flex rounded-full bg-light-blue px-4 py-2 text-sm font-medium text-navy">Coming soon</div>
        <p className="mt-4 text-sm leading-6 text-slate-500">This is a placeholder page. Portal features are not available yet.</p>
      </div>
    </section>
  );
}
