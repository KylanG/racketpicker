import "server-only";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { sportSlug, isSportKey } from "@/lib/catalog/taxonomy";
import { formatPrice } from "@/lib/format/price";
import { mailLayout } from "@/lib/mail/layout";
import { mailConfigured, sendMail } from "@/lib/mail/send";
import { hashToken, isTokenShape, newToken } from "@/lib/mail/tokens";
import { siteUrl } from "@/lib/newsletter/subscribe";
import { createAdminClient } from "@/lib/supabase/admin";
import { shouldNotify, type AlertKind } from "./rules";

const RESEND_AFTER_MS = 10 * 60_000;
const CONFIRM_VALID_MS = 7 * 24 * 60 * 60_000;
/** Resend's free plan allows 100 mails a day; leave room for confirmation mails. */
const MAX_NOTIFICATIONS_PER_RUN = 60;
const AVAILABLE = ["in_stock", "low_stock", "preorder", "unknown"] as const;

type ProductInfo = { title: string; url: string };

/** Published product with its page URL, or null. */
async function productInfo(productId: string, locale: Locale): Promise<ProductInfo | null> {
  const { data } = await createAdminClient()
    .from("product_content")
    .select("slug, title, products!inner(id, status, category_key, sport_key)")
    .eq("product_id", productId)
    .eq("market_code", locale)
    .eq("is_published", true)
    .maybeSingle();
  const p = data?.products;
  if (!data || !p || p.status !== "published" || !p.sport_key || !isSportKey(p.sport_key)) {
    return null;
  }
  const pathname =
    p.category_key === "accessories"
      ? "/accessories/[sport]/[product]"
      : "/rackets/[sport]/[product]";
  const path = getPathname({
    locale,
    href: { pathname, params: { sport: sportSlug(p.sport_key, locale), product: data.slug } },
  });
  return { title: data.title, url: `${siteUrl()}${path}` };
}

const links = (locale: Locale, confirm: string | null, unsubscribe: string) => {
  const base = `${siteUrl()}/api/alerts`;
  return {
    confirm: confirm ? `${base}/confirm?token=${confirm}&locale=${locale}` : null,
    unsubscribe: `${base}/unsubscribe?token=${unsubscribe}&locale=${locale}`,
  };
};

export type CreateOutcome = "sent" | "invalid" | "unavailable";

/**
 * Stores a pending alert and mails a confirmation link (double opt-in, RP-33). Setting
 * the same alert again replaces the target price and sends a new link.
 */
export async function createAlert(input: {
  productId: string;
  email: string;
  kind: AlertKind;
  target: number | null;
  locale: Locale;
}): Promise<CreateOutcome> {
  if (!mailConfigured()) return "unavailable";
  const { productId, kind, target, locale } = input;
  if (kind === "price" && target == null) return "invalid";
  const email = input.email.trim().toLowerCase();
  const product = await productInfo(productId, locale);
  if (!product) return "invalid";

  const db = createAdminClient();
  const { data: existing } = await db
    .from("alerts")
    .select("status, target_price, confirm_sent_at")
    .eq("email", email)
    .eq("market_code", locale)
    .eq("product_id", productId)
    .eq("kind", kind)
    .maybeSingle();
  if (
    existing?.status === "pending" &&
    existing.target_price === target &&
    existing.confirm_sent_at &&
    Date.now() - Date.parse(existing.confirm_sent_at) < RESEND_AFTER_MS
  ) {
    return "sent";
  }

  const confirm = newToken();
  const unsubscribe = newToken();
  const now = new Date().toISOString();
  const { error } = await db.from("alerts").upsert(
    {
      email,
      market_code: locale,
      product_id: productId,
      kind,
      target_price: kind === "price" ? target : null,
      status: "pending",
      confirm_token_hash: confirm.hash,
      unsubscribe_token_hash: unsubscribe.hash,
      confirm_sent_at: now,
      notified_at: null,
      notified_price: null,
      updated_at: now,
    },
    { onConflict: "email,market_code,product_id,kind" },
  );
  if (error) {
    console.error("[alerts] storing failed:", error.message);
    return "unavailable";
  }

  const t = await getTranslations({ locale, namespace: "alerts.mail" });
  const l = links(locale, confirm.token, unsubscribe.token);
  const what =
    kind === "price"
      ? t("confirmPrice", { name: product.title, target: formatPrice(target!, locale) })
      : t("confirmStock", { name: product.title });
  const result = await sendMail({
    to: email,
    subject: t("confirmSubject", { name: product.title }),
    html: mailLayout({
      title: t("confirmTitle"),
      paragraphs: [what, t("ignore")],
      button: { label: t("confirmButton"), href: l.confirm! },
      footer: [t("why"), `${t("unsubscribe")} ${l.unsubscribe}`],
    }),
    text: [
      t("confirmTitle"),
      "",
      what,
      "",
      `${t("confirmButton")}: ${l.confirm}`,
      "",
      t("ignore"),
    ].join("\n"),
    headers: {
      "List-Unsubscribe": `<${l.unsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  return result.ok ? "sent" : "unavailable";
}

export async function confirmAlert(token: unknown): Promise<"confirmed" | "invalid"> {
  if (!isTokenShape(token)) return "invalid";
  const db = createAdminClient();
  const { data } = await db
    .from("alerts")
    .select("id, confirm_sent_at")
    .eq("confirm_token_hash", hashToken(token))
    .maybeSingle();
  if (!data?.confirm_sent_at || Date.now() - Date.parse(data.confirm_sent_at) > CONFIRM_VALID_MS) {
    return "invalid";
  }
  const now = new Date().toISOString();
  const { error } = await db
    .from("alerts")
    .update({ status: "active", confirmed_at: now, confirm_token_hash: null, updated_at: now })
    .eq("id", data.id);
  return error ? "invalid" : "confirmed";
}

export async function unsubscribeAlert(token: unknown): Promise<"unsubscribed" | "invalid"> {
  if (!isTokenShape(token)) return "invalid";
  const now = new Date().toISOString();
  const { data, error } = await createAdminClient()
    .from("alerts")
    .update({ status: "unsubscribed", confirm_token_hash: null, updated_at: now })
    .eq("unsubscribe_token_hash", hashToken(token))
    .select("id");
  return !error && data.length > 0 ? "unsubscribed" : "invalid";
}

export type AlertCheckResult = { active: number; sent: number; failed: number };

/**
 * After the daily import (RP-33): mails every active alert whose condition is met, once,
 * and sets it to "triggered". The unsubscribe link stays valid. Bounded per run.
 */
export async function runAlertChecks(): Promise<AlertCheckResult> {
  const result: AlertCheckResult = { active: 0, sent: 0, failed: 0 };
  if (!mailConfigured()) return result;
  const db = createAdminClient();
  const { data: alerts, error } = await db
    .from("alerts")
    .select("id, email, market_code, product_id, kind, target_price")
    .eq("status", "active")
    .limit(1000);
  if (error) throw new Error(`Loading alerts failed: ${error.message}`);
  result.active = alerts.length;
  if (alerts.length === 0) return result;

  const productIds = [...new Set(alerts.map((a) => a.product_id))];
  const { data: offers, error: offersError } = await db
    .from("offers")
    .select("product_id, market_code, price, stock_status, shops!inner(name)")
    .in("product_id", productIds)
    .eq("is_active", true)
    .in("stock_status", AVAILABLE);
  if (offersError) throw new Error(`Loading offers failed: ${offersError.message}`);
  const best = new Map<string, { price: number; shop: string }>();
  for (const o of offers) {
    const key = `${o.product_id}|${o.market_code}`;
    const current = best.get(key);
    if (!current || o.price < current.price) best.set(key, { price: o.price, shop: o.shops.name });
  }

  const infos = new Map<string, ProductInfo | null>();
  for (const alert of alerts) {
    if (result.sent >= MAX_NOTIFICATIONS_PER_RUN) break;
    const now = best.get(`${alert.product_id}|${alert.market_code}`) ?? null;
    if (
      !shouldNotify(alert as { kind: AlertKind; target_price: number | null }, {
        lowest: now?.price ?? null,
      })
    ) {
      continue;
    }
    const locale = alert.market_code as Locale;
    const infoKey = `${alert.product_id}|${locale}`;
    if (!infos.has(infoKey)) infos.set(infoKey, await productInfo(alert.product_id, locale));
    const info = infos.get(infoKey);
    if (!info || !now) continue;

    // A new unsubscribe token for this mail: the stored hash is all we have of the old one.
    const unsubscribe = newToken();
    const t = await getTranslations({ locale, namespace: "alerts.mail" });
    const l = links(locale, null, unsubscribe.token);
    const price = formatPrice(now.price, locale);
    const isPrice = alert.kind === "price";
    const title = isPrice
      ? t("priceTitle", { name: info.title })
      : t("stockTitle", { name: info.title });
    const body = isPrice
      ? t("priceText", {
          name: info.title,
          price,
          shop: now.shop,
          target: formatPrice(alert.target_price!, locale),
        })
      : t("stockText", { name: info.title, price, shop: now.shop });
    const sent = await sendMail({
      to: alert.email,
      subject: title,
      html: mailLayout({
        title,
        paragraphs: [body, t("once")],
        button: { label: t("viewButton"), href: info.url },
        footer: [t("disclosure"), `${t("unsubscribe")} ${l.unsubscribe}`],
      }),
      text: [title, "", body, "", `${t("viewButton")}: ${info.url}`, "", t("once")].join("\n"),
      headers: {
        "List-Unsubscribe": `<${l.unsubscribe}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (!sent.ok) {
      result.failed++;
      continue;
    }
    const stamp = new Date().toISOString();
    await db
      .from("alerts")
      .update({
        status: "triggered",
        notified_at: stamp,
        notified_price: now.price,
        unsubscribe_token_hash: unsubscribe.hash,
        updated_at: stamp,
      })
      .eq("id", alert.id);
    result.sent++;
  }
  return result;
}
