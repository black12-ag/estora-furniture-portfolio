import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { getSuggestions, _clearSearchCache } from "../src/lib/search-cache";

const headerSrc = readFileSync(
  join(process.cwd(), "src/components/Header.tsx"),
  "utf8",
);

describe("Header search: ARIA combobox pattern", () => {
  it("input carries role=combobox with the expected ARIA wiring", () => {
    expect(headerSrc).toMatch(/role="combobox"/);
    expect(headerSrc).toMatch(/aria-autocomplete="list"/);
    expect(headerSrc).toMatch(/aria-expanded=\{showPanel\}/);
    expect(headerSrc).toMatch(/aria-controls="search-suggestions"/);
    expect(headerSrc).toMatch(/aria-activedescendant=\{activeId\}/);
    expect(headerSrc).toMatch(/aria-label="Search products"/);
  });

  it("suggestions panel is a labelled listbox with option children", () => {
    expect(headerSrc).toMatch(/id="search-suggestions"/);
    expect(headerSrc).toMatch(/role="listbox"/);
    expect(headerSrc).toMatch(/aria-label="Search suggestions"/);
    expect(headerSrc).toMatch(/role="option"/);
    expect(headerSrc).toMatch(/aria-selected=\{i === active\}/);
  });

  it("exposes a polite live region announcing loading / result count / zero results", () => {
    expect(headerSrc).toMatch(/aria-live="polite"/);
    expect(headerSrc).toMatch(/Searching…/);
    expect(headerSrc).toMatch(/suggestion\$\{suggestions\.length === 1 \? "" : "s"\} available/);
    expect(headerSrc).toMatch(/No products match \$\{debouncedQ\}/);
  });
});

describe("Header search: keyboard navigation", () => {
  it("handles ArrowDown / ArrowUp / Home / End / Enter / Escape", () => {
    expect(headerSrc).toMatch(/e\.key === "ArrowDown"/);
    expect(headerSrc).toMatch(/e\.key === "ArrowUp"/);
    expect(headerSrc).toMatch(/e\.key === "Home"/);
    expect(headerSrc).toMatch(/e\.key === "End"/);
    expect(headerSrc).toMatch(/e\.key === "Enter"/);
    expect(headerSrc).toMatch(/e\.key === "Escape"/);
  });

  it('registers a global "/" shortcut that skips other inputs', () => {
    expect(headerSrc).toMatch(/e\.key !== "\/"/);
    expect(headerSrc).toMatch(/tag === "INPUT"/);
    expect(headerSrc).toMatch(/inputRef\.current\?\.focus\(\)/);
  });

  it("Escape blurs the input when the query is empty, clears otherwise", () => {
    expect(headerSrc).toMatch(/if \(q\) \{ setQ\(""\); setActive\(-1\); \}/);
    expect(headerSrc).toMatch(/inputRef\.current\?\.blur\(\)/);
  });
});

describe("Header search: reduced-motion gating", () => {
  it("uses the shared usePrefersReducedMotion hook and gates animation classes", () => {
    expect(headerSrc).toMatch(/usePrefersReducedMotion\(\)/);
    // anim() helper strips animate/transition classes when reduced motion is on.
    expect(headerSrc).toMatch(/const anim = \(cls: string\) => \(reducedMotion \? "" : cls\)/);
    // Applied to at least the suggestions panel and the loading spinner.
    expect(headerSrc).toMatch(/\$\{anim\("animate-in fade-in slide-in-from-top-2 duration-200"\)\}/);
    expect(headerSrc).toMatch(/\$\{anim\("animate-spin"\)\}/);
  });
});

describe("Header search: analytics events", () => {
  it("fires search_input, search_suggestion_select, and search_submit", () => {
    expect(headerSrc).toMatch(/track\("search_input"/);
    expect(headerSrc).toMatch(/track\("search_suggestion_select"/);
    expect(headerSrc).toMatch(/track\("search_submit"/);
    expect(headerSrc).toMatch(/track\("search_shortcut_focus"/);
  });
});

describe("Live search suggestion cache", () => {
  beforeEach(() => _clearSearchCache());

  it("returns identical results for repeated queries (served from cache)", () => {
    const a = getSuggestions("chair");
    const b = getSuggestions("chair");
    expect(b).toStrictEqual(a);
    // Case-insensitive keys collapse to the same cache entry.
    expect(getSuggestions("CHAIR")).toStrictEqual(a);
  });

  it("respects the limit argument", () => {
    const two = getSuggestions("a", 2);
    expect(two.length).toBeLessThanOrEqual(2);
  });

  it("empty query yields no suggestions", () => {
    expect(getSuggestions("")).toEqual([]);
    expect(getSuggestions("   ")).toEqual([]);
  });
});
