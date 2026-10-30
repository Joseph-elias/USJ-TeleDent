import type { Metadata } from "next";
import { PatientFlow } from "@/components/patient/patient-flow";

export const metadata: Metadata = {
  title: "Espace patient",
  description: "Préparez une demande dentaire fictive et retrouvez son suivi privé dans le prototype local USJ TeleDent.",
};

export default function PatientPage() {
  return <PatientFlow />;
}
