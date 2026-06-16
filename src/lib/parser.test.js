import { describe, it, expect } from "vitest";
import {
  isTerminal,
  generateRandomSentence,
  initParser,
  parseStep,
  parseAll,
} from "./parser.js";

describe("isTerminal", () => {
  it("recognizes terminals including $", () => {
    for (const t of ["a", "b", "c", "d", "e", "f", "g", "$"]) {
      expect(isTerminal(t)).toBe(true);
    }
  });
  it("rejects non-terminals", () => {
    for (const nt of ["S", "A", "B", "C"]) {
      expect(isTerminal(nt)).toBe(false);
    }
  });
});

describe("initParser", () => {
  it("tokenizes, appends $, and seeds the stack", () => {
    const state = initParser("a c d");
    expect(state.tokens).toEqual(["a", "c", "d", "$"]);
    expect(state.stack).toEqual(["$", "S"]);
    expect(state.status).toBe("running");
    expect(state.steps).toEqual([]);
  });
  it("strips arbitrary whitespace", () => {
    expect(initParser("  a   d ").tokens).toEqual(["a", "d", "$"]);
  });
});

describe("parseAll — accepted sentences", () => {
  for (const s of ["a d", "a c d", "a c c d", "b", "b e f", "b e g"]) {
    it(`accepts "${s}"`, () => {
      const result = parseAll(initParser(s));
      expect(result.status).toBe("success");
    });
  }
});

describe("parseAll — rejected sentences", () => {
  it("rejects an unknown terminal", () => {
    const result = parseAll(initParser("x"));
    expect(result.status).toBe("error");
    expect(result.errorMsg).toMatch(/M\[S, x\]/);
  });
  it("rejects an incomplete sentence (a with no c/d)", () => {
    const result = parseAll(initParser("a"));
    expect(result.status).toBe("error");
  });
  it("rejects trailing tokens (a d d)", () => {
    const result = parseAll(initParser("a d d"));
    expect(result.status).toBe("error");
  });
});

describe("parseStep", () => {
  it("is a no-op once the parse has finished", () => {
    const done = parseAll(initParser("b"));
    expect(parseStep(done)).toBe(done);
  });
  it("does not mutate the input state (immutability)", () => {
    const state = initParser("a d");
    const before = JSON.stringify(state);
    parseStep(state);
    expect(JSON.stringify(state)).toBe(before);
  });
  it("records a step row per call", () => {
    const s1 = parseStep(initParser("a d"));
    expect(s1.steps.length).toBe(1);
  });
});

describe("generateRandomSentence", () => {
  it("only ever produces sentences the grammar accepts (200 samples)", () => {
    for (let i = 0; i < 200; i++) {
      const sentence = generateRandomSentence();
      const result = parseAll(initParser(sentence));
      expect(result.status, `generated "${sentence}" was rejected`).toBe(
        "success",
      );
    }
  });
});
