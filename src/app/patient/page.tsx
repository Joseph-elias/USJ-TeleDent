import type { Metadata } from "next";
import { PortalPlaceholder } from "@/components/portal-placeholder";

export const metadata: Metadata = { title: "Patient Portal" };

export default function PatientPage() {
  return <PortalPlaceholder audience="Patient" description="Welcome to your future connection with dental professionals through USJ TeleDent." />;
}
