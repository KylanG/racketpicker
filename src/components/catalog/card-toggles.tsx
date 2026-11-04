"use client";

import { useState } from "react";
import { FavButton } from "@/components/ui/fav-button";
import { CheckIcon } from "@/components/ui/icons";

/*
 * Client islands on the product card. State is local for now; RP-53 (favourites) and
 * RP-28 (compare bar) replace it with their stores. Both sit above the card's stretched
 * link (relative z-10) so they stay separately clickable.
 */

export function CardFavToggle({ label }: { productId: string; label: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <FavButton
      pressed={pressed}
      onToggle={() => setPressed(!pressed)}
      label={label}
      className="relative z-10"
    />
  );
}

export function CardCompareToggle({
  text,
  label,
}: {
  productId: string;
  text: string;
  label: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={() => setPressed(!pressed)}
      className="text-ink relative z-10 mx-[18px] mt-1.5 mb-2 flex min-h-11 cursor-pointer items-center gap-2 self-start text-[13px] font-medium"
    >
      <span
        className={`text-lime grid size-4 place-items-center border-[1.5px] ${pressed ? "border-green-950 bg-green-950" : "border-muted-2 bg-white [&_svg]:opacity-0"}`}
      >
        <CheckIcon size={9} />
      </span>
      {text}
    </button>
  );
}
