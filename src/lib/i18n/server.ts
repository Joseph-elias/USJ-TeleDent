import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { localeCookie, translate, validLocale } from "./shared";

export const getI18n = cache(async () => {
  const locale = validLocale((await cookies()).get(localeCookie)?.value);
  return { locale, t: (source: string | null | undefined, values?: readonly (string | number)[]) => translate(locale, source, values) };
});
