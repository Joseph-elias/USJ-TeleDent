# USJ TeleDent

A teledentistry website connecting patients with dental professionals.

## Project scope

The application includes:

- `/` — USJ TeleDent homepage with Patient Portal and Dentist Portal links.
- `/patient` — mobile-first French patient interface with a local multi-step form.
- `/dentist/login` — French local dentist login.
- `/dentist` — protected dentist dashboard, scoped to the account's department.
- `/patient/track/<private-token>` — private tracking page for a saved local request.

Steps 3–4 provide the approved French patient form, local submission, and private tracking. Step 5 adds local dentist login and a department-scoped, read-only dashboard. Step 2 Supabase files remain prepared but **not deployed**. Do not connect Supabase or supply database credentials. Request details, clinical evaluation, dentist responses, appointments, and notifications are not implemented. Development stops after Step 5.

**This is a local development prototype. Use fictional patient data only. Do not deploy filesystem-backed storage as a production system.**

## Technology

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- npm
- Node.js filesystem and local JSON/photo files (no database)

## Local installation

Use Node.js 22.23.3 or newer with npm (tested with 22.23.3). Confirm `node --version` and `npm --version` work in your terminal. If you use a Node version manager, activate your installed Node version first.

From the project directory:

```sh
npm ci
```

No environment variables, database credentials, or external services are required. The patient flow needs no setup. Generate local dentist test credentials with `npm run dentists:seed` as described below. Keep the deferred Supabase setup unexecuted.

## Start development

```sh
npm run dev -- --hostname 127.0.0.1
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Binding to loopback keeps this prototype on your machine. The portal links open `/patient` and `/dentist`.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Type checking first generates Next.js route types, so it also works before the first build. Tests use Node's test runner and the existing TypeScript compiler; no test dependencies were added. They cover patient storage plus account generation, password verification, session expiration/revocation, department isolation, counts, and filters. Test storage is isolated under `.npm-cache/` and removed afterward.

## Run a production build locally

```sh
npm run build
npm start -- --hostname 127.0.0.1
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). This command is for checking the build locally, not deploying it.

## Structure

```text
src/
  app/
    globals.css          Shared styles and Tailwind theme
    layout.tsx           Shared header, footer, and metadata
    page.tsx             Homepage
    patient/page.tsx     French patient interface
    patient/track/[token]/
    api/requests/        Submission and token-protected read/photo routes
    dentist/page.tsx     Protected department dashboard
    dentist/login/      Local login
    api/dentist/         Login, logout, and protected request list
  components/
    brand.tsx            Homepage brand link
    portal-placeholder.tsx
  components/patient/
    patient-data.ts      Static departments, reasons, and question definitions
    patient-flow.tsx     Multi-step form and local submission
    submission-confirmation.tsx
  lib/requests/
    types.ts             Request, photo, and tracking types
    validation.ts        Shared validation using existing question definitions
    storage.ts           Server-only local JSON/photo storage
    http.ts              Private responses and bounded multipart parsing
  lib/dentist/           Password hashes, accounts/sessions, scoped dashboard
  components/dentist/    French login form and dashboard
  lib/supabase/
    server.ts            Server-only, unprivileged Supabase client factory
supabase/
  config.toml            Local CLI configuration (not a hosted project link)
  migrations/            Step 2 schema, department seed, and private bucket
  verify.sql             SQL checks to run after applying the migration
tests/
  local-requests.test.mjs
  local-dentist.test.mjs
scripts/
  create-dentists.mjs     Generate six fictional accounts without overwriting
.local-data/             Ignored local TEST data; created automatically
  dentists.json          Local accounts; salted password hashes only
  sessions/<hash>.json   Hashed session tokens and expiration
  requests/<uuid>.json
  photos/<request-uuid>/<photo-uuid>.<jpg|png|webp>
```

## Step 5: Local dentist login and dashboard

From the project directory:

```sh
npm run dentists:seed
npm run dev -- --hostname 127.0.0.1
```

The account command creates **one fictional dentist for each of the six existing departments** in `.local-data/dentists.json`. It prints each email and randomly generated TEST password to your terminal **once**. Keep that output privately; plaintext passwords are not saved and cannot be recovered from hashes. No account or patient file is overwritten. Running the command again reports that the accounts already exist and leaves them unchanged. There is no public registration, password-reset page, or account-management API.

Open [http://127.0.0.1:3000/dentist/login](http://127.0.0.1:3000/dentist/login) and enter a generated email and password. Visiting `/dentist` without a valid session redirects to login. After login, the dashboard displays the dentist's name, assigned department, four summary cards, and a read-only patient request table. The sidebar provides **Se déconnecter**. There are no request-detail links or editing controls.

### Test two departments

1. In the existing patient interface, submit a **fictional** request addressed to **Endodontie** and another to **Parodontologie**. Keep both private tracking links.
2. Log in as the generated Endodontie account (`dentiste3@usj-teledent.test`) using its printed password. Confirm its name/service, the Endodontie request, and absence of Parodontologie patients.
3. Test **Toutes**, **Nouvelles**, **En cours**, **Répondues**, and **Clôturées**, plus priorities **Toutes**, **Normale**, **Haute**, then **Appliquer**. Fresh patient submissions are all `nouveau` / `normal`, so other filters will normally show an empty state in Step 5.
4. Log out, then log in as the Parodontologie account (`dentiste2@usj-teledent.test`). Confirm it sees its own service's requests only. Changing URL parameters such as `department=Endodontie` cannot change this access.
5. Log out and reopen `/dentist`: it must redirect to login. Calling `GET /api/dentist/requests` without a session must return 401. The old session is invalid even if its old cookie is replayed.
6. Open both patient tracking links and verify that Step 4 still works. Existing patient requests/photos are not changed or deleted by login, filtering, seeding, or logout.

Dashboard counts always cover the **entire authenticated department**, independent of active table filters. **Demandes traitées** counts `repondu` plus `cloture`. Status filter keys are `all`, `nouveau`, `en_cours`, `repondu`, `cloture`; priority keys are `all`, `normal`, `high` (displayed as Haute). Unknown filters fall back to Toutes. These filters do not update or evaluate requests. The automated tests create isolated fictional status/priority fixtures to cover all cases without changing existing patient records.

### Local authentication and privacy

- Passwords use Node.js built-in scrypt with independent random salts (`N=131072`, `r=8`, `p=1`) and constant-time hash comparisons. No extra authentication dependency is installed.
- Successful login issues a fresh random 256-bit session token in an **HTTP-only, SameSite=Strict** cookie. Cookies and server sessions expire after **8 hours**. Cookies use `Secure` for HTTPS (including a local TLS proxy reporting `X-Forwarded-Proto: https`). Keep the app bound to loopback; this prototype is not configured for untrusted proxies.
- `.local-data/sessions/<sha256-token-hash>.json` stores the hash, dentist ID, creation and expiration dates, never the raw token. Sessions survive a server restart until they expire or are revoked. Logout deletes the session file and expires the cookie. Existing sessions are rotated on successful login. Expired files may remain on disk but are never accepted.
- Every protected page/API request looks up the current dentist account server-side. Removing an account revokes its access; changing its assigned department takes effect on the next request. No browser-supplied dentist/department selection grants access.
- Department filtering happens **before** an explicit projection of table fields. Dashboard responses exclude tracking tokens/hashes, password hashes, account lists, patient contact details, symptom answers, and photo paths. No-store, no-index, and no-referrer protections also cover dentist pages and endpoints.
- Login and logout require a matching local Origin, or browser-confirmed same-origin Fetch Metadata when the no-referrer policy suppresses Origin on a native form POST. Cross-site requests are rejected. The login form holds only the credentials entered by the user, and JavaScript never receives session tokens in JSON or localStorage. Error messages do not reveal whether an email exists.

| Dentist endpoint | Behavior |
| --- | --- |
| `POST /api/dentist/login` | Same-origin JSON `{ email, password }`; verifies credentials and sets the session cookie. |
| `POST /api/dentist/logout` | Same-origin POST; revokes the session and redirects to login. |
| `GET /api/dentist/requests?status=all&priority=all` | Authenticated, department-scoped dashboard rows/counts; 401 without a valid session. |

The entire `.local-data/` directory is ignored by Git and must stay outside `public/`. Never commit terminal credentials or account/session data. To invalidate all demo sessions manually, stop the server, verify `.local-data/sessions` is the intended local directory, and remove **only** its session files. Do not remove requests/photos. If you intentionally regenerate accounts later, preserve any existing account file first; the seed command deliberately provides no silent overwrite option.

**This authentication is for local fictional-data testing only. It is not production-ready.** It does not include internet-facing abuse protection or a production account lifecycle. Supabase and the remaining MVP steps are still postponed.

References: [Node.js crypto](https://nodejs.org/api/crypto.html), [OWASP scrypt guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt), and [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies).

## Step 4: Test submission and private tracking locally

Run `npm run dev -- --hostname 127.0.0.1` and open [http://127.0.0.1:3000/patient](http://127.0.0.1:3000/patient). No `.env.local`, Supabase project, or credentials are needed. Use only fictional values, for example **Patient Fictif**, dossier **TEST-LOCAL**, birth date **15/04/1990**, and phone **+961 70 123 456** (not for contacting anyone).

1. Choose one of the four patient entry options.
2. Try **Suivant** with empty identification fields: French validation errors should appear. Fill in the required fields; email is optional. A future birth date or invalid email/phone is rejected.
3. Choose a contact reason, then answer its questions and add a description. Pain, swelling, bleeding, trauma, restoration/prosthesis, follow-up, consultation, and other problems each have relevant questions. Answers start empty; use **Je ne sais pas** for uncertainty. Switching reason preserves separate answers for each reason; the summary shows only the active reason's answers.
4. Optionally attach up to three fictional JPEG, PNG, or WebP photos (maximum 5 MiB / 5,242,880 bytes each). Check previews and removal; try a fourth image, an oversized file, and an unsupported format. On submission the server also validates the count, size, declared MIME, and file signature. Multipart requests are capped at 16 MiB.
5. Choose one of the six departments, then review the summary. Use **Précédent** to edit information; values and photos remain available while navigating.
6. Click **Envoyer ma demande**. The button shows a loading state and prevents repeated clicks. On success, **Votre demande a été enregistrée** appears with the unique reference and status **Nouveau**. No notification to a dentist is claimed or sent.
7. Copy the private link using **Copier le lien privé**, then open **Voir ma demande**. If clipboard access is unavailable, the link is selected for manual copying. Keep this link: there is no lookup by name, file number, or public reference, and the raw token is not recoverable from the saved JSON.
8. Verify the reference, submission date (Beyrouth time), reason, department, and status. Photos are displayed through a protected endpoint. Dentist response/appointment/call fields display only when available; no editing or response workflow exists yet.
9. Refresh the tracking page, stop the server with Ctrl+C, restart it from the same project directory, and reopen the saved link. The request and photos persist. An invalid token must return a generic not-found response; a token for a different request must not expose its photos.
10. Submit a second fictional request, this time with/without photos. Inspect both JSON records and the photo files as described below. Check `/` and `/dentist` still work. Resize between mobile and desktop widths.

Before submission, the unfinished form exists only in React state and is lost on reload. After submission, records live on the server filesystem; neither localStorage nor sessionStorage is used. If saving cannot be confirmed, the form retains its values and displays a French error. A lost HTTP response can leave an already-saved request without its confirmation; this simple local prototype has no retry deduplication or link recovery.

### Storage and private access

The server-only adapter in `src/lib/requests/storage.ts` automatically creates `.local-data/requests/` and `.local-data/photos/`. Each request is a complete JSON file named by UUID, using the Step 2 field names, a local `department` label, and photo metadata. New requests always use `status = nouveau`, `priority = normal`, and null dentist decision/response/appointment/call fields. Server validation never accepts client overrides for these values.

Photo paths contain random UUIDs, never patient-supplied filenames. Nothing is stored under `public/`. The server writes and flushes photos and a temporary JSON file, then atomically renames the JSON file in the same directory. Readers see only committed `.json` records. Handled write/commit failures remove temporary JSON and associated photos. This is a single-machine development adapter, not a production database or crash-recovery system.

Each submission generates a cryptographically random 256-bit token. Only its SHA-256 hash is saved. Reads compare token hashes and scan local UUID JSON files; no separate index is needed for this prototype. The private read API returns only the tracking fields and photo IDs, not identity/contact fields, the token hash, or storage paths.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/requests` | Multipart field `data` containing the JSON form payload; zero to three `photos` files. Returns reference, status, and private tracking path on success. |
| `GET /api/requests/track/<token>` | Token-protected tracking information. Invalid tokens receive the same generic 404. |
| `GET /api/requests/track/<token>/photos/<photo-id>` | Photo bytes only when both token and photo ownership match. |

Private pages, API responses, and photos use no-store caching, no-index headers, and a no-referrer policy. The page also declares robots/referrer metadata. Protected images bypass Next Image optimization. Development request/browser-to-terminal logs are disabled to avoid printing capability URLs. Anyone holding a private link can access that request's tracking and photos: keep it private. Browser history and the copied link remain under your control.

### Inspect or clear local TEST data

With the server stopped, inspect `.local-data/requests/<uuid>.json` in your editor. Photo metadata points to `.local-data/photos/<request-uuid>/<photo-uuid>.<extension>`. These paths are relative to the project root. Do not edit a record while the server is writing it. `.local-data/` is ignored by Git; access is controlled by the local operating-system account as well as the HTTP token checks.

To clear **only fictional patient test data** while preserving dentist accounts and sessions, first stop the server and verify both exact targets from the project root in PowerShell:

```powershell
Resolve-Path -LiteralPath .local-data/requests, .local-data/photos
Get-ChildItem -LiteralPath .local-data/requests
```

Confirm both resolved directories are inside `C:\joseph\ZAKA\codes\USJ-TeleDent\.local-data` and contain only fictional requests/photos. Then delete those two directories only:

```powershell
Remove-Item -LiteralPath .local-data/requests, .local-data/photos -Recurse -Force
```

This permanently invalidates those tracking links and deletes those photos. The two directories will be recreated on the next submission. Dentist accounts and sessions remain intact. Do not delete or move unrelated project directories.

The shared header, footer, skip link, and brand accessibility label are in French so the patient experience has no English shell text. No mockup assets were available in the repository or attached conversation; the implementation follows the specified navy, white, light blue, and clean-card direction.

Emergency warning wording is based on [NHS guidance about serious dental emergencies](https://www.nhs.uk/nhs-services/dentists/how-to-find-an-nhs-dentist-in-an-emergency/) and [breathing/swallowing difficulty](https://www.nhs.uk/symptoms/toothache/). It refers to local emergency services without assuming a country-specific phone number.

## Step 2: Supabase setup (deferred; do not execute for the local MVP)

The migration is prepared locally. It has **not been applied to a hosted database**. No existing Supabase account project has been modified. Database and Storage verification remains pending until you choose a dedicated project and execute the SQL.

### 1. Create or select a dedicated project

In the [Supabase Dashboard](https://supabase.com/dashboard), create a project named **USJ TeleDent**, or select a dedicated project you intend to use for this app. Choose an organization, database password, and region. Wait until the database is ready. Use a fresh project without existing application tables or Storage access policies for this initial migration.

You do not need to create tables, buckets, Auth users, or policies manually; the migration handles the Step 2 schema and bucket. It does not create dentist accounts.

### 2. Configure the local application

Copy `.env.example` to `.env.local` and fill in the real values from that project's **Connect** dialog and **Settings > API Keys**:

| Variable | Real value required |
| --- | --- |
| `SUPABASE_URL` | Your project's Supabase API URL |
| `SUPABASE_PUBLISHABLE_KEY` | Your project's publishable key (`sb_publishable_...`) |

`.env.local` is ignored by Git. Restart the development server after editing it. Do not put real credentials in `.env.example`.

No secret key, legacy service-role key, database password, or Supabase access token is required by the application in Step 2. Never prefix secret/service-role credentials with `NEXT_PUBLIC_`, commit them, or import them into browser code. Future privileged credentials must stay in server environment variables and server-only modules. This step does not add a privileged client.

`src/lib/supabase/server.ts` uses the `server-only` guard and a publishable key. It neither bypasses RLS nor implements login, cookies, or sessions. It validates configuration only when called; the existing pages do not call it or access the database.

### 3. Execute the migration (Dashboard method)

1. Open **SQL Editor** in the dedicated Supabase project.
2. Open [`supabase/migrations/20261030090236_step_2_database_setup.sql`](supabase/migrations/20261030090236_step_2_database_setup.sql).
3. Paste its entire contents into a new SQL query and run it as the default `postgres` role **once**. The transaction applies the schema and seed together; an error rolls it back. Existing application tables with the same names cause an error rather than being replaced.
4. Run the full contents of `supabase/verify.sql` in another SQL Editor query.

This method requires only your signed-in Dashboard account. An API key does not execute schema migrations. The Dashboard method does not record CLI migration history; do not also push this initial migration with the CLI. If switching to CLI deployment later, reconcile the already-applied migration history first.

### Alternative: execute with the Supabase CLI

The CLI is an optional development tool, not an application dependency. The setup was generated with CLI `2.122.0`; use that version for reproducible commands:

```sh
npx supabase@2.122.0 login
npx supabase@2.122.0 link --project-ref YOUR_REAL_PROJECT_REF
npx supabase@2.122.0 db push --dry-run
npx supabase@2.122.0 db push
```

Get the real project reference from the project's Dashboard URL or settings. Authenticate via the CLI's login flow and enter the project's database password if prompted; keep these credentials out of source files and shell arguments. Use this alternative **instead of** executing the migration in SQL Editor. Run `supabase/verify.sql` in SQL Editor afterward.

`supabase/config.toml` configures an optional local Supabase stack. Its `project_id` is a local identifier, not a real hosted project reference. It does not create or link a hosted project. Running a local stack additionally requires Docker; it is not required for the Dashboard setup above. The bucket is created by SQL, so there is no duplicate bucket declaration in the local config.

### Schema and privacy

- `departments`: UUID primary key, unique nonempty name and slug; seeds the six requested departments.
- `clinician_profiles`: primary key references `auth.users(id)`; required full name and department. Deleting an Auth user deletes their profile; referenced departments cannot be deleted.
- `requests`: UUID primary key, unique required reference, required patient/contact/reason/description fields, JSONB symptom answers, department foreign key, timestamps, and the requested nullable follow-up fields. Defaults: status `nouveau`, priority `normal`. Status, priority, and dentist decision are text; no unapproved workflow enum is introduced. A provided tracking token hash must be nonempty and unique; never store a raw tracking token.
- `request_photos`: UUID primary key, request foreign key, unique nonempty Storage object path, and creation timestamp. Store object paths within `patient-photos`, not public or signed URLs. Deleting a request cascades its photo metadata; it does not delete Storage objects. No deletion workflow is implemented.

Foreign keys are indexed. Unique constraints supply their own indexes. A trigger maintains `requests.updated_at` on updates. Optional text fields are nullable; empty strings are rejected when a value is supplied. `symptom_answers` defaults to an empty JSON object.

All four application tables enable RLS and have no access policies. All table privileges are revoked from `PUBLIC`, `anon`, and `authenticated`; explicit CRUD privileges are retained for the trusted `service_role`. This accounts for Supabase's current explicit-grant requirements. An unprivileged request is expected to be denied; do not add temporary grants or permissive policies to make client queries work.

The migration creates one private bucket, **`patient-photos`**, with `public = false`. No Storage object access policies, uploads, signed URLs, or public photo URLs are implemented. In a fresh project, client access is denied by default. Detailed authorization remains out of scope.

### Verification status

Run `supabase/verify.sql` after the migration. It asserts the four tables and RLS flags, the six exact seed departments, foreign-key relationships, unique constraints, required defaults, client privilege revocation, absence of application access policies, and the private bucket. It also lists constraints, indexes, and any pre-existing Storage policies for review. Expected output: a successful verification message and no client-facing Storage policies on a fresh dedicated project.

Until this is run against your chosen Supabase project, live table existence, seed contents, constraints, RLS, and bucket privacy are **pending**, not verified. The Next.js lint, TypeScript, build, and HTTP route checks can be run independently of Supabase credentials.

Official references consulted:

- [JavaScript client initialization](https://supabase.com/docs/reference/javascript/initializing)
- [API keys and secret handling](https://supabase.com/docs/guides/getting-started/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Private Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Explicit Data API grants](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
