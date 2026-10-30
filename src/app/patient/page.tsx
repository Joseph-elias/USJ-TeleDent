import type { Metadata } from "next";
import { PatientFlow } from "@/components/patient/patient-flow";

export const metadata: Metadata = {
  title: "Espace patient",
  description: "Préparez votre demande dentaire avec USJ TeleDent. Interface locale sans envoi de données.",
};

export default function PatientPage() {
  return <PatientFlow />;
}
