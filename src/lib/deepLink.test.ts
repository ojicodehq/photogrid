import { describe, expect, it } from "vitest";

import { parseDeepLinkLayout } from "@/lib/deepLink";

function parse(qs: string) {
  return parseDeepLinkLayout(new URLSearchParams(qs));
}

describe("parseDeepLinkLayout", () => {
  it("retourne {} sans aucun param", () => {
    expect(parse("")).toEqual({});
  });

  it("mappe un deep link complet et valide", () => {
    expect(
      parse(
        "format=A5&orientation=landscape&cols=2&rows=3&spacing=8&fit=cover&quality=max",
      ),
    ).toEqual({
      pageSize: "A5",
      orientation: "landscape",
      columns: 2,
      rows: 3,
      spacing: 8,
      fitMode: "cover",
      quality: "max",
    });
  });

  it("est insensible à la casse des valeurs énumérées", () => {
    expect(parse("format=a4&orientation=PORTRAIT&fit=Contain")).toEqual({
      pageSize: "A4",
      orientation: "portrait",
      fitMode: "contain",
    });
  });

  it("ignore un format inconnu, y compris Custom", () => {
    expect(parse("format=custom")).toEqual({});
    expect(parse("format=a3")).toEqual({});
  });

  it("rejette les grilles hors bornes ou non entières", () => {
    expect(parse("cols=0")).toEqual({}); // < min
    expect(parse("cols=13")).toEqual({}); // > max
    expect(parse("cols=2.5")).toEqual({}); // non entier
    expect(parse("cols=abc")).toEqual({}); // NaN
    expect(parse("cols=")).toEqual({}); // vide
  });

  it("borne le spacing à 0..40 mm", () => {
    expect(parse("spacing=0")).toEqual({ spacing: 0 });
    expect(parse("spacing=40")).toEqual({ spacing: 40 });
    expect(parse("spacing=41")).toEqual({});
    expect(parse("spacing=-1")).toEqual({});
  });

  it("n'applique que les params valides d'un mélange valide/invalide", () => {
    expect(parse("format=a5&cols=999&rows=3")).toEqual({
      pageSize: "A5",
      rows: 3,
    });
  });
});
