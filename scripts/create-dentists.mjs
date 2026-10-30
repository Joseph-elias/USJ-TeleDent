import { randomBytes, randomUUID } from "node:crypto";
import { access, link, mkdir, open, rm } from "node:fs/promises";
import path from "node:path";
import { departments } from "../src/components/patient/patient-data.ts";
import { hashPassword } from "../src/lib/dentist/password.mjs";

const root = path.join(process.cwd(), ".local-data");
const destination = path.join(root, "dentists.json");

async function main() {
  try {
    await access(destination);
    console.log("Les comptes locaux existent déjà : aucun fichier modifié. Les mots de passe ne sont pas récupérables.");
    return;
  } catch (error) { if (error.code !== "ENOENT") throw error; }

  const accounts = [];
  const credentials = [];
  for (const [index, department] of departments.entries()) {
    const password = randomBytes(18).toString("base64url");
    const email = `dentiste${index + 1}@usj-teledent.test`;
    accounts.push({
      id: randomUUID(), full_name: `Dr Camille Démo ${index + 1}`, email,
      password_hash: await hashPassword(password), department,
    });
    credentials.push({ department, email, password });
  }
  await mkdir(root, { recursive: true, mode: 0o700 });
  const temporary = path.join(root, `.dentists-${randomUUID()}.tmp`);
  try {
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(JSON.stringify(accounts, null, 2), "utf8"); await file.sync(); }
    finally { await file.close(); }
    // Atomic publication without replacing an existing account file, even if
    // another seed process wins the race. Patient records are never touched.
    await link(temporary, destination);
  } finally { await rm(temporary, { force: true }); }

  console.log("Six comptes FICTIFS créés. Conservez ces mots de passe : ils ne seront affichés qu’une fois.");
  for (const item of credentials) {
    console.log(`\n${item.department}\nEmail : ${item.email}\nMot de passe TEST : ${item.password}`);
  }
}

main().catch((error) => {
  console.error(error.code === "EEXIST" ? "Des comptes existent déjà. Aucun compte remplacé." : "Création des comptes impossible. Vérifiez les droits du dossier local.");
  process.exitCode = 1;
});
