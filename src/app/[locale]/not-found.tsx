import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");
  return (
    <>
      <div className="rp-hero-sub">
        <Header />
      </div>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <h1 className="text-3xl font-black italic">{t("title")}</h1>
        <Link href="/" className="underline underline-offset-4">
          {t("back")}
        </Link>
      </main>
    </>
  );
}
