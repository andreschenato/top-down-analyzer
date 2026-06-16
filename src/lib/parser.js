/** @typedef {import("./types.js").Grammar} Grammar */
/** @typedef {import("./types.js").ParsingTable} ParsingTable */
/** @typedef {import("./types.js").ParserState} ParserState */

export const GRAMMAR = {
  S: ["a A", "b B"],
  A: ["c A", "d"],
  B: ["e C", "ε"],
  C: ["f", "g"],
};

export const FIRST = {
  S: ["a", "b"],
  A: ["c", "d"],
  B: ["e", "ε"],
  C: ["f", "g"],
};

export const FOLLOW = {
  S: ["$"],
  A: ["$"],
  B: ["$"],
  C: ["$"],
};

export const PARSING_TABLE = {
  S: { a: ["a", "A"], b: ["b", "B"] },
  A: { c: ["c", "A"], d: ["d"] },
  B: { e: ["e", "C"], $: [] },
  C: { f: ["f"], g: ["g"] },
};

/**
 * @param {string} symbol
 * @param {string[]} [terminals]
 * @returns {boolean}
 */
export function isTerminal(
  symbol,
  terminals = ["a", "b", "c", "d", "e", "f", "g", "$"],
) {
  return terminals.includes(symbol);
}

const DEFAULT_GENERATION_GRAMMAR = {
  nonTerminals: ["S", "A", "B", "C"],
  start: "S",
  productions: {
    S: [
      ["a", "A"],
      ["b", "B"],
    ],
    A: [["c", "A"], ["d"]],
    B: [["e", "C"], []],
    C: [["f"], ["g"]],
  },
};

/**
 * Random leftmost derivation over a parsed grammar.
 * Guards against infinite/runaway recursion with an expansion cap; on cap it
 * restarts a bounded number of times, then bails to whatever terminals it has.
 *
 * @param {{ nonTerminals: string[], start: string, productions: Record<string, string[][]> }} [grammar]
 * @returns {string} whitespace-separated terminals
 */
export function generateRandomSentence(grammar = DEFAULT_GENERATION_GRAMMAR) {
  const ntSet = new Set(grammar.nonTerminals);
  const MAX_EXPANSIONS = 200;
  const MAX_RESTARTS = 20;

  for (let attempt = 0; attempt < MAX_RESTARTS; attempt++) {
    const sentential = [grammar.start];
    let expansions = 0;
    let capped = false;

    while (sentential.some((s) => ntSet.has(s))) {
      if (expansions++ > MAX_EXPANSIONS) {
        capped = true;
        break;
      }
      const idx = sentential.findIndex((s) => ntSet.has(s));
      const nt = sentential[idx];
      const alts = grammar.productions[nt] || [];
      if (alts.length === 0) {
        capped = true;
        break;
      }
      const alt = alts[Math.floor(Math.random() * alts.length)];
      sentential.splice(idx, 1, ...alt);
    }

    if (!capped) {
      return sentential.join(" ");
    }
  }

  // Bail after exhausting restarts: best-effort terminal-only derivation.
  const sentential = [grammar.start];
  let expansions = 0;
  while (sentential.some((s) => ntSet.has(s)) && expansions++ < MAX_EXPANSIONS) {
    const idx = sentential.findIndex((s) => ntSet.has(s));
    const nt = sentential[idx];
    const alts = grammar.productions[nt] || [];
    // prefer the shortest alternative to converge
    const alt = alts.length
      ? alts.reduce((a, b) => (b.length < a.length ? b : a))
      : [];
    sentential.splice(idx, 1, ...alt);
  }
  return sentential.filter((s) => !ntSet.has(s)).join(" ");
}

const DEFAULT_TERMINALS = ["a", "b", "c", "d", "e", "f", "g", "$"];

/**
 * @param {string} sentence
 * @param {{ table?: ParsingTable, terminals?: string[], start?: string }} [options]
 * @returns {ParserState}
 */
export function initParser(sentence, options = {}) {
  const {
    table = PARSING_TABLE,
    terminals = DEFAULT_TERMINALS,
    start = "S",
  } = options;

  const tokens = sentence.replace(/\s+/g, "").split("");
  tokens.push("$");

  return {
    tokens,
    tokenIndex: 0,
    stack: ["$", start],
    steps: [],
    status: "running",
    errorMsg: "",
    table,
    terminals,
  };
}

/**
 * @param {ParserState} state
 * @returns {ParserState}
 */
export function parseStep(state) {
  if (state.status !== "running") return state;

  const newState = {
    ...state,
    stack: [...state.stack],
    steps: [...state.steps],
  };

  if (newState.stack.length === 0) {
    if (newState.tokenIndex === newState.tokens.length) {
      newState.status = "success";
    } else {
      newState.status = "error";
      newState.errorMsg = "Pilha vazia mas ainda há tokens na entrada.";
    }
    return newState;
  }

  const table = newState.table || PARSING_TABLE;
  const terminals = newState.terminals || DEFAULT_TERMINALS;

  const currentToken = newState.tokens[newState.tokenIndex] || "$";

  const stackView = ["$", ...newState.stack.slice(1).reverse()].join(" ");
  // The empty-stack case returns above, so `pop()` is always defined here.
  const top = /** @type {string} */ (newState.stack.pop());
  const inputView = newState.tokens.slice(newState.tokenIndex).join(" ");

  if (isTerminal(top, terminals)) {
    if (top === currentToken) {
      if (top === "$") {
        newState.steps.push({
          stack: stackView,
          input: inputView,
          action: `Aceita em ${newState.steps.length + 1} passos`,
        });
      } else {
        newState.steps.push({
          stack: stackView,
          input: inputView,
          action: `Lê e remove '${top}'`,
        });
      }
      newState.tokenIndex++;

      if (
        newState.stack.length === 0 &&
        newState.tokenIndex === newState.tokens.length
      ) {
        newState.status = "success";
      }
    } else {
      newState.status = "error";
      newState.errorMsg = `Erro de sintaxe: Esperava '${top}', mas encontrou '${currentToken}'.`;
      newState.steps.push({
        stack: stackView,
        input: inputView,
        action: `Rejeita em ${newState.steps.length + 1} passos: Esperava '${top}', encontrou '${currentToken}'`,
      });
    }
  } else {
    const production = table[top] && table[top][currentToken];
    if (production) {
      for (let i = production.length - 1; i >= 0; i--) {
        newState.stack.push(production[i]);
      }

      const prodStr = production.length === 0 ? "ε" : production.join("");
      newState.steps.push({
        stack: stackView,
        input: inputView,
        action: `${top} -> ${prodStr}`,
      });
    } else {
      newState.status = "error";
      newState.errorMsg = `Erro de sintaxe: Não há regra na tabela para M[${top}, ${currentToken}]. Sentença rejeitada.`;
      newState.steps.push({
        stack: stackView,
        input: inputView,
        action: `Rejeita em ${newState.steps.length + 1} passos: Célula M[${top}, ${currentToken}] vazia`,
      });
    }
  }

  return newState;
}

/**
 * @param {ParserState} state
 * @returns {ParserState}
 */
export function parseAll(state) {
  let currentState = state;
  while (currentState.status === "running") {
    currentState = parseStep(currentState);
  }
  return currentState;
}
