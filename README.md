# USJ TeleDent

A teledentistry website connecting patients with dental professionals.

## Project scope

The application includes:

- `/` — USJ TeleDent homepage with Patient Portal and Dentist Portal links.
- `/patient` — mobile-first French patient interface with a local multi-step form.
- `/dentist` — desktop-first dentist placeholder.
- `/patient/track/<private-token>` — private tracking page for a saved local request.

Step 4 adds local request submission, filesystem persistence, and private tracking to the approved French patient form. Step 2 Supabase files remain prepared but **not deployed**. Do not connect Supabase or supply database credentials. Dentist login, dashboard, clinical evaluation, responses, and notifications are not implemented. Development stops after Step 4.

**This is a local development prototype. Use fictional patient data only. Do not deploy filesystem-backed storage as a production system.**

## Technology

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- npm
- Node.js filesystem and local JSON/photo files (no database)

## Local installation

Install Node.js 22 LTS or newer with npm. Confirm `node --version` and `npm --version` work in your terminal. If you use a Node version manager, activate your installed Node version first.

From the project directory:

```sh
npm ci
```

No environment variables, credentials, or external services are required. Keep the deferred Supabase setup below unexecuted.

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

Type checking first generates Next.js route types, so it also works before the first build. Tests use Node's test runner and the existing TypeScript compiler; no test dependencies were added. They cover validation, independent request tokens, photo limits/signatures, complete JSON writes, and cleanup after an injected commit failure. Test storage is isolated under `.npm-cache/` and removed afterward.

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
    dentist/page.tsx     Dentist placeholder
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
  lib/supabase/
    server.ts            Server-only, unprivileged Supabase client factory
supabase/
  config.toml            Local CLI configuration (not a hosted project link)
  migrations/            Step 2 schema, department seed, and private bucket
  verify.sql             SQL checks to run after applying the migration
tests/
  local-requests.test.mjs
.local-data/             Ignored local TEST data; created automatically
  requests/<uuid>.json
  photos/<request-uuid>/<photo-uuid>.<jpg|png|webp>
```

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

To clear **only fictional local test data**, first stop the server and verify the exact target from the project root in PowerShell:

```powershell
Resolve-Path -LiteralPath .local-data
Get-ChildItem -LiteralPath .local-data/requests
```

Confirm the resolved directory is `C:\joseph\ZAKA\codes\USJ-TeleDent\.local-data` and contains only test records. Then delete that directory:

```powershell
Remove-Item -LiteralPath .local-data -Recurse -Force
```

This permanently invalidates its tracking links and deletes its photos. Directories will be recreated on the next submission. Do not delete or move unrelated project directories.

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
