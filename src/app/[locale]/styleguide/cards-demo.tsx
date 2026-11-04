import { ProductCard, ProductGrid } from "@/components/catalog/product-card";
import type { ProductCardData } from "@/lib/catalog/product-card";

/* Product card states for the styleguide (RP-43). Example data, not real prices. */

const base = {
  sport: "Padel",
  imageUrl: "/styleguide/racket.png",
  href: "#",
};

const CARDS: ProductCardData[] = [
  {
    ...base,
    id: "deal",
    brand: "Adidas",
    name: "Adidas Metalbone 2026",
    tags: ["Gevorderd", "Power", "365 g"],
    price: 239,
    compareAt: 289.95,
    shopCount: 6,
    inStock: true,
  },
  {
    ...base,
    id: "normal",
    brand: "Kuikma",
    name: "Kuikma Carbon 26 Control",
    tags: ["Gemiddeld", "Controle", "360 g"],
    price: 89.99,
    shopCount: 3,
    inStock: true,
  },
  {
    ...base,
    id: "sold-out",
    brand: "Bullpadel",
    name: "Bullpadel Vertex 04 Hybrid Limited Edition 2026",
    tags: ["Pro", "Power", "370 g"],
    price: 249,
    shopCount: 0,
    inStock: false,
  },
  {
    ...base,
    id: "shoe",
    imageUrl: null,
    brand: "Asics",
    name: "Asics Gel-Padel Pro 5",
    tags: ["Heren", "Gravel"],
    price: 119.95,
    shopCount: 4,
    inStock: true,
    sizes: { available: ["40", "41", "42", "43", "46"], selected: ["42", "43"] },
  },
];

export function CardsDemo() {
  return (
    <ProductGrid perRow={4}>
      {CARDS.map((card, i) => (
        <ProductCard key={card.id} product={card} priority={i < 2} showCompare={i % 2 === 0} />
      ))}
    </ProductGrid>
  );
}
