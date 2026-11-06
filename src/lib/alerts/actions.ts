"use server";

import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { isValidEmail } from "@/lib/newsletter/email";
import { createAlert } from "./alerts";
import { parseTarget } from "./rules";

export type AlertResult = { status: "sent" | "invalid" | "unavailable" };

/** Price or stock alert from the product page (RP-33); double opt-in by mail. */
export async function createAlertAction(input: {
  productId: string;
  email: string;
  target: string | number | null;
  stock: boolean;
}): Promise<AlertResult> {
  if (typeof input?.email !== "string" || !isValidEmail(input.email)) return { status: "invalid" };
  if (typeof input.productId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.productId)) {
    return { status: "invalid" };
  }
  const target = input.stock ? null : parseTarget(input.target);
  if (!input.stock && target == null) return { status: "invalid" };
  const status = await createAlert({
    productId: input.productId,
    email: input.email,
    kind: input.stock ? "stock" : "price",
    target,
    locale: (await getLocale()) as Locale,
  });
  return { status };
}
