"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FavButton } from "@/components/ui/fav-button";
import { useFavorites } from "@/lib/favorites/store";

/**
 * Heart that saves a product in the favourites (RP-53), with a screen-reader message
 * after each toggle. `label` is the button's name ("Bewaar {name}").
 */
export function FavoriteToggle({
  productId,
  name,
  label,
  className,
}: {
  productId: string;
  name: string;
  label: string;
  className?: string;
}) {
  const t = useTranslations("productCard");
  const { has, toggle } = useFavorites();
  const [message, setMessage] = useState("");
  const pressed = has(productId);
  return (
    <>
      <FavButton
        pressed={pressed}
        label={label}
        className={className}
        onToggle={() => {
          toggle(productId);
          setMessage(t(pressed ? "favRemoved" : "favAdded", { name }));
        }}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
    </>
  );
}
