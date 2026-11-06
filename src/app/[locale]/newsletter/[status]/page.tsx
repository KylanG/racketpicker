import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { isNewsletterStatus, NEWSLETTER_STATUSES } from "@/lib/newsletter/status";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    NEWSLETTER_STATUSES.map((status) => ({ locale, status })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/newsletter/[status]">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "newsletter.status" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

/** Result of a newsletter confirmation or unsubscribe link (RP-32). */
export default async function NewsletterStatusPage({
  params,
}: PageProps<"/[locale]/newsletter/[status]">) {
  const { locale, status } = (await params) as { locale: Locale; status: string };
  setRequestLocale(locale);
  if (!isNewsletterStatus(status)) notFound();
  const t = await getTranslations({ locale, namespace: "newsletter.status" });

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header />
        <section
          id="main"
          tabIndex={-1}
          className="rp-container flex flex-col gap-[18px] pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)] outline-none"
        >
          <nav aria-label={t("breadcrumb")}>
            <ol className="text-on-dark flex gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t("title")}
              </li>
            </ol>
          </nav>
          <Reveal>
            <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
              {t(`${status}.heading`)}
            </h1>
          </Reveal>
          <p className="text-on-dark-strong max-w-[640px] text-[17px] leading-normal">
            {t(`${status}.text`)}
          </p>
          <Slant
            as={Link}
            href={{ pathname: "/", hash: "deals" }}
            className="bg-lime hover:bg-lime-hover mt-2 self-start px-6 py-3.5 text-[15px] font-semibold text-green-950 hover:text-green-950"
          >
            {t("cta")}
          </Slant>
        </section>
      </div>
    </>
  );
}
