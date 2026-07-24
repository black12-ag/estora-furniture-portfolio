import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Highlight } from "../src/lib/highlight";

const html = (jsx: React.ReactElement) => renderToStaticMarkup(jsx);

describe("Highlight component", () => {
  it("wraps every case-insensitive match in a <mark>", () => {
    const out = html(<Highlight text="Modern Modern Chair" match="modern" />);
    const count = (out.match(/<mark/g) ?? []).length;
    expect(count).toBe(2);
    expect(out).toContain(">Modern<");
  });

  it("returns the text untouched when match is empty", () => {
    const out = html(<Highlight text="Sofa" match="" />);
    expect(out).not.toContain("<mark");
    expect(out).toContain("Sofa");
  });

  it("returns the text untouched when match is not found", () => {
    const out = html(<Highlight text="Sofa" match="xyz" />);
    expect(out).not.toContain("<mark");
    expect(out).toContain("Sofa");
  });

  it("supports partial matches (substring within a word)", () => {
    const out = html(<Highlight text="Bookcase" match="book" />);
    expect(out).toMatch(/<mark[^>]*>Book<\/mark>case/);
  });
});
