import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";
import { parseMarkdown, type Inline } from "@/lib/blog/markdown";

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === "text") return n.text;
    if (n.type === "strong") {
      return (
        <strong key={i} className="text-ink font-semibold">
          {renderInline(n.children)}
        </strong>
      );
    }
    const external = n.href.startsWith("https://");
    return (
      <a
        key={i}
        href={n.href}
        className="text-ink decoration-lime font-medium underline decoration-2 underline-offset-[3px] hover:text-green-800"
        {...(external ? { rel: "noopener", target: "_blank" } : {})}
      >
        {renderInline(n.children)}
      </a>
    );
  });
}

/**
 * Article body (design/handoff/Artikel.dc.html): h2 sections, 17px/1.7 prose in ink-2.
 * Internal links are plain anchors on purpose: article text may link to any site path.
 */
export function MarkdownBody({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  const sections: ReactNode[][] = [[]];
  blocks.forEach((b, i) => {
    if (b.type === "h2" && sections.at(-1)!.length > 0) sections.push([]);
    const current = sections.at(-1)!;
    switch (b.type) {
      case "h2":
        current.push(
          <h2
            key={i}
            id={b.id}
            className="scroll-mt-28 text-[24px] font-semibold tracking-[-0.2px]"
          >
            {renderInline(b.children)}
          </h2>,
        );
        break;
      case "h3":
        current.push(
          <h3 key={i} className="mt-2 text-[19px] font-semibold">
            {renderInline(b.children)}
          </h3>,
        );
        break;
      case "p":
        current.push(
          <p key={i} className="text-ink-2 text-[17px] leading-[1.7] text-pretty">
            {renderInline(b.children)}
          </p>,
        );
        break;
      case "ul":
      case "ol": {
        const List = b.type;
        current.push(
          <List
            key={i}
            className={`text-ink-2 flex flex-col gap-2 pl-6 text-[17px] leading-[1.7] ${
              b.type === "ul"
                ? "list-disc marker:text-green-800"
                : "list-decimal marker:font-semibold"
            }`}
          >
            {b.items.map((item, j) => (
              <li key={j} className="pl-1">
                {renderInline(item)}
              </li>
            ))}
          </List>,
        );
        break;
      }
    }
  });

  return (
    <>
      {sections
        .filter((s) => s.length > 0)
        .map((nodes, i) => (
          <Reveal key={i} className="flex flex-col gap-3">
            {nodes}
          </Reveal>
        ))}
    </>
  );
}
