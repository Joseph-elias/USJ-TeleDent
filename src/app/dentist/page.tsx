import type { Metadata } from "next";
import { PortalPlaceholder } from "@/components/portal-placeholder";

export const metadata: Metadata = { title: "Dentist Portal" };

export default function DentistPage() {
  return <PortalPlaceholder audience="Dentist" description="Welcome to the future space for dental professionals on USJ TeleDent." />;
}
