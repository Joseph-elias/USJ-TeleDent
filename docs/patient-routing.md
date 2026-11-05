# USJ TeleDent patient routing

Draft for USJ clinical and operational review. The prototype assigns the first department queue from structured answers and date of birth. Staff can review the original answers and transfer the request from the dentist dashboard. The form asks about symptoms and treatments in everyday language and displays the assigned service on private tracking after submission.

## Decision table

Rules run from top to bottom. The first matching rule wins. Both safety questions appear for every contact reason before the optional photos.

| Order | Patient answers | Department and initial priority | Form action or rationale |
| --- | --- | --- | --- |
| 1 | Reports trouble breathing or swallowing, substantial face or neck swelling, heavy bleeding that won't stop, or serious face or jaw injury. Also applies when the swelling follow-up confirms difficulty opening the mouth, breathing, or swallowing. | Urgences · High | Immediately show instructions to seek emergency care or call local emergency services without waiting for an online reply. [NHS abscess guidance][nhs-abscess] · [NHS England urgent dental care][nhs-urgent] |
| 2 | Reports a knocked-out tooth, worsening swelling or swelling with fever, or severe pain they cannot relieve. Also applies if follow-up answers report increasing swelling, fever with swelling, current or persistent bleeding, a tooth injury or bleeding after trauma, or swelling with post-treatment pain. | Urgences · High | Show instructions to contact urgent dental care promptly. The trauma and bleeding questions group findings of different severity, so the prototype sends positive answers for early staff review. [SDCEP care categories][sdcep] · [SDCEP trauma guidance][sdcep-trauma] · [NHS England urgent dental care][nhs-urgent] |
| 3 | Either safety answer is uncertain. Also applies to remaining swelling or trauma cases, bleeding with uncertain activity or persistence, post-treatment pain with uncertain swelling, worsening or uncertain recovery, and a restoration problem with pain or uncertain pain. | Urgences · Normal | Staff review the unclear presentation. The Urgences queue is a prototype intake choice. [NHS England clinical triage][nhs-urgent] |
| 4 | Below age 18 on the Beirut calendar date of submission, with none of the preceding rules triggered. | Pédodontie · Normal | Pediatric dentistry covers children and adolescents. USJ needs to confirm the cutoff and how to handle adolescents needing a specialty. [AAPD pediatric dentistry][aapd] |
| 5 | Reports an extraction, wisdom tooth, or oral surgery as the concern. | Chirurgie bucco-dentaire · Normal | Route by the stated treatment or concern. [USJ Faculty of Dental Medicine][usj] · [AAOMS wisdom teeth][aaoms] |
| 6 | Reports a gum concern or gum treatment, including bleeding with brushing when current and persistent bleeding are both denied. | Parodontologie · Normal | The gum context supports the referral. [American Academy of Periodontology][aap] |
| 7 | Reports root canal treatment, including follow-up or pain after that treatment, with the preceding rules cleared. | Endodontie · Normal | Route by the stated treatment. A primary bleeding complaint with only a root canal context goes to staff review. [AAE treatment planning][aae] |
| 8 | Selects a restoration or prosthesis problem and denies pain, or identifies a filling, crown, bridge, or denture as the concern. | Dentisterie restauratrice / conjointe · Normal | A primary bleeding complaint with only a restoration context goes to staff review. [NHS England examples][nhs-urgent] · [USJ Dental Care Centre][usj-centre] |
| 9 | Adult consultation, follow-up, or other request without enough structured information for a preceding rule. Also covers remaining unmatched complaints. | Urgences · Normal | Staff review and can transfer the request. |

## What USJ needs to confirm

- Confirm the staff owner and coverage for routine review. USJ publishes the existence of an emergency, episodic-care and trauma unit. Queue ownership, review hours, and routing exceptions are local decisions. [USJ Faculty of Dental Medicine][usj]
- Review the French, English, and Arabic emergency wording, the age threshold, and rules for uncertain answers, mild trauma, bleeding, and post-treatment complaints. The source guidelines describe triage and specialty scope. The mapping above is a draft for this particular questionnaire.
- Use fictional submissions for prototype review. Confirm that staff can separate high-priority Urgences requests from normal-priority review requests and can transfer both. The form provides urgent-care signposting and staff see the full answers for assessment.

## Verification examples

- Adult, pain after root canal treatment, both safety answers negative, swelling denied → **Endodontie**.
- Adult, bleeding during brushing, both safety answers negative, current and persistent bleeding denied, gum context selected → **Parodontologie**.
- Child, consultation without safety flags → **Pédodontie**. If a tooth was knocked out → **Urgences**, high priority, with a prompt to contact urgent dental care.
- Swelling with difficulty swallowing → **Urgences**, high priority, with immediate emergency instructions.
- Adult, generic consultation with unknown context → **Urgences**, normal priority for staff review.

[usj]: https://usj.edu.lb/fr/fmd
[usj-centre]: https://www.usj.edu.lb/fmd/rattaches.php?inst=222&lang=1
[nhs-urgent]: https://www.england.nhs.uk/long-read/clinical-guidance-unscheduled-urgent-and-non-urgent-dental-care/
[nhs-abscess]: https://www.nhs.uk/conditions/dental-abscess/
[sdcep]: https://www.acutedentalproblems.sdcep.org.uk/supporting-tools/dental-practice-guide/categories-of-care/
[sdcep-trauma]: https://www.acutedentalproblems.sdcep.org.uk/guidance/management-of-oral-conditions/less-common-oral-conditions/injuries-to-the-mouth-face-and-jaws/
[aapd]: https://www.aapd.org/resources/parent/faq/
[aaoms]: https://aaoms.org/wp-content/uploads/2024/05/wisdom_teeth_management.pdf
[aap]: https://www.perio.org/for-patients/gum-disease-information/
[aae]: https://www.aae.org/specialty/clinical-resources/treatment-planning/
