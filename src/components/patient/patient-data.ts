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
export type Question = { id: string; label: string; options?: readonly string[]; description?: boolean; routing?: boolean };
export type Reason = { id: string; label: string; questions: Question[] };

const safetyQuestions: Question[] = [
  { id: "emergency_signs", label: "Avez-vous du mal à respirer ou à avaler, un gonflement important du visage ou du cou, un saignement abondant qui ne s’arrête pas ou une blessure grave du visage ou de la mâchoire ?", options: yesNo, routing: true },
  { id: "urgent_signs", label: "Avez-vous une dent sortie après un choc, un gonflement qui augmente ou s’accompagne de fièvre, ou une douleur intense que vous n’arrivez pas à calmer ?", options: yesNo, routing: true },
];

export const careContexts = {
  surgery: "Extraction, dent de sagesse ou chirurgie de la bouche",
  gums: "Problème de gencives (par exemple, saignement au brossage) ou soins des gencives",
  rootCanal: "Traitement des canaux d’une dent (dévitalisation)",
  restoration: "Plombage, couronne, bridge ou prothèse",
  unknown: "Autre / Je ne sais pas",
} as const;

const careContextQuestion: Question = {
  id: "care_context",
  label: "Quel problème ou quel soin est concerné ?",
  options: Object.values(careContexts),
  routing: true,
};

const reasonQuestions: Reason[] = [
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
    { id: "treatment", description: true, label: "Quel traitement avez-vous reçu et à quelle date ?" },
    { id: "evolution", label: "Comment votre état évolue-t-il ?", options: ["Il s’améliore", "Il reste stable", "Il s’aggrave", "Je ne sais pas"] },
  ] },
  { id: "consultation", label: "Demande de consultation", questions: [
    { id: "objective", description: true, label: "Quel est l’objectif de votre consultation ?" },
    { id: "symptoms", label: "Avez-vous actuellement des symptômes ?", options: yesNo },
  ] },
  { id: "other", label: "Autre problème", questions: [
    { id: "subject", description: true, label: "Quel problème ou quelle question souhaitez-vous aborder ?" },
    { id: "onset", label: "Depuis quand cela vous concerne-t-il ?" },
  ] },
];

export const reasons = reasonQuestions.map((reason) => ({
  ...reason,
  questions: [
    ...safetyQuestions,
    ...(["pain", "bleeding", "followup", "consultation", "other"].includes(reason.id) ? [careContextQuestion] : []),
    ...reason.questions,
  ],
}));

export const identityFields = [
  { id: "name", label: "Nom et prénom", type: "text", autocomplete: "name" },
  { id: "birthDate", label: "Date de naissance", type: "date", autocomplete: "bday" },
  { id: "fileNumber", label: "Numéro de dossier USJ", type: "text", autocomplete: "off" },
  { id: "phone", label: "Numéro de téléphone", type: "tel", autocomplete: "tel" },
  { id: "email", label: "Email facultatif", type: "email", autocomplete: "email" },
] as const;

export type Identity = Record<(typeof identityFields)[number]["id"], string>;
export const emptyIdentity: Identity = { name: "", fileNumber: "", birthDate: "", phone: "", email: "" };
export const steps = ["Identification", "Motif", "Symptômes", "Photos", "Récapitulatif"];
