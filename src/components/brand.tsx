import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" aria-label="Accueil USJ TeleDent" className="inline-flex items-center gap-3 rounded-sm">
      <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-white" aria-hidden="true">
        <svg width="27" height="29" viewBox="0 0 32 34" fill="none">
          <path d="M16 6C12 6 10 3 6 5C0 8 5 18 6 23C7 28 8 31 10 30C12 29 11 20 16 20C21 20 20 29 22 30C24 31 25 28 26 23C27 18 32 8 26 5C22 3 20 6 16 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 7L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight text-navy">USJ <span className="font-normal">TeleDent</span></span>
    </Link>
  );
}
