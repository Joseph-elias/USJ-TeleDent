# Responsive UI verification

Completed 3 November 2026. The responsive implementation is complete for the existing local prototype. Verification used the in-app Chromium browser and the local production build; physical iOS/Android testing remains pending.

## Delivered

1. Shared visual foundation: navy/blue palette, system typography, reusable controls/icons/status badges, compact header, focus states, safe-area support and an application icon.
2. French homepage and dentist login: prominent portal actions, responsive two-column desktop layout, phone layout, password visibility control and focused validation feedback.
3. Patient flow: clearer six-step progress, compact emergency guidance with expandable full wording, touch-sized inputs/actions, optional photo guidance, compact previews and direct recap editing.
4. Confirmation and tracking: clear saved state, copyable private link, current status, prioritized dentist response and manual refresh.
5. Dentist workspace: phone account/navigation controls, request cards below 1280px, larger-screen table, compact filters, clinical section links, semantic badges and readable evaluation controls.
6. Verification: screen-width checks, patient/dentist journey checks, keyboard/dialog checks, contrast refinement, automated checks and production smoke tests.

No backend contracts, department authorization, photo protection or local storage implementation were changed. No new packages were required.

## Automated checks

| Check | Result |
| --- | --- |
| ESLint, zero warnings | Pass |
| Next route type generation and TypeScript | Pass |
| Existing Node regression suite | 15/15 pass |
| Optimized Next.js/Turbopack build | Pass |
| Git whitespace check | Pass |

The regression suite verifies validation, photo constraints, atomic local writes, credentials/sessions, department-scoped access, evaluation decisions and transfer behavior. It uses isolated test directories.

The first sandboxed regression run could not create a hard link; the authorized run outside the sandbox passed all tests. On this host, build workers initially picked up a broken Node shim or exited under the installed runtime. Putting the bundled Node runtime first on the process PATH produced a successful default Turbopack build. No bundler fallback or project build configuration change was needed.

## Responsive checks

The following seven screens were measured at **320, 375, 390, 430, 768, 1024 and 1440px** viewport widths, for **49 checks**:

| Screen | Result |
| --- | --- |
| Homepage | No page-level horizontal overflow |
| Patient entry | No page-level horizontal overflow |
| Patient identification | No page-level horizontal overflow; 16px input text |
| Private tracking | No page-level horizontal overflow |
| Dentist login | No page-level horizontal overflow |
| Dentist dashboard | Cards below 1280px; table on larger screens; no page-level overflow |
| Clinical case | No page-level horizontal overflow; 16px evaluation controls |

Detailed DOM measurements are in [responsive-checks.json](ui-evidence/responsive-checks.json). Chromium's scrollbar accounts for the 15px difference between viewport width and document client width. Status filters and clinical section links intentionally scroll inside their own regions on narrow screens.

These checks caught and resolved an icon-sizing issue that caused tracking-page overflow. The corrected tracking page passed all seven widths. A small contrast shortfall in secondary text was addressed by darkening the shared slate text token.

## Patient journey checks

- Required identity fields reject an empty step and focus the error summary.
- Entered fictional identity/contact information and advanced through all six steps.
- Consultation purpose preselects its existing corresponding reason.
- Conditional symptoms and description accept the expected answers.
- Selected a fictional PNG through the native picker; preview and count updated.
- Edited identity directly from recap and returned with the photo and other answers retained.
- Changed the reason from recap; the new required questions had to be answered before returning.
- Confirmed identity, description and department survive reason editing.
- Changed the department from recap and returned to the updated summary.
- Submitted one fictional request successfully and opened its confirmation.
- Copied its private tracking link and received success feedback.
- Opened tracking, saw the pending state and its protected attached image.
- Refreshed tracking after a dentist response and saw the saved response.

One clearly named fictional UI request and response remain in ignored local test storage for inspection. The second form used to test recap editing was not submitted. Private tokens are excluded from this report and the evidence JSON.

## Dentist journey checks

- Empty login displays validation feedback.
- Published fictional account signs in successfully.
- Password visibility control changes the input type.
- Status selection retains the active filter; combined status/priority filtering works.
- An empty filtered result displays explanatory feedback and a reset action.
- Opened the newly submitted fictional case from a request card.
- Opened and closed its private photo dialog.
- Invalid evaluation is rejected; a fictional written response saves successfully.
- Saved evaluation feedback appears and the patient's tracking view receives the response.
- Logout returns to the login screen.

## Keyboard and accessibility checks

- Tab advances from patient name to file number in logical field order.
- Patient and login validation move focus to their error feedback.
- The photo dialog closes with Escape and restores focus to its opening button.
- Labels, fieldsets, native radios/selects, visible focus indicators and live feedback remain in use.
- Zoom is enabled in viewport metadata; no maximum scale is imposed.
- Shared primary actions are at least 48px tall; selectable option rows provide larger targets than the radio itself.
- Shared text/status colors were checked numerically and secondary text was darkened.

These checks are not a complete screen-reader audit or a claim of full accessibility conformance.

## Production smoke tests

The final production build was started on loopback port 3001. Verified:

- Homepage title, application icon, viewport metadata and portal action.
- Phone-sized patient form validation with no page overflow.
- Protected fictional clinical page, persisted response and loaded private photo.
- Matching private patient tracking page and the persisted response.
- No browser console errors during the production patient-form smoke test.

## Screenshots

The homepage screenshots below are from the final production build. Form and case evidence uses fictional data in the development preview.

- [Before: phone homepage](ui-evidence/before-home-mobile.jpg)
- [Before: phone patient entry](ui-evidence/before-patient-mobile.jpg)
- [After: desktop homepage](ui-evidence/after-home-desktop.jpg)
- [After: phone homepage](ui-evidence/after-home-mobile.jpg)
- [After: patient form](ui-evidence/after-patient-mobile.jpg)
- [After: clinical case](ui-evidence/after-case-mobile.jpg)
- [After: evaluation](ui-evidence/after-evaluation-mobile.jpg)

## Remaining device-specific checks

Physical iPhone Safari and Android Chrome were unavailable. Their virtual keyboards, camera/gallery permissions and file formats, browser toolbar movement, notched-screen landscape behavior and actual 200% browser text zoom still need device testing. Slow/offline transport and clipboard-denial paths were not artificially forced in this pass; existing error handling remains in place. Photo removal was reviewed in source, while selection, preview, retention and protected delivery were exercised in the browser.

A manifest, installation prompts, push notifications and offline/private-data caching remain separate optional scope. This pass provides a responsive web application and does not make the local filesystem prototype a hosted production service.
