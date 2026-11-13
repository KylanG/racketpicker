/**
 * Words in shop titles that describe a variant or a sponsor, not the model (RP-91):
 * "BULLPADEL HACK 05 2027 PAQUITO NAVARRO (Racket)" is the Hack 05 2027.
 */

/** Pro players whose name shops add to a racket or bag title. Full names only. */
export const PLAYERS = [
  "Agustin Tapia",
  "Aimar Goni",
  "Ale Galan",
  "Alejandro Galan",
  "Alejandra Salazar",
  "Alex Ruiz",
  "Ari Sanchez",
  "Arturo Coello",
  "Bea Gonzalez",
  "Claudia Fernandez",
  "Coki Nieto",
  "Delfi Brea",
  "Edu Alonso",
  "Fede Chingotto",
  "Federico Chingotto",
  "Fernando Belasteguin",
  "Franco Stupaczuk",
  "Gemma Triay",
  "Javi Garrido",
  "Javi Leal",
  "Jon Sanz",
  "Juan Lebron",
  "Juan Martin Diaz",
  "Juan Tello",
  "Leo Augsburger",
  "Lucia Sainz",
  "Manu Martin",
  "Marta Ortega",
  "Martin Di Nenno",
  "Miguel Lamperti",
  "Mike Yanguas",
  "Momo Gonzalez",
  "Pablo Cardona",
  "Pablo Lima",
  "Paquito Navarro",
  "Paula Josemaria",
  "Sanyo Gutierrez",
  "Tino Libaak",
] as const;

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const PLAYER_RE = new RegExp(
  `\\b(by\\s+)?(${PLAYERS.map((p) => p.replace(/ /g, "\\s+")).join("|")})\\b`,
  "gi",
);

/** Title without player names ("by Agustin Tapia" too), accents folded. */
export function withoutPlayers(title: string): string {
  return fold(title)
    .replace(PLAYER_RE, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Single words from player names, normalised like match.ts tokens. */
export const PLAYER_WORDS = new Set(
  PLAYERS.flatMap((p) => fold(p).toLowerCase().split(" ")).concat("by"),
);

/**
 * Colours in English, Dutch and Spanish. Not "lime", "ice" or "gold": those are part of
 * model names (Neuvortx Lime, Elite Ice).
 */
export const COLOUR_WORDS = new Set([
  "black",
  "white",
  "grey",
  "gray",
  "red",
  "blue",
  "navy",
  "yellow",
  "green",
  "orange",
  "pink",
  "purple",
  "brown",
  "beige",
  "camel",
  "fluor",
  "zwart",
  "wit",
  "grijs",
  "rood",
  "blauw",
  "geel",
  "groen",
  "oranje",
  "roze",
  "paars",
  "negro",
  "blanco",
  "gris",
  "rojo",
  "azul",
  "amarillo",
  "verde",
  "naranja",
  "rosa",
  "marron",
]);

/** Shop product codes in a title, such as "BPP-24012", "BPP25015", "BPPEX003" or "BPM-24001". */
export const PRODUCT_CODE = /\b[A-Z]{2,5}-?\d{3,6}\b/g;
