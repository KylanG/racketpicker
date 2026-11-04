import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { slantPolygon, type SlantSize } from "@/lib/ui/slant";

type SlantProps<T extends ElementType> = {
  as?: T;
  size?: SlantSize;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

/**
 * The brand's slanted shape. Works in server and client components, with any element
 * or component (`as={Link}`). Renders a polygon clip-path; <SlantRounder /> in the root
 * layout upgrades it to 6px rounded corners once the element's size is known.
 * Focus removes the clip so the focus ring stays visible (globals.css, `[data-slant]`).
 *
 *   <Slant as={Link} href="…" size={8} className="bg-lime px-5 py-3">Bekijk deals</Slant>
 */
export function Slant<T extends ElementType = "div">({
  as,
  size = 8,
  style,
  children,
  ...rest
}: SlantProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component data-slant={size} style={{ clipPath: slantPolygon(size), ...style }} {...rest}>
      {children}
    </Component>
  );
}
