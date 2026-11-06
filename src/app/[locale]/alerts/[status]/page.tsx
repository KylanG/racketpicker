import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LinkStatusPage } from "@/components/info/link-status-page";
import { routing, type Locale } from "@/i18n/routing";
import { isLinkStatus, LINK_STATUSES } from "@/lib/newsletter/status";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => LINK_STATUSES.map((status) => ({ locale, status })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/alerts/[status]">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "alerts.status" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

/** Result of an alert confirmation or unsubscribe link (RP-33). */
export default async function Page({ params }: PageProps<"/[locale]/alerts/[status]">) {
  const { locale, status } = (await params) as { locale: Locale; status: string };
  setRequestLocale(locale);
  if (!isLinkStatus(status)) notFound();
  return <LinkStatusPage locale={locale} status={status} namespace="alerts.status" />;
}
