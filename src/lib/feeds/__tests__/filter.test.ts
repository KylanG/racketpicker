import { describe, expect, it } from "vitest";
import { BAG_KIND, classifyItem, isPadelRacket, RACKET_KIND } from "../filter";

describe("isPadelRacket", () => {
  it.each([
    ["Adidas Metalbone 2026 Padel Racket", "Padel > Rackets"],
    ["Kuikma Carbon 26 Control padelracket", "Sport > Padel > Rackets"],
    ["Bullpadel Vertex 04 2026", "Padel > Rackets"],
    ["Pala de pádel Nox AT10", null],
    ["Head Speed Pro", "Padelrackets"],
  ])("keeps %s", (title, category) => expect(isPadelRacket({ title, category })).toBe(true));

  it.each([
    ["Head Overgrip Prime 3-pack", "Padel > Accessoires"],
    ["Asics Gel-Padel Pro 5 padelschoen heren", "Sport > Padel > Schoenen"],
    ["Hardloopschoen Nike Pegasus 41", "Sport > Hardlopen > Schoenen"],
    ["Padel Racket Tas Adidas Multigame", "Sport > Padel > Tassen"],
    ["Tennisracket Wilson Pro Staff", "Tennis > Rackets"],
    ["Padelballen Head Pro 3 stuks", "Padel > Ballen"],
    ["Racket protector tape", "Padel > Accessoires"],
  ])("drops %s", (title, category) => expect(isPadelRacket({ title, category })).toBe(false));
});

describe("classifyItem (RP-91)", () => {
  it.each([
    ["Nox AT10 Competition Trolley 2024 Agustin Tapia (Racket Bag)", "Padel > Bags"],
    ["Nox ML10 Team Black 2024 (Backpack)", "Padel > Bags"],
    ["STARVIE HARD EVA Black 2027 (Paletero)", "Padel > Bags"],
    ["Adidas Multigame 3.3 padeltas", "Sport > Padel"],
  ])("sees %s as a bag", (title, category) =>
    expect(classifyItem({ title, category })).toEqual(BAG_KIND),
  );

  it.each([
    ["BULLPADEL HACK 05 2027 PAQUITO NAVARRO (Racket)", "Padel > Rackets"],
    ["WILSON BELA MAX Padel 2027 (Pala)", "Padel > Rackets"],
  ])("sees %s as a racket", (title, category) =>
    expect(classifyItem({ title, category })).toEqual(RACKET_KIND),
  );

  it.each([
    ["Pack of 2 Head Base Backpack 17L padel backpacks Black/Yellow", "Padel > Bundles"],
    [
      "Bullpadel Hack 03 2024 padel racket with Bullpadel BPP-24012 Hack racket bag",
      "Padel > Bags",
    ],
    ["Pack HEAD GRAVITY Motion 2022 + HEAD TEAM Bag L Navy", "Padel > Bags"],
    ["Bullpadel BPN-26002 D.CASE Blue 2026 Pablo Cardona (Toiletry Bag)", "Padel > Bags"],
    ["BULLPADEL HACK Junior Girl 2026 (Racket)", "Padel > Rackets"],
    ["PACK AT10 GENIUS 12K Xtrem Limited Edition 2026 (Racket)", "Padel > Rackets"],
    ["Head Motion Pro Boa Padel Shoes", "Padel > Shoes"],
    ["Bullpadel Meis Men's Padel Shorts SS24", "Padel > Clothing"],
  ])("drops %s", (title, category) => expect(classifyItem({ title, category })).toBeNull());
});
