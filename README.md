# USJ TeleDent

A teledentistry website connecting patients with dental professionals.

## Step 1 scope

This initial setup contains a responsive homepage and two placeholder pages:

- `/` — USJ TeleDent homepage with Patient Portal and Dentist Portal links.
- `/patient` — mobile-first patient placeholder.
- `/dentist` — desktop-first dentist placeholder.

The Step 1 pages are preserved. Step 2 adds Supabase configuration and a database migration only. Portal features, authentication, patient forms, request submission, tracking, and the dentist dashboard are not implemented.

## Technology

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- npm

## Local installation

Install Node.js 22 LTS or newer with npm. Confirm `node --version` and `npm --version` work in your terminal. If you use a Node version manager, activate your installed Node version first.

From the project directory:

```sh
npm ci
```

The existing pages run without environment variables or external services. Supabase configuration is described below.

## Start development

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The portal links open `/patient` and `/dentist`; each placeholder links back to the homepage.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
```

Type checking first generates Next.js route types, so it also works before the first build.

## Run a production build locally

```sh
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```text
src/
  app/
    globals.css          Shared styles and Tailwind theme
    layout.tsx           Shared header, footer, and metadata
    page.tsx             Homepage
    patient/page.tsx     Patient placeholder
    dentist/page.tsx     Dentist placeholder
  components/
    brand.tsx            Homepage brand link
    portal-placeholder.tsx
  lib/supabase/
    server.ts            Server-only, unprivileged Supabase client factory
supabase/
  config.toml            Local CLI configuration (not a hosted project link)
  migrations/            Step 2 schema, department seed, and private bucket
  verify.sql             SQL checks to run after applying the migration
```

## Step 2: Supabase setup

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
