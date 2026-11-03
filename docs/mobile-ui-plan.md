# USJ TeleDent mobile UI improvement plan

Prepared 3 November 2026. Status: responsive implementation complete; browser checks and automated verification recorded in `ui-verification.md`. Real-device checks remain pending.

## Product and architecture

USJ TeleDent connects a patient request to a department's dentist. The existing local prototype already supports:

- Homepage with two portal entry points.
- Patient landing page, six form steps, photo attachments, confirmation and private tracking.
- Dentist login, department-scoped dashboard, filters, clinical request details and private photo viewing.
- Manual evaluation: advice, call/video instructions, appointment proposals and department transfers.

The app uses Next.js 16.4.3, React 19, TypeScript and Tailwind 4. Pages use the App Router; interactive forms and galleries are client components. Shared styles are in `src/app/globals.css`, but most visual decisions and repeated controls are inline Tailwind classes.

Patient submissions and dentist evaluations use local JSON/photo storage through server routes. Dentist access is session- and department-scoped; patient tracking uses a private capability link. Existing tests cover validation, storage, authorization, evaluation and transfer behavior. There are no browser UI tests in the project.

The README explicitly keeps this a local prototype with fictional data. Supabase integration is deferred. This UI work does not require a backend migration, deployment, live video, notification service or appointment booking.

## Source findings to validate in the browser

These source observations informed implementation. Initial preview navigation failed during planning; the preview was restored during execution and current screenshots and browser checks are saved in `ui-evidence/`. Real phone testing remains pending.

| Area | Existing implementation | Improvement |
| --- | --- | --- |
| Shared shell | Header has a 96px minimum height and can wrap; footer and shell appear on all routes | Compact phone header, consistent content gutters, context-aware navigation |
| Language | English homepage with French application screens and French root language | Consistent French copy by default |
| Visual foundation | Three theme colors, Arial, repeated per-component button/input/card classes | Shared typography, spacing, surfaces, controls and semantic status styles |
| Patient steps | Progress indicator and input focus management already exist | Retain them; clarify the current task and improve navigation placement |
| Patient notices | Full emergency and prototype notices precede the form on every step | Keep critical information visible while reducing repeated vertical space; retain access to full wording |
| Patient form actions | Previous/next buttons wrap; actions sit below the form | Predictable phone action layout; evaluate sticky placement with keyboard and safe-area testing |
| Photos | Up to three JPEG/PNG/WebP images, 5 MB each; native file picker | Clearer selection guidance, compact previews and accessible removal; test camera/gallery compatibility |
| Confirmation/tracking | Reference and private-link tools exist; tracking is a long information card | Strong success state, clear current status and dentist response, usable copy feedback |
| Dentist navigation | Full sidebar stacks above content below the large breakpoint; branding repeats | Compact mobile navigation and account menu, desktop sidebar retained |
| Dentist queue | Table has a 1,050px minimum width inside a horizontal scroll region | Phone request cards with patient, reason, date, status, priority and a clear open action; desktop table retained |
| Dentist evaluation | Long page; several controls use 14px text | Section navigation, readable controls, clear save feedback and phone action placement |
| App installation | No manifest/install assets or service worker in source inventory | Consider install metadata after responsive work; do not cache private records, photos or tokens for offline use |

## Design direction

Build on the existing navy, pale blue and white identity. Use restrained clinical styling: clear headings, generous but economical spacing, subtle borders, consistent icons and strong primary actions. Make the patient journey welcoming and the dentist workspace efficient.

Design the small screen first, then adapt for tablet and desktop. Avoid adding bottom navigation with destinations the product does not have. Patient navigation should support the current request; dentist navigation should support the queue and current case.

## Phased execution

### 1. Capture the baseline and establish foundations

- Restore a browser-accessible local preview and capture homepage, patient entry/form, dentist login, queue and request details.
- Use fictional fixtures for protected and tracking views, without exposing private URLs in reports.
- Define spacing, typography, radius, surface, button, input, notice and status patterns.
- Introduce small shared UI components where repetition justifies them; keep native form semantics.
- Refine the shared header/footer for phones and handle safe-area insets where needed.
- Read installed Next.js guides before changing framework-specific code. The viewport guide confirms that Next already supplies responsive viewport metadata; keep zoom enabled.

Acceptance: agreed visual direction demonstrated on the homepage and one form screen; no content overflow at 320, 375/390 and 430px; desktop layout remains readable. Keyboard focus and text zoom remain usable.

### 2. Improve the homepage and portal entry

- Make French the consistent default language.
- Bring patient and dentist entry actions closer to the initial phone viewport.
- Clarify what each portal does using existing product capabilities.
- Apply the new visual foundation to homepage and dentist login.

Acceptance: both portals are easy to find and open on phones; login has readable controls, autofill, loading and error feedback.

### 3. Refine the patient request journey

- Improve the four purpose cards and six-step progression.
- Reduce repeated introductory space while retaining emergency guidance and local-prototype information.
- Use comfortable phone inputs, appropriate keyboards and consistent selected/error states.
- Make previous/next actions predictable; test any sticky actions against focus scrolling, virtual keyboards and small landscape viewports.
- Improve optional photo selection, previews, limits and removal feedback.
- Add direct edit actions from the recap without clearing existing answers or attachments.
- Keep submission pending/error feedback and duplicate-submit protection intact.

Acceptance: complete the six steps with fictional data on a phone-sized viewport; go backward, change a reason, fix invalid fields, add/remove photos and submit successfully without losing unrelated answers. Unsupported formats receive clear feedback. Do not promise HEIC support while the server accepts only JPEG/PNG/WebP.

### 4. Improve confirmation and private tracking

- Establish a clear saved confirmation, reference and next action.
- Improve private-link presentation and copying, including clipboard failure.
- Prioritize current status, dentist response and any proposed next steps.
- Retain accurate distinctions between proposals and booked appointments, and between instructions and live calls.
- Keep private-link handling and protected photo delivery intact.

Acceptance: confirmation opens the matching tracking view; copying has visible feedback; waiting, replied, appointment and call/video states remain readable at phone widths; long references and text wrap.

### 5. Adapt the dentist workspace

- Replace the stacked phone sidebar with compact navigation and accessible account/logout access.
- Use mobile request cards while retaining the desktop table.
- Make status and priority filters compact and usable with touch.
- Give clinical sections clear hierarchy and useful section links.
- Improve photo viewing and evaluation form layout; keep save feedback close to the action.
- Communicate transfer consequences before submitting a transfer.

Acceptance: a dentist can filter, open a case, inspect a photo and save an evaluation on a phone without needing a wide table. Department access, filters, totals, transfer behavior and logout continue working.

### 6. Verify across devices and decide installation scope

- Check 320, 375/390, 430, 768, 1024 and 1440px widths, including landscape.
- Test keyboard navigation, focus visibility, screen-reader labels, errors and dialog focus handling.
- Target at least 44px touch controls and 16px editable text on phones; check contrast and 200% text zoom.
- Check iOS Safari and Android Chrome on real devices when available; distinguish emulation from real-device verification.
- Verify keyboard opening, browser toolbar changes, camera/gallery selection and slow/failed requests.
- Run lint, type checking, existing tests and production build. Add focused browser regression coverage for meaningful responsive interactions when needed.
- Optionally add manifest and install icons after confirming installation requirements. Offline access and browser persistence of health data need separate design decisions.

Acceptance: patient and dentist journeys pass, browser findings are resolved or documented, and completed checks clearly distinguish automated, emulated and real-device evidence.

## Working method

Implement and verify one phase at a time. Keep changes reviewable and record what changed, evidence, unresolved issues and the next phase. Begin with phase 1, then use its shared foundation for the remaining screens.

## Review status

- [x] Read project scope, routes, shared styling, patient form, confirmation, tracking, dentist shell, queue, login, photos and evaluation.
- [x] Review submission/evaluation data contracts and existing test coverage.
- [x] Read installed Next.js viewport documentation.
- [x] Capture homepage and patient entry phone baselines after restoring the preview.
- [x] Implement responsive foundations, homepage/login, patient flow, confirmation/tracking and dentist workspace.
- [x] Verify browser reflow and complete lint, type checks, existing regression tests and production build.
- [ ] Verify on physical iOS/Android devices and test their virtual keyboards/camera pickers.
- [ ] Optional future scope: installation manifest and offline behavior, after requirements are established.

Application code was unchanged during the initial planning turn. The subsequent execution pass implements this plan; see `ui-verification.md` for evidence and limits.
