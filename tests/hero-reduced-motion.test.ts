import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const homeSrc = readFileSync(join(process.cwd(), "src/routes/index.tsx"), "utf8");
const hookSrc = readFileSync(
  join(process.cwd(), "src/lib/use-prefers-reduced-motion.ts"),
  "utf8"
);

describe("HeroSlider respects prefers-reduced-motion", () => {
  it("hook queries the (prefers-reduced-motion: reduce) media query", () => {
    expect(hookSrc).toMatch(/matchMedia\(\s*["'`]\(prefers-reduced-motion:\s*reduce\)["'`]\s*\)/);
  });

  it("HeroSlider imports and calls usePrefersReducedMotion", () => {
    expect(homeSrc).toMatch(/from\s+["']@\/lib\/use-prefers-reduced-motion["']/);
    expect(homeSrc).toMatch(/usePrefersReducedMotion\(\)/);
  });

  it("autoplay interval is skipped when reducedMotion is true", () => {
    // Guard clause bails out before setInterval when reduced motion is on.
    expect(homeSrc).toMatch(/if\s*\(\s*paused\s*\|\|\s*reducedMotion\s*\)\s*return/);
    // Effect deps include reducedMotion so it re-runs when it changes.
    expect(homeSrc).toMatch(/\[\s*paused\s*,\s*reducedMotion\s*\]/);
  });

  it("swipe follow transform is suppressed under reduced motion", () => {
    // Pointer move ignores drag delta when reducedMotion is set.
    expect(homeSrc).toMatch(/if\s*\(\s*reducedMotion\s*\)\s*return\s*;/);
    // Slide container disables the transform + transition under reduced motion.
    expect(homeSrc).toMatch(/transform:\s*reducedMotion\s*\?\s*undefined/);
    expect(homeSrc).toMatch(/transition:\s*reducedMotion\s*\?\s*["']none["']/);
  });
});
