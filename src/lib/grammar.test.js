import { describe, it, expect } from "vitest";
import { parseGrammar } from "./grammar.js";

const DEFAULT_GRAMMAR = `S -> a A | b B
A -> c A | d
B -> e C | ε
C -> f | g`;

describe("parseGrammar — default grammar", () => {
  const g = parseGrammar(DEFAULT_GRAMMAR);

  it("detects the non-terminals", () => {
    expect(new Set(g.nonTerminals)).toEqual(new Set(["S", "A", "B", "C"]));
  });
  it("detects the terminals (order-insensitive)", () => {
    expect(new Set(g.terminals)).toEqual(
      new Set(["a", "b", "c", "d", "e", "f", "g"]),
    );
  });
  it("uses the first LHS as the start symbol", () => {
    expect(g.start).toBe("S");
  });
  it("splits alternatives into symbol arrays", () => {
    expect(g.productions.S).toEqual([
      ["a", "A"],
      ["b", "B"],
    ]);
    expect(g.productions.A).toEqual([["c", "A"], ["d"]]);
    expect(g.productions.C).toEqual([["f"], ["g"]]);
  });
  it("represents ε as the empty production []", () => {
    expect(g.productions.B).toEqual([["e", "C"], []]);
  });
});

describe("parseGrammar — epsilon spelling", () => {
  it("treats 'epsilon' the same as 'ε'", () => {
    const g = parseGrammar("B -> e | epsilon");
    expect(g.productions.B).toEqual([["e"], []]);
  });
});

describe("parseGrammar — error handling", () => {
  it("throws on a line with no '->'", () => {
    expect(() => parseGrammar("S a A")).toThrow();
  });
  it("throws on an empty alternative", () => {
    expect(() => parseGrammar("S -> a A | | b")).toThrow();
  });
  it("throws on empty input", () => {
    expect(() => parseGrammar("   ")).toThrow();
  });
});
