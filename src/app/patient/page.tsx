import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { PatientFlow } from "@/components/patient/patient-flow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
  title: t("Espace patient"),
  description: t("Préparez une demande dentaire fictive et retrouvez son suivi privé dans le prototype local USJ TeleDent."),
};
}

export default function PatientPage() {
  return <PatientFlow />;
}
