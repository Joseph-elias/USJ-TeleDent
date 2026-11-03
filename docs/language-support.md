# Arabic, French and English interface

Implemented 3 November 2026.

## Behavior

- A language selector appears at the top of public/patient pages and in both mobile and desktop dentist layouts. The dentist request error page includes it too.
- Options use their native names: Français, English, العربية.
- The choice is remembered for one year in the `usj_language` preference cookie. Only `fr`, `en` and `ar` are accepted; other values fall back to French.
- Changing language updates client forms immediately and refreshes server-rendered copy. It keeps the same route and preserves mounted form state rather than reloading the page.
- The server reads the preference for the initial HTML language, direction, page metadata and translated server content. Public pages now render dynamically to honor this preference.
- Arabic sets `lang="ar"` and `dir="rtl"`. Layouts use logical alignment, directional icons mirror, and reference/phone/link content is isolated where needed for readability.
- Dates use French, British English or Lebanese Arabic formatting and retain the existing Beirut timezone.
- Dictation defaults to the selected interface language; the separate dictation language control still allows an explicit override.

## Translation scope

The catalog covers navigation, homepage, patient purposes/questions/options, department labels, six form steps, validation and error messages, photos, recap, confirmation, tracking, dentist login/dashboard/case/evaluation, dictation controls and metadata.

**Patient-authored descriptions, names, contact information and dentist-authored responses are not automatically translated.** Display labels change while their original text remains intact. Stored department names, reason/status identifiers and symptom option values remain canonical so existing validation and authorization continue working. For example, Arabic «نعم» still submits the existing answer value `Oui`.

There is no external translation service or new package dependency. Source translations are in `src/lib/i18n/messages.ts`. Shared interpolation and locale handling are in `src/lib/i18n/shared.ts`; server request handling is in `src/lib/i18n/server.ts`; the provider and switcher are in `src/components/i18n.tsx`.

## Checks performed

- Switched the homepage French → English → Arabic and verified translated content, page title, HTML language and direction.
- Navigated into the Arabic patient portal and verified the preference carried across routes.
- Entered fictional Arabic identity information, switched to English and verified the current step and entered values remained unchanged.
- Verified required-field errors switch from English to Arabic without clearing form state.
- Verified Arabic symptom choices display translated labels but retain canonical values.
- Verified dictation defaults to `ar-LB`, then returns to `fr-FR` when the interface switches back to French without a dictation override.
- Entered an Arabic description, switched to French and verified the original Arabic description and selected answer were preserved.
- Entered an unsaved fictional dentist response, switched to Arabic and verified that response and the original patient description remained intact.
- Verified Arabic clinical labels, selected-answer labels and Beirut date formatting.
- Verified the Arabic preference in a newly opened homepage, including server-rendered language/direction.
- No page-level horizontal overflow on Arabic patient and clinical views at 320, 390, 768 and 1440px widths.
- Five localization tests cover locale fallback, patient catalog completeness, canonical identifiers, interpolation, dynamic error translation, title switching and placeholder preservation.
- Full regression suite: 24/24 tests passed. Lint, TypeScript and production build passed.

The translations have not had an independent clinical translator review. Browser-native controls and microphone permission prompts follow the browser/OS language; they are not application strings.

[Arabic phone homepage evidence](ui-evidence/arabic-home-mobile.jpg).
