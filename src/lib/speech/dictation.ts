export type SpeechResult = { isFinal: boolean; readonly [index: number]: { transcript: string } };
export type SpeechResultsEvent = { results: ArrayLike<SpeechResult> };
export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultsEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
export type SpeechConstructor = new () => SpeechRecognitionLike;

export function speechConstructor(): SpeechConstructor | undefined {
  if (typeof window === "undefined") return;
  const browser = window as unknown as { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function mergeDictation(existing: string, spoken: string, maxLength: number) {
  const transcript = spoken.trim();
  const separator = existing && transcript && !/\s$/u.test(existing) ? " " : "";
  const combined = transcript ? `${existing}${separator}${transcript}` : existing;
  let value = combined.slice(0, maxLength);
  // Match textarea UTF-16 limits without leaving half an emoji at the boundary.
  if (value.length && /[\uD800-\uDBFF]$/u.test(value)) value = value.slice(0, -1);
  return { value, truncated: combined.length > maxLength };
}

export function speechErrorMessage(error: string) {
  switch (error) {
    case "not-allowed": case "service-not-allowed": return "L’accès au micro ou au service vocal a été refusé. Autorisez-le dans votre navigateur ou saisissez votre texte.";
    case "audio-capture": return "Aucun microphone disponible. Vérifiez votre micro ou saisissez votre texte.";
    case "network": return "Le service vocal est indisponible. Vérifiez votre connexion ou saisissez votre texte.";
    case "no-speech": return "Aucune parole détectée. Réessayez en parlant près du micro ou saisissez votre texte.";
    case "language-not-supported": return "Cette langue n’est pas disponible dans votre navigateur. Choisissez une autre langue ou saisissez votre texte.";
    default: return "La dictée n’a pas pu aboutir. Vous pouvez réessayer ou saisir votre texte.";
  }
}

// One browser recognition instance per session. Results contain earlier final
// segments too: rebuild the transcript instead of appending duplicated events.
export function createDictationSession(recognition: SpeechRecognitionLike, options: {
  language: string;
  onStart(): void;
  onResult(finalText: string, interimText: string): void;
  onError(message: string): void;
  onEnd(): void;
}) {
  let disposed = false;
  recognition.lang = options.language;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onstart = () => { if (!disposed) options.onStart(); };
  recognition.onresult = event => {
    if (disposed) return;
    const final: string[] = [], interim: string[] = [];
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript?.trim();
      if (text) (result.isFinal ? final : interim).push(text);
    }
    options.onResult(final.join(" "), interim.join(" "));
  };
  recognition.onerror = event => {
    if (!disposed && event.error !== "aborted") options.onError(speechErrorMessage(event.error));
  };
  recognition.onend = () => { if (!disposed) options.onEnd(); };
  return {
    start() { recognition.start(); },
    stop() { recognition.stop(); },
    dispose() {
      disposed = true;
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      try { recognition.abort(); } catch { /* An already ended engine may reject abort. */ }
    },
  };
}
