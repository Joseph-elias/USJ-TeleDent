import "server-only";
import { cookies } from "next/headers";
import { sessionCookieName } from "./auth";

export async function currentDentistToken() {
  return (await cookies()).get(sessionCookieName)?.value;
}
