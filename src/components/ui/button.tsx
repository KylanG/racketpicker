import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { ArrowIcon } from "./icons";
import { Slant } from "./slant";

/**
 * Buttons from the handover (8px slant, 6px rounded corners).
 * - lime:  primary CTA ("Bekijk bij [winkel]", "Zoeken")
 * - dark:  green-950 with a lime arrow ("Bekijk beste prijs")
 * - light: surface ("Meer laden", "Zet een voorraadalert")
 * - ink:   ink on light pages ("Wis alle filters")
 */
const VARIANTS = {
  lime: "bg-lime text-green-950 hover:bg-lime-hover",
  dark: "bg-green-950 text-white hover:bg-green-800 hover:text-white [&_[data-arrow]]:text-lime",
  light: "bg-surface text-ink hover:bg-surface-hover",
  ink: "bg-ink text-white hover:bg-green-800 hover:text-white",
} as const;

const SIZES = {
  md: "min-h-11 px-4 py-[13px] text-[14px]",
  lg: "min-h-12 px-[30px] py-[14px] text-[15px]",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

type ButtonProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  /** Show the ↗ arrow that spins on hover. */
  arrow?: boolean;
  /** Full width with label left and icon right, as on product cards. */
  block?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Button<T extends ElementType = "button">({
  as,
  variant = "lime",
  size = "md",
  arrow = false,
  block = false,
  icon,
  className = "",
  children,
  ...rest
}: ButtonProps<T>) {
  const Component: ElementType = as ?? "button";
  const isButton = Component === "button";
  return (
    <Slant
      as={Component}
      size={8}
      {...(isButton && !("type" in rest) ? { type: "button" } : {})}
      className={[
        "ease-rp inline-flex cursor-pointer items-center gap-2 font-semibold transition-colors duration-300",
        "disabled:cursor-not-allowed disabled:opacity-40",
        block ? "w-full justify-between" : "justify-center",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
      {icon ?? (arrow ? <ArrowIcon /> : null)}
    </Slant>
  );
}
