import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { ArticleSummary } from "@/lib/blog/articles";

/** 16:10 image of an article, or a quiet tinted block with the tag when there is no photo. */
export function ArticleImage({
  article,
  sizes,
  priority = false,
  className = "aspect-[16/10]",
}: {
  article: Pick<ArticleSummary, "image" | "tag">;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#e8eee2] ${className}`}>
      {article.image ? (
        <Image
          src={article.image.src}
          alt={article.image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="ease-rp object-cover transition-transform duration-[800ms] group-hover:scale-[1.03]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center text-[clamp(22px,2.4vw,32px)] font-semibold tracking-[-0.3px] text-green-800/35"
        >
          {article.tag}
        </span>
      )}
    </div>
  );
}

/** Card in the blog grid, "Lees ook" and the homepage. */
export function ArticleCard({
  article,
  minutesLabel,
  dateLabel,
  headingLevel = "h2",
}: {
  article: ArticleSummary;
  minutesLabel: string;
  dateLabel?: string;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <Link
      href={{ pathname: "/blog/[slug]", params: { slug: article.slug } }}
      className="group text-ink flex flex-col gap-3.5 hover:text-green-800"
    >
      <ArticleImage article={article} sizes="(min-width: 1040px) 33vw, 100vw" />
      <p className="text-[13px] font-semibold tracking-[1px] text-green-800 uppercase">
        {article.tag} · {minutesLabel}
      </p>
      <Heading className="text-[20px] leading-[1.25] font-semibold text-pretty">
        {article.title}
      </Heading>
      {dateLabel && <p className="text-muted-2 text-[13px]">{dateLabel}</p>}
    </Link>
  );
}
