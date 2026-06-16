import { EPSILON } from "./grammar.js";

/**
 * Detect (direct or indirect) left recursion. A grammar with left recursion is
 * not LL(1) and must NOT be auto-transformed — we only report it.
 *
 * @param {ReturnType<import("./grammar.js").parseGrammar>} grammar
 * @returns {string[]} the non-terminals involved in some left-recursive cycle
 */
export function detectLeftRecursion(grammar) {
  const { nonTerminals, productions } = grammar;
  const ntSet = new Set(nonTerminals);

  // Nullable non-terminals (so we can look past a nullable leading NT).
  const nullable = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const nt of nonTerminals) {
      if (nullable.has(nt)) continue;
      for (const alt of productions[nt]) {
        if (alt.every((s) => nullable.has(s))) {
          nullable.add(nt);
          changed = true;
          break;
        }
      }
    }
  }

  // Build "begins-with" edges: A -> ... where a leading NT (possibly after
  // nullable NTs) is B.
  const edges = {};
  for (const nt of nonTerminals) edges[nt] = new Set();
  for (const nt of nonTerminals) {
    for (const alt of productions[nt]) {
      for (const sym of alt) {
        if (ntSet.has(sym)) {
          edges[nt].add(sym);
          if (!nullable.has(sym)) break; // stop at first non-nullable symbol
        } else {
          break; // terminal blocks further left-derivation
        }
      }
    }
  }

  // Find non-terminals that can reach themselves through begins-with edges.
  const offending = new Set();
  for (const start of nonTerminals) {
    const seen = new Set();
    const stack = [...edges[start]];
    while (stack.length) {
      const cur = stack.pop();
      if (cur === start) {
        offending.add(start);
        break;
      }
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const next of edges[cur]) stack.push(next);
    }
  }

  return [...offending];
}

/**
 * Compute FIRST sets via fixed-point iteration.
 * ε is included in FIRST(X) when X can derive the empty string.
 *
 * @param {ReturnType<import("./grammar.js").parseGrammar>} grammar
 * @returns {Record<string, Set<string>>}
 */
export function computeFirst(grammar) {
  const { nonTerminals, productions } = grammar;
  const ntSet = new Set(nonTerminals);
  const first = {};
  for (const nt of nonTerminals) first[nt] = new Set();

  const firstOfSymbol = (sym) => {
    if (ntSet.has(sym)) return first[sym];
    return new Set([sym]); // terminal
  };

  let changed = true;
  while (changed) {
    changed = false;
    for (const nt of nonTerminals) {
      for (const alt of productions[nt]) {
        if (alt.length === 0) {
          // X -> ε
          if (!first[nt].has(EPSILON)) {
            first[nt].add(EPSILON);
            changed = true;
          }
          continue;
        }
        let nullablePrefix = true;
        for (const sym of alt) {
          const fs = firstOfSymbol(sym);
          for (const t of fs) {
            if (t === EPSILON) continue;
            if (!first[nt].has(t)) {
              first[nt].add(t);
              changed = true;
            }
          }
          if (!fs.has(EPSILON)) {
            nullablePrefix = false;
            break;
          }
        }
        if (nullablePrefix) {
          if (!first[nt].has(EPSILON)) {
            first[nt].add(EPSILON);
            changed = true;
          }
        }
      }
    }
  }

  return first;
}

/**
 * FIRST of a sequence of symbols (a production body).
 * @returns {Set<string>} includes ε if the whole sequence is nullable.
 */
function firstOfSequence(seq, first, ntSet) {
  const result = new Set();
  let nullable = true;
  for (const sym of seq) {
    const fs = ntSet.has(sym) ? first[sym] : new Set([sym]);
    for (const t of fs) {
      if (t !== EPSILON) result.add(t);
    }
    if (!fs.has(EPSILON)) {
      nullable = false;
      break;
    }
  }
  if (nullable) result.add(EPSILON);
  return result;
}

/**
 * Compute FOLLOW sets via fixed-point iteration.
 * The start symbol gets `$`. ε is never a member of FOLLOW.
 *
 * @param {ReturnType<import("./grammar.js").parseGrammar>} grammar
 * @param {Record<string, Set<string>>} first
 * @returns {Record<string, Set<string>>}
 */
export function computeFollow(grammar, first) {
  const { nonTerminals, productions, start } = grammar;
  const ntSet = new Set(nonTerminals);
  const follow = {};
  for (const nt of nonTerminals) follow[nt] = new Set();
  follow[start].add("$");

  let changed = true;
  while (changed) {
    changed = false;
    for (const nt of nonTerminals) {
      for (const alt of productions[nt]) {
        for (let i = 0; i < alt.length; i++) {
          const sym = alt[i];
          if (!ntSet.has(sym)) continue; // only non-terminals have FOLLOW

          const beta = alt.slice(i + 1);
          const firstBeta = firstOfSequence(beta, first, ntSet);

          for (const t of firstBeta) {
            if (t === EPSILON) continue;
            if (!follow[sym].has(t)) {
              follow[sym].add(t);
              changed = true;
            }
          }

          // If β derives ε (or β is empty), FOLLOW(nt) ⊆ FOLLOW(sym)
          if (firstBeta.has(EPSILON)) {
            for (const t of follow[nt]) {
              if (!follow[sym].has(t)) {
                follow[sym].add(t);
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  return follow;
}

/**
 * Build the LL(1) parsing table M.
 * Records a conflict whenever two productions map to the same cell.
 *
 * @param {ReturnType<import("./grammar.js").parseGrammar>} grammar
 * @param {Record<string, Set<string>>} first
 * @param {Record<string, Set<string>>} follow
 * @returns {{
 *   table: Record<string, Record<string, string[]>>,
 *   conflicts: Array<{ nonTerminal: string, terminal: string, productions: string[][] }>
 * }}
 */
export function buildParsingTable(grammar, first, follow) {
  const { nonTerminals, productions } = grammar;
  const ntSet = new Set(nonTerminals);
  const table = {};
  const conflicts = [];
  // track which production filled each cell, to detect collisions
  const cellProductions = {};

  for (const nt of nonTerminals) {
    table[nt] = {};
    cellProductions[nt] = {};
  }

  const place = (nt, terminal, alt) => {
    if (Object.prototype.hasOwnProperty.call(table[nt], terminal)) {
      // conflict: cell already occupied
      let conflict = conflicts.find(
        (c) => c.nonTerminal === nt && c.terminal === terminal,
      );
      if (!conflict) {
        conflict = {
          nonTerminal: nt,
          terminal,
          productions: [cellProductions[nt][terminal]],
        };
        conflicts.push(conflict);
      }
      conflict.productions.push(alt);
      return; // do NOT overwrite the existing cell
    }
    table[nt][terminal] = alt;
    cellProductions[nt][terminal] = alt;
  };

  for (const nt of nonTerminals) {
    for (const alt of productions[nt]) {
      const firstAlt = firstOfSequence(alt, first, ntSet);

      for (const t of firstAlt) {
        if (t === EPSILON) continue;
        place(nt, t, alt);
      }

      // If α derives ε, add to every terminal in FOLLOW(nt)
      if (firstAlt.has(EPSILON)) {
        for (const t of follow[nt]) {
          place(nt, t, alt);
        }
      }
    }
  }

  return { table, conflicts };
}
