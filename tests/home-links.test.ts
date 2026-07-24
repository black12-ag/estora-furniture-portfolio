import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { products } from "../src/lib/products";

const routesDir = join(process.cwd(), "src/routes");
const homeSrc = readFileSync(join(routesDir, "index.tsx"), "utf8");

// Build a set of top-level route paths from files under src/routes.
function collectRoutePaths(): Set<string> {
  const paths = new Set<string>(["/"]);
  for (const f of readdirSync(routesDir)) {
    if (!f.endsWith(".tsx")) continue;
    if (f === "__root.tsx" || f === "index.tsx") continue;
    const base = f.replace(/\.tsx$/, "");
    // e.g. "product.$slug" -> "/product/$slug"
    paths.add("/" + base.replace(/\./g, "/"));
  }
  return paths;
}

const validRoutes = collectRoutePaths();
const validCats = [
  "All", "Accessories", "Cabinets", "Armchairs", "Bookcases",
  "Coffee tables", "Decor", "Floor Lamps", "Bedroom",
];

// Extract every <Link to="..."> occurrence and (optionally) its search cat.
function extractLinks(src: string) {
  const re = /<Link[^>]*\sto="([^"]+)"([^>]*)>/g;
  const out: { to: string; cat?: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const to = m[1];
    const rest = m[2];
    const catMatch = /search=\{\{\s*cat:\s*(?:"([^"]+)"|([A-Za-z_][\w]*\.cat))/.exec(rest);
    out.push({ to, cat: catMatch?.[1] });
  }
  return out;
}

describe("Home page links", () => {
  const links = extractLinks(homeSrc);

  it("has links to render", () => {
    expect(links.length).toBeGreaterThan(5);
  });

  it("every Link `to` targets a real route file", () => {
    for (const l of links) {
      expect(validRoutes, `unknown route ${l.to}`).toContain(l.to);
    }
  });

  it("every home tile that filters shop uses a real catalog category", () => {
    const catalogCats = new Set(products.map(p => p.category));
    catalogCats.add("All");
    for (const l of links) {
      if (l.cat) {
        expect(validCats, `cat ${l.cat} not in filter list`).toContain(l.cat);
        expect(catalogCats.has(l.cat), `no products for cat ${l.cat}`).toBe(true);
      }
    }
  });

  it("wires the three promo tiles to Armchairs, Accessories, Floor Lamps", () => {
    const cats = links.filter(l => l.to === "/shop" && l.cat).map(l => l.cat);
    expect(cats).toEqual(expect.arrayContaining(["Armchairs", "Accessories", "Floor Lamps"]));
  });
});

describe("Analytics wiring", () => {
  it("hero, categories, collections and promo tiles emit track() calls", () => {
    expect(homeSrc).toMatch(/track\("home_hero_cta_click"/);
    expect(homeSrc).toMatch(/track\("home_category_click"/);
    expect(homeSrc).toMatch(/track\("home_collection_click"/);
    expect(homeSrc).toMatch(/track\("home_promo_tile_click"/);
    expect(homeSrc).toMatch(/track\("home_cta_click"/);
  });
});
