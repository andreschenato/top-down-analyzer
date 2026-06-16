/** @typedef {import("./types.js").Grammar} Grammar */

const EPSILON = "ε";

/**
 * @param {string} tok
 * @returns {boolean}
 */
function isEpsilonToken(tok) {
  return tok === EPSILON || tok === "epsilon";
}

/**
 * Parse a grammar from text into a structured representation.
 *
 * Input format — one non-terminal per line, alternatives separated by `|`,
 * `ε` or `epsilon` for the empty production, whitespace-separated single
 * symbols:
 *
 *   S -> a A | b B
 *   A -> c A | d
 *   B -> e C | ε
 *   C -> f | g
 *
 * The first LHS is the start symbol. Any symbol appearing as a LHS is a
 * non-terminal; everything else (except ε) is a terminal. `$` is reserved as
 * the end marker and may never appear as a grammar symbol.
 *
 * @param {string} text
 * @returns {Grammar}
 */
export function parseGrammar(text) {
  const lines = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("Gramática vazia: nenhuma produção encontrada.");
  }

  /** @type {Record<string, string[][]>} */
  const productions = {};
  /** @type {string[]} */
  const nonTerminalOrder = [];
  /** @type {string | null} */
  let start = null;

  for (const line of lines) {
    if (!line.includes("->")) {
      throw new Error(`Linha sem '->': "${line}"`);
    }

    const idx = line.indexOf("->");
    const lhs = line.slice(0, idx).trim();
    const rhs = line.slice(idx + 2).trim();

    if (lhs.length === 0) {
      throw new Error(`Lado esquerdo vazio na linha: "${line}"`);
    }
    if (lhs.split(/\s+/).length !== 1) {
      throw new Error(
        `Lado esquerdo deve ser um único não-terminal: "${line}"`,
      );
    }
    if (lhs === "$") {
      throw new Error("'$' é reservado como marcador de fim e não pode ser um símbolo da gramática.");
    }

    const alternatives = rhs.split("|");
    /** @type {string[][]} */
    const parsedAlts = [];

    for (const alt of alternatives) {
      const trimmed = alt.trim();
      if (trimmed.length === 0) {
        throw new Error(`Alternativa vazia na linha: "${line}"`);
      }
      const symbols = trimmed.split(/\s+/);
      if (symbols.length === 1 && isEpsilonToken(symbols[0])) {
        parsedAlts.push([]);
        continue;
      }
      for (const sym of symbols) {
        if (isEpsilonToken(sym)) {
          throw new Error(
            `ε só pode aparecer sozinho numa alternativa: "${line}"`,
          );
        }
        if (sym === "$") {
          throw new Error(
            "'$' é reservado como marcador de fim e não pode ser um símbolo da gramática.",
          );
        }
      }
      parsedAlts.push(symbols);
    }

    if (!productions[lhs]) {
      productions[lhs] = [];
      nonTerminalOrder.push(lhs);
    }
    for (const a of parsedAlts) {
      productions[lhs].push(a);
    }

    if (start === null) start = lhs;
  }

  const nonTerminals = nonTerminalOrder;
  const ntSet = new Set(nonTerminals);

  /** @type {Set<string>} */
  const terminalSet = new Set();
  for (const nt of nonTerminals) {
    for (const alt of productions[nt]) {
      for (const sym of alt) {
        if (!ntSet.has(sym)) terminalSet.add(sym);
      }
    }
  }

  return {
    nonTerminals,
    terminals: [...terminalSet],
    // `start` is set on the first iteration above; lines.length > 0 is enforced.
    start: /** @type {string} */ (start),
    productions,
  };
}

export { EPSILON };
