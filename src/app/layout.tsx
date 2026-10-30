import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "USJ TeleDent | Dental care, connected", template: "%s | USJ TeleDent" },
  description: "USJ TeleDent is a teledentistry project connecting patients with dental professionals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-background text-navy antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <header className="border-b border-slate-200/70 bg-white">
          <div className="mx-auto flex min-h-24 max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
            <Brand />
            <span className="text-xs font-medium tracking-wide text-slate-500 sm:text-sm">Connecting patients & professionals</span>
          </div>
        </header>
        <main id="main-content" className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-slate-200/70 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs leading-6 text-slate-500 sm:flex-row sm:justify-between sm:px-10">
            <p>USJ TeleDent</p>
            <p>A connection to better oral health.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
