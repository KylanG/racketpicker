import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-black italic">{t("title")}</h1>
      <Link href="/" className="underline underline-offset-4">
        {t("back")}
      </Link>
    </main>
  );
}
