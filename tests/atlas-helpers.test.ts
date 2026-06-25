// Unit tests for the pure presentation helpers in src/atlas.ts.
// These cross no DOM/network boundary, so they run in vitest's node env in ms.
// Layer: UNIT (per docs/testing-standards.md) — pure logic, formatting, parsing.
import { describe, expect, it } from "vitest";
import { esc, md, mdRich, t } from "../src/atlas";

describe("esc — HTML escaping (XSS-safety on every interpolated string)", () => {
  it("escapes the three structural HTML metacharacters", () => {
    expect(esc("<script>")).toBe("&lt;script&gt;");
    expect(esc("a & b")).toBe("a &amp; b");
    expect(esc("x > y < z")).toBe("x &gt; y &lt; z");
  });

  it("escapes & before < and > so entities are never double-broken", () => {
    // "&lt;" must come out as "&amp;lt;", not "&lt;" — order matters.
    expect(esc("&lt;")).toBe("&amp;lt;");
  });

  it("neutralizes a script-injection payload end to end", () => {
    expect(esc('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror="alert(1)"&gt;');
  });

  it("coerces null and undefined to an empty string (never 'null'/'undefined')", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
  });

  it("coerces non-string values via String()", () => {
    expect(esc(42)).toBe("42");
    expect(esc(0)).toBe("0");
    expect(esc(false)).toBe("false");
  });

  it("leaves a clean string untouched", () => {
    expect(esc("plain text 中文 123")).toBe("plain text 中文 123");
  });
});

describe("md — inline `code` spans over escaped text", () => {
  it("wraps a single backtick span in <code>", () => {
    expect(md("run `npm test` now")).toBe("run <code>npm test</code> now");
  });

  it("renders multiple independent code spans", () => {
    expect(md("`a` and `b`")).toBe("<code>a</code> and <code>b</code>");
  });

  it("escapes HTML BEFORE turning backticks into code (no tag injection via code)", () => {
    // The <b> inside the span must be escaped, not rendered as a real tag.
    expect(md("`<b>`")).toBe("<code>&lt;b&gt;</code>");
  });

  it("escapes HTML outside code spans too", () => {
    expect(md("a < b `c`")).toBe("a &lt; b <code>c</code>");
  });

  it("leaves text with no backticks as plain escaped text", () => {
    expect(md("no code here")).toBe("no code here");
  });

  it("does not create a code span from a single unpaired backtick", () => {
    expect(md("one ` backtick")).toBe("one ` backtick");
  });
});

describe("mdRich — bullet-list renderer for keep/fix bodies", () => {
  it("renders a plain string (no bullets) exactly like md()", () => {
    expect(mdRich("just `code` inline")).toBe(md("just `code` inline"));
    expect(mdRich("just `code` inline")).toBe("just <code>code</code> inline");
  });

  it("turns '- ' lines into a <ul class='tag-list'> of <li>", () => {
    const out = mdRich("- first\n- second");
    expect(out).toBe('<ul class="tag-list"><li>first</li><li>second</li></ul>');
  });

  it("supports the unicode bullet '•' as a list marker", () => {
    const out = mdRich("• alpha\n• beta");
    expect(out).toBe('<ul class="tag-list"><li>alpha</li><li>beta</li></ul>');
  });

  it("hoists non-bullet lines into a leading .tag-lead span before the list", () => {
    const out = mdRich("Summary line\n- point one\n- point two");
    expect(out).toBe(
      '<span class="tag-lead">Summary line</span>' +
        '<ul class="tag-list"><li>point one</li><li>point two</li></ul>',
    );
  });

  it("escapes + code-renders inside each <li>", () => {
    const out = mdRich("- use `git` here\n- and `<b>` there");
    expect(out).toBe(
      '<ul class="tag-list">' +
        "<li>use <code>git</code> here</li>" +
        "<li>and <code>&lt;b&gt;</code> there</li>" +
        "</ul>",
    );
  });

  it("collapses multiple lead lines into one space-joined .tag-lead", () => {
    const out = mdRich("lead a\nlead b\n- item");
    expect(out).toBe(
      '<span class="tag-lead">lead a lead b</span>' + '<ul class="tag-list"><li>item</li></ul>',
    );
  });

  it("handles CRLF line endings", () => {
    const out = mdRich("- a\r\n- b");
    expect(out).toBe('<ul class="tag-list"><li>a</li><li>b</li></ul>');
  });

  it("coerces null/undefined input to empty output", () => {
    // @ts-expect-error — exercising the runtime null-guard
    expect(mdRich(null)).toBe("");
    // @ts-expect-error — exercising the runtime undefined-guard
    expect(mdRich(undefined)).toBe("");
  });
});

describe("t — bilingual string selector", () => {
  it("returns the requested language when present", () => {
    expect(t({ zh: "你好", en: "hello" }, "zh")).toBe("你好");
    expect(t({ zh: "你好", en: "hello" }, "en")).toBe("hello");
  });

  it("falls back to zh when the requested language is missing", () => {
    expect(t({ zh: "只有中文" } as Record<string, string>, "en")).toBe("只有中文");
  });

  it("returns '' for an undefined object", () => {
    expect(t(undefined, "zh")).toBe("");
  });

  it("returns an empty-string value verbatim rather than falling back", () => {
    // en is present and empty → honored, not replaced by zh.
    expect(t({ zh: "x", en: "" }, "en")).toBe("");
  });
});
