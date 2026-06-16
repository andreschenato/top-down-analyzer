import { describe, it, expect } from "vitest";
import { parseGrammar } from "./grammar.js";
import { computeFirst, computeFollow, buildParsingTable } from "./sets.js";
import { PARSING_TABLE } from "./parser.js";

const DEFAULT_GRAMMAR = `S -> a A | b B
A -> c A | d
B -> e C | ε
C -> f | g`;

function setMap(record) {
  const out = {};
  for (const k of Object.keys(record)) out[k] = new Set(record[k]);
  return out;
}

describe("computeFirst — default grammar", () => {
  const g = parseGrammar(DEFAULT_GRAMMAR);
  const first = computeFirst(g);

  it("matches the hardcoded FIRST sets", () => {
    expect(first.S).toEqual(new Set(["a", "b"]));
    expect(first.A).toEqual(new Set(["c", "d"]));
    expect(first.B).toEqual(new Set(["e", "ε"]));
    expect(first.C).toEqual(new Set(["f", "g"]));
  });
});

describe("computeFollow — default grammar", () => {
  const g = parseGrammar(DEFAULT_GRAMMAR);
  const follow = computeFollow(g, computeFirst(g));

  it("matches the hardcoded FOLLOW sets", () => {
    expect(follow.S).toEqual(new Set(["$"]));
    expect(follow.A).toEqual(new Set(["$"]));
    expect(follow.B).toEqual(new Set(["$"]));
    expect(follow.C).toEqual(new Set(["$"]));
  });
  it("never includes ε in FOLLOW", () => {
    for (const nt of g.nonTerminals) {
      expect(follow[nt].has("ε")).toBe(false);
    }
  });
});

describe("buildParsingTable — default grammar", () => {
  const g = parseGrammar(DEFAULT_GRAMMAR);
  const first = computeFirst(g);
  const follow = computeFollow(g, first);
  const { table, conflicts } = buildParsingTable(g, first, follow);

  it("deep-equals the hardcoded PARSING_TABLE", () => {
    expect(table).toEqual(PARSING_TABLE);
  });
  it("reports no conflicts for the LL(1) default grammar", () => {
    expect(conflicts).toEqual([]);
  });
});

describe("buildParsingTable — non-LL(1) grammar", () => {
  it("reports a conflict for S -> a | a b (FIRST/FIRST)", () => {
    const g = parseGrammar("S -> a | a b");
    const first = computeFirst(g);
    const follow = computeFollow(g, first);
    const { conflicts } = buildParsingTable(g, first, follow);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].nonTerminal).toBe("S");
    expect(conflicts[0].terminal).toBe("a");
    expect(conflicts[0].productions.length).toBeGreaterThanOrEqual(2);
  });
});
