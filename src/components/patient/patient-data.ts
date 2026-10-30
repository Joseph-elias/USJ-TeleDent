export const departments = [
  "Chirurgie bucco-dentaire", "Parodontologie", "Endodontie",
  "Dentisterie restauratrice / conjointe", "Pédodontie", "Urgences",
] as const;

export const purposes = [
  { title: "J'ai une urgence", text: "Décrivez votre problème dentaire.", symbol: "+", reason: "" },
  { title: "Suivi après un traitement", text: "Faites le point après vos soins.", symbol: "↺", reason: "followup" },
  { title: "Consultation / Rendez-vous", text: "Préparez votre demande de consultation.", symbol: "▦", reason: "consultation" },
  { title: "Questions avant un traitement", text: "Partagez vos questions avec le service concerné.", symbol: "?", reason: "" },
] as const;

const yesNo = ["Oui", "Non", "Je ne sais pas"];
export type Question = { id: string; label: string; options?: readonly string[] };
export type Reason = { id: string; label: string; questions: Question[] };

export const reasons: Reason[] = [
  { id: "pain", label: "Douleur après un traitement", questions: [
    { id: "onset", label: "Depuis quand avez-vous mal ?" },
    { id: "intensity", label: "Quelle est l’intensité de la douleur ?", options: [...Array.from({ length: 11 }, (_, i) => String(i)), "Je ne sais pas"] },
    { id: "pattern", label: "La douleur est-elle constante ou intermittente ?", options: ["Constante", "Intermittente", "Je ne sais pas"] },
    { id: "swelling", label: "Avez-vous un gonflement ?", options: yesNo },
  ] },
  { id: "swelling", label: "Gonflement / Œdème", questions: [
    { id: "onset", label: "Depuis quand avez-vous ce gonflement ?" },
    { id: "increasing", label: "Le gonflement augmente-t-il ?", options: yesNo },
    { id: "fever", label: "Avez-vous de la fièvre ?", options: yesNo },
    { id: "opening", label: "Avez-vous du mal à ouvrir la bouche ?", options: yesNo },
    { id: "swallowing", label: "Avez-vous du mal à avaler ?", options: yesNo },
    { id: "breathing", label: "Avez-vous du mal à respirer ?", options: yesNo },
  ] },
  { id: "bleeding", label: "Saignement", questions: [
    { id: "onset", label: "Depuis quand saignez-vous ?" },
    { id: "active", label: "Le saignement est-il encore actif ?", options: yesNo },
    { id: "persistent", label: "Le saignement persiste-t-il ?", options: yesNo },
  ] },
  { id: "trauma", label: "Traumatisme dentaire", questions: [
    { id: "onset", label: "Quand le traumatisme a-t-il eu lieu ?" },
    { id: "tooth", label: "Une dent est-elle cassée, déplacée ou sortie ?", options: yesNo },
    { id: "bleeding", label: "Avez-vous un saignement ?", options: yesNo },
  ] },
  { id: "restoration", label: "Problème avec une restauration ou prothèse", questions: [
    { id: "type", label: "Quelle restauration ou prothèse est concernée ?" },
    { id: "onset", label: "Depuis quand avez-vous ce problème ?" },
    { id: "pain", label: "Avez-vous une douleur ?", options: yesNo },
  ] },
  { id: "followup", label: "Suivi après un traitement", questions: [
    { id: "treatment", label: "Quel traitement avez-vous reçu et à quelle date ?" },
    { id: "evolution", label: "Comment votre état évolue-t-il ?", options: ["Il s’améliore", "Il reste stable", "Il s’aggrave", "Je ne sais pas"] },
  ] },
  { id: "consultation", label: "Demande de consultation", questions: [
    { id: "objective", label: "Quel est l’objectif de votre consultation ?" },
    { id: "symptoms", label: "Avez-vous actuellement des symptômes ?", options: yesNo },
  ] },
  { id: "other", label: "Autre problème", questions: [
    { id: "subject", label: "Quel problème ou quelle question souhaitez-vous aborder ?" },
    { id: "onset", label: "Depuis quand cela vous concerne-t-il ?" },
  ] },
];

export const identityFields = [
  { id: "name", label: "Nom et prénom", type: "text", autocomplete: "name" },
  { id: "fileNumber", label: "Numéro de dossier USJ", type: "text", autocomplete: "off" },
  { id: "birthDate", label: "Date de naissance", type: "date", autocomplete: "bday" },
  { id: "phone", label: "Numéro de téléphone", type: "tel", autocomplete: "tel" },
  { id: "email", label: "Email facultatif", type: "email", autocomplete: "email" },
] as const;

export type Identity = Record<(typeof identityFields)[number]["id"], string>;
export const emptyIdentity: Identity = { name: "", fileNumber: "", birthDate: "", phone: "", email: "" };
export const steps = ["Identification", "Motif", "Symptômes", "Photos", "Service", "Récapitulatif"];
