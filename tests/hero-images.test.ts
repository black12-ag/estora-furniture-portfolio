import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const homeSrc = readFileSync(join(process.cwd(), "src/routes/index.tsx"), "utf8");

describe("Hero images: responsive srcset + AVIF/WebP with PNG fallback", () => {
  const heroes = ["hero-slide-chair", "hero-slide-blackchair", "hero-slide-lamp"];

  it("each hero image is imported in PNG, AVIF, WebP, and srcset variants", () => {
    for (const base of heroes) {
      // PNG fallback stays as the plain import.
      expect(homeSrc, `${base} PNG fallback`).toMatch(
        new RegExp(`from\\s+["']@/assets/${base}\\.png["']`)
      );
      // Single-URL AVIF/WebP for the preload href.
      expect(homeSrc, `${base} AVIF single`).toMatch(
        new RegExp(`@/assets/${base}\\.png\\?format=avif`)
      );
      expect(homeSrc, `${base} WebP single`).toMatch(
        new RegExp(`@/assets/${base}\\.png\\?format=webp`)
      );
      // Multi-width srcset variants for responsive selection.
      expect(homeSrc, `${base} AVIF srcset`).toMatch(
        new RegExp(`@/assets/${base}\\.png\\?w=[0-9;]+&format=avif[^"']*&as=srcset`)
      );
      expect(homeSrc, `${base} WebP srcset`).toMatch(
        new RegExp(`@/assets/${base}\\.png\\?w=[0-9;]+&format=webp[^"']*&as=srcset`)
      );
    }
  });

  it("<picture> sources render srcSet + sizes for AVIF and WebP", () => {
    // AVIF source ties srcSet to HERO_IMAGE_SIZES.
    expect(homeSrc).toMatch(
      /<source\s+srcSet=\{s\.imageAvifSet[^}]*\}\s+sizes=\{HERO_IMAGE_SIZES\}\s+type="image\/avif"/
    );
    expect(homeSrc).toMatch(
      /<source\s+srcSet=\{s\.imageWebpSet[^}]*\}\s+sizes=\{HERO_IMAGE_SIZES\}\s+type="image\/webp"/
    );
    // PNG stays as the <img> fallback inside the <picture>.
    expect(homeSrc).toMatch(/src=\{s\.image\}/);
  });

  it("srcset width breakpoints cover mobile through desktop", () => {
    const widths = homeSrc.match(/\?w=([0-9;]+)&format=(?:avif|webp)[^"']*&as=srcset/g) ?? [];
    expect(widths.length).toBeGreaterThanOrEqual(6); // 3 heroes × avif+webp
    for (const q of widths) {
      const list = q.match(/w=([0-9;]+)/)![1].split(";").map(Number);
      expect(list.length).toBeGreaterThanOrEqual(3);
      expect(Math.min(...list)).toBeLessThanOrEqual(400);
      expect(Math.max(...list)).toBeGreaterThanOrEqual(1200);
    }
  });
});

describe("LCP preload markup: AVIF + WebP with responsive srcset and PNG fallback", () => {
  it("head() preloads AVIF and WebP with imagesrcset + imagesizes", () => {
    // AVIF preload with responsive srcset.
    expect(homeSrc).toMatch(
      /rel:\s*"preload"[^}]*href:\s*slideChairAvif[^}]*imagesrcset:\s*slideChairAvifSet[^}]*imagesizes:\s*HERO_IMAGE_SIZES[^}]*type:\s*"image\/avif"[^}]*fetchpriority:\s*"high"/
    );
    // WebP preload with responsive srcset.
    expect(homeSrc).toMatch(
      /rel:\s*"preload"[^}]*href:\s*slideChairWebp[^}]*imagesrcset:\s*slideChairWebpSet[^}]*imagesizes:\s*HERO_IMAGE_SIZES[^}]*type:\s*"image\/webp"[^}]*fetchpriority:\s*"high"/
    );
  });

  it("HERO_IMAGE_SIZES is the single source of truth for sizes/imagesizes", () => {
    expect(homeSrc).toMatch(/export const HERO_IMAGE_SIZES\s*=\s*["'][^"']+["']/);
    // Used by both preload and <picture>.
    const uses = homeSrc.match(/HERO_IMAGE_SIZES/g) ?? [];
    // 1 declaration + 2 preloads + 2 picture sources = 5
    expect(uses.length).toBeGreaterThanOrEqual(5);
  });

  it("PNG fallback stays referenced so non-AVIF/WebP browsers still load the hero", () => {
    expect(homeSrc).toMatch(/import slideChair from ["']@\/assets\/hero-slide-chair\.png["']/);
    // The <img> inside <picture> uses the PNG src.
    expect(homeSrc).toMatch(/src=\{s\.image\}/);
  });
});
