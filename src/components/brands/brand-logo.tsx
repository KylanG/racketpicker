/**
 * One-colour brand logo (RP-56) as a CSS mask filled with the text colour, so it follows
 * hover and dark/light backgrounds; the name stays for screen readers. Without a logo the
 * name is shown in capitals.
 */
export function BrandLogo({
  name,
  logo,
  className = "h-11 w-[150px]",
}: {
  name: string;
  logo: string | null;
  className?: string;
}) {
  if (!logo) {
    return <span className="text-[22px] font-bold tracking-[-0.3px] uppercase">{name}</span>;
  }
  return (
    <span className="block w-full">
      <span
        aria-hidden="true"
        className={`block bg-current ${className}`}
        style={{
          maskImage: `url(${logo})`,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
        }}
      />
      <span className="sr-only">{name}</span>
    </span>
  );
}

/** Public path of a stored logo path ("brands/x.svg" → "/brands/x.svg"). */
export const logoSrc = (path: string | null) => (path ? `/${path.replace(/^\//, "")}` : null);
