# Voice dictation

Implemented 3 November 2026 using the browser's Web Speech recognition API. Dictation is an optional input method; ordinary typing and existing validation remain available.

## Fields reviewed

| Field | Input |
| --- | --- |
| Main patient situation/question description | Typed text or dictation, 4,000 characters |
| Treatment received and date (follow-up) | Typed text or dictation, 500 characters |
| Consultation objective | Typed text or dictation, 500 characters |
| Other problem/question | Typed text or dictation, 500 characters |
| Dentist response / transfer note | Typed text or dictation, 4,000 characters |
| Call/video instructions | Typed text or dictation, 2,000 characters |
| Onset/duration answers, restoration type, identity, dates and choices | Existing typed or choice controls |

The clinical details and tracking views are read-only; their displayed descriptions have no microphone control.

## Use

1. Next to a descriptive text area, choose **Dicter ce texte**.
2. Select French (default), Arabic or English and read the explanation about the browser's speech service.
3. Choose **Démarrer la dictée**, then allow microphone access in the browser.
4. Speak, then choose **Arrêter la dictée**.
5. Review and correct the text before continuing or saving.

Confirmed results append to existing text. Provisional recognition results appear separately and are not submitted. The text area is read-only during recognition to prevent voice results overwriting simultaneous edits. Submit/continue actions are blocked while recognition is active, and another descriptive field cannot start a second session. The session stops after one minute; stop waits briefly for the engine's final results. Microphone access is released on completion, errors, navigation, tab hiding or component unmount.

The existing server accepts only the resulting text. No audio endpoint, audio file storage, AI diagnosis, new external SDK, API key or database change was introduced.

## Compatibility and data handling

The implementation detects standard `SpeechRecognition` or prefixed `webkitSpeechRecognition`. Browser and language availability varies. Unsupported browsers show a typing fallback; microphone denial, network failure, unavailable audio input and language errors show actionable feedback. HTTPS or localhost is required by this interface.

Browser speech recognition can use its vendor's online service; this feature does not guarantee on-device processing. That is explained before requesting the microphone. The local prototype remains for fictional data only. No raw audio is saved by this application; the browser provider's own processing/retention rules are separate.

Primary reference: [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Verification

- TypeScript and production build passed.
- Lint passed for all changed dictation files.
- Complete Node regression suite: **19/19 passed**, including four new tests for merging/limits/Unicode, final vs provisional results and duplicate events, late-result cleanup, and error/typing fallbacks.
- Browser verified patient description and consultation objective controls, editable typed text, language selection and a separate typed duration input.
- Expanded patient dictation panel has no page-level overflow at 320, 390, 768 and 1440px viewport widths.
- Browser verified dentist response and conditional video-instruction dictation controls; no evaluation was saved during this check.
- The development server is running at `http://localhost:3000`; this hostname was used for the interactive checks because its development-origin checks blocked the alternate loopback address.
- Actual spoken audio, microphone permission prompts, recognition accuracy and physical iPhone/Android behavior were **not exercised** by the agent. They must be checked with a user's microphone in their target browser.

[Phone UI evidence](ui-evidence/dictation-patient-mobile.jpg).
