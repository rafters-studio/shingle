import { describe, it, expect } from "vitest";

import {
  parseMdxClassDirectives,
  applyListClassDirectives,
} from "../../../src/lib/mdx-class-parser";

describe("parseMdxClassDirectives", () => {
  it("wraps unordered list with div containing class", () => {
    const input = `Some text

- Item 1
- Item 2
[:class="flow"]

More text`;

    const result = parseMdxClassDirectives(input);

    expect(result).toContain('<div className="flow">');
    expect(result).toContain("- Item 1");
    expect(result).toContain("- Item 2");
    expect(result).toContain("</div>");
    expect(result).not.toContain('[:class="flow"]');
  });

  it("wraps ordered list with div containing class", () => {
    const input = `Some text

1. First
2. Second
[:class="steps"]`;

    const result = parseMdxClassDirectives(input);

    expect(result).toContain('<div className="steps">');
    expect(result).not.toContain('[:class="steps"]');
  });

  it("returns content unchanged when no directives present", () => {
    const input = `Just some text

- Item 1
- Item 2`;

    expect(parseMdxClassDirectives(input)).toBe(input);
  });

  it("handles multiple class names", () => {
    const input = `- Item
[:class="flow gap-4 mt-8"]`;

    const result = parseMdxClassDirectives(input);

    expect(result).toContain('<div className="flow gap-4 mt-8">');
  });
});

describe("applyListClassDirectives", () => {
  it("converts unordered list to HTML ul with class", () => {
    const input = `- Item 1
- Item 2
- Item 3
[:class="custom-list"]`;

    const result = applyListClassDirectives(input);

    expect(result).toContain('<ul className="custom-list">');
    expect(result).toContain("<li>Item 1</li>");
    expect(result).toContain("<li>Item 2</li>");
    expect(result).toContain("<li>Item 3</li>");
    expect(result).toContain("</ul>");
  });

  it("converts ordered list to HTML ol with class", () => {
    const input = `1. First
2. Second
[:class="numbered"]`;

    const result = applyListClassDirectives(input);

    expect(result).toContain('<ol className="numbered">');
    expect(result).toContain("<li>First</li>");
    expect(result).toContain("<li>Second</li>");
    expect(result).toContain("</ol>");
  });

  it("returns content unchanged when no directives", () => {
    const input = `- Item 1
- Item 2`;

    expect(applyListClassDirectives(input)).toBe(input);
  });

  it("strips leading whitespace from list items", () => {
    const input = `  - Indented item
  - Another indented
[:class="test"]`;

    const result = applyListClassDirectives(input);

    expect(result).toContain("<li>Indented item</li>");
  });
});
