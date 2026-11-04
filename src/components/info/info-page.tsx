import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { ArrowIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { intlLocale, type Locale } from "@/i18n/routing";
import { companyDetails } from "@/lib/company";
import { contactFormEnabled } from "@/lib/contact/config";
import { ContactForm } from "./contact-form";

export type InfoPageKey =
  "about" | "howWeEarn" | "contact" | "privacy" | "cookies" | "priceHistory" | "faq";

type Section = {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  after?: string[];
};

/** Last content change of the legal texts; shown on privacy and cookie pages. */
const UPDATED = "2026-11-04";

/** Pages that show the company block at the bottom. */
const WITH_COMPANY: InfoPageKey[] = ["about", "privacy", "contact"];

/**
 * Info pages (design/handoff/Info.dc.html): hero with breadcrumb, then the sections.
 * With more than 2 sections a sticky "Op deze pagina" table of contents sits on the left.
 */
export async function InfoPage({ page }: { page: InfoPageKey }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("info");
  const sections = t.raw(`pages.${page}.sections`) as Section[];
  const faq = page === "faq" ? (t.raw("pages.faq.items") as { q: string; a: string }[]) : [];
  const company = companyDetails();
  const hasToc = sections.length > 2;
  const isContact = page === "contact";
  const showUpdated = page === "privacy" || page === "cookies";
  const date = new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "long" }).format(
    new Date(UPDATED),
  );

  const companyRows = [
    [t("company.tradeName"), company.tradeName],
    [t("company.legalName"), company.legalName],
    [t("company.kvk"), company.kvk],
    [t("company.vat"), company.vat],
    [t("company.address"), company.address],
    [t("company.email"), company.email],
  ].filter((r): r is [string, string] => Boolean(r[1]));

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header />
        <section className="rp-container flex flex-col gap-[18px] pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={t("breadcrumb")}>
            <ol className="text-on-dark flex gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t(`pages.${page}.title`)}
              </li>
            </ol>
          </nav>
          <Reveal>
            <h1 className="max-w-[820px] text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
              {t(`pages.${page}.title`)}
            </h1>
          </Reveal>
          <p className="text-on-dark-strong max-w-[640px] text-[17px] leading-normal">
            {t(`pages.${page}.intro`)}
          </p>
          {showUpdated && <p className="text-on-dark-3 text-[13px]">{t("updated", { date })}</p>}
        </section>
      </div>

      <main
        id="main"
        tabIndex={-1}
        className="rp-container flex w-full flex-wrap items-start gap-12 pt-[72px] pb-[120px]"
      >
        {hasToc && (
          <nav
            aria-label={t("onThisPage")}
            className="ease-rp sticky top-[calc(var(--rp-hdr,0px)+24px)] flex max-w-[280px] flex-[1_1_220px] flex-col gap-0.5 transition-[top] duration-500 max-[767px]:static max-[767px]:max-w-none"
          >
            <p className="mb-2 text-[13px] font-semibold tracking-[1.2px] text-green-800 uppercase">
              {t("onThisPage")}
            </p>
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-muted block py-2 text-[15px] hover:text-green-950"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div
          className={`flex min-w-0 flex-[3_1_min(100%,560px)] flex-col gap-10 ${isContact ? "max-w-[1120px]" : "max-w-[760px]"}`}
        >
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="flex scroll-mt-[calc(var(--rp-hdr,0px)+24px)] flex-col gap-3"
            >
              <h2 className="text-[24px] font-semibold tracking-[-0.2px]">{s.title}</h2>
              {s.paragraphs.map((p) => (
                <p key={p} className="text-[17px] leading-[1.65] text-[#23402e]">
                  {p}
                </p>
              ))}
              {s.items && (
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[17px] leading-[1.6] text-[#23402e] marker:text-green-800">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
              {s.after?.map((p) => (
                <p key={p} className="text-[17px] leading-[1.65] text-[#23402e]">
                  {p}
                </p>
              ))}
            </section>
          ))}

          {faq.length > 0 && (
            <div className="border-border flex flex-col border-t">
              {faq.map((f) => (
                <details key={f.q} className="border-border group border-b">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="ease-rp shrink-0 text-[22px] font-normal transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-muted mb-5 text-[16px] leading-[1.6]">{f.a}</p>
                </details>
              ))}
            </div>
          )}

          {isContact && <ContactBlock formEnabled={contactFormEnabled()} />}

          {WITH_COMPANY.includes(page) && (
            <section aria-labelledby="company" className="bg-surface flex flex-col gap-3 p-7">
              <h2 id="company" className="text-[20px] font-semibold">
                {t("company.title")}
              </h2>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 text-[15px]">
                {companyRows.map(([label, v]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd>
                      {label === t("company.email") ? (
                        <a href={`mailto:${v}`} className="underline">
                          {v}
                        </a>
                      ) : (
                        v
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </main>

      {page === "faq" && (
        <script
          type="application/ld+json"
          // FAQPage structured data from the same texts as the page.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </>
  );
}

async function ContactBlock({ formEnabled }: { formEnabled: boolean }) {
  const t = await getTranslations("info.pages.contact");
  const { email } = companyDetails();
  const mail = (
    <div className="flex flex-col gap-3.5">
      <Slant
        as="a"
        size={10}
        href={`mailto:${email}`}
        className="[&_[data-arrow]]:text-lime flex items-center gap-[18px] bg-green-950 px-[26px] py-[22px] text-white hover:bg-green-900 hover:text-white"
      >
        <Slant size={5} className="bg-lime grid size-12 shrink-0 place-items-center">
          <svg
            width="22"
            height="22"
            viewBox="0 0 20 20"
            fill="none"
            stroke="var(--color-green-950)"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <rect x="2.5" y="4.5" width="15" height="11" />
            <path d="M3 5l7 6 7-6" />
          </svg>
        </Slant>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-lime text-[13px] font-semibold">{t("mailDirect")}</span>
          <span className="text-[clamp(18px,2vw,22px)] font-semibold break-all">{email}</span>
        </span>
        <ArrowIcon size={14} />
      </Slant>
      <p className="text-muted text-[15px] leading-normal">{t("mailNote")}</p>
    </div>
  );

  if (!formEnabled) return <div className="max-w-[560px]">{mail}</div>;
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="order-2 flex-[1_1_260px]">{mail}</div>
      <div className="order-1 min-w-0 flex-[2_1_min(100%,420px)]">
        <ContactForm />
      </div>
    </div>
  );
}
