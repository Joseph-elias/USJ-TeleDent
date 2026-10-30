# USJ TeleDent

A teledentistry website connecting patients with dental professionals.

## Step 1 scope

This initial setup contains a responsive homepage and two placeholder pages:

- `/` — USJ TeleDent homepage with Patient Portal and Dentist Portal links.
- `/patient` — mobile-first patient placeholder.
- `/dentist` — desktop-first dentist placeholder.

Portal features are not available yet. No authentication, database, Supabase integration, patient forms, or dentist dashboard is included. Development stops at Step 1 of the MVP plan.

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

No environment variables or external services are required.

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
```
