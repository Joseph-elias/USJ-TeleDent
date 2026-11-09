# Shared dentist test accounts

These passwords are intentionally published for local demonstrations with fictional patient data. Everyone who can access this repository can use them. Do not use these accounts or passwords for production or real patient data.

From a fresh clone or extracted ZIP, install and start:

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

`npm ci` automatically runs `npm run dentists:seed`, which creates these six accounts in `.local-data/dentists.json`. If installation scripts were disabled, run `npm run dentists:seed` yourself.

Open [Dentist login](http://127.0.0.1:3001/dentist/login).

| Department | Email | Password |
|---|---|---|
| Chirurgie bucco-dentaire | service1.710a69@usj-teledent.test | `3Fo7tnUmCVpNZd2Q5sl4` |
| Parodontologie | service2.710a69@usj-teledent.test | `8Etzc8HKeKKVYMH_ezKd` |
| Endodontie | service3.710a69@usj-teledent.test | `CnRLDbAsQlJsoyc34YtJ` |
| Dentisterie restauratrice / conjointe | service4.710a69@usj-teledent.test | `zbHn_XxxDn3hpe6igk9h` |
| Pédodontie | service5.710a69@usj-teledent.test | `Kc4Es5idUAk-T61kcOS5` |
| Urgences | service6.710a69@usj-teledent.test | `DY80EZ7Pm8BFccyZRw2L` |

Existing installations: if `.local-data/dentists.json` already exists, the seed leaves it unchanged. Older accounts retain their previous passwords; the table applies to installations seeded with the shared fixture. No patient records, photos, sessions, or local account files are included in Git. Each clone has its own local data; submissions are not shared between computers.

The source credentials are in `scripts/fixtures/dentist-test-accounts.json`. Locally installed accounts store salted password hashes.
