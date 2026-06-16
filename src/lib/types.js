// Shared JSDoc typedefs for the LL(1) parser visualizer.
// Runtime-empty module: it only hosts `@typedef`s imported via
// `import('./types.js')`.

/**
 * Parsed grammar structure (return of `parseGrammar`).
 * @typedef {Object} Grammar
 * @property {string[]} nonTerminals
 * @property {string[]} terminals
 * @property {string} start
 * @property {Record<string, string[][]>} productions
 */

/**
 * A single recorded step of the LL(1) parse.
 * @typedef {Object} Step
 * @property {string} stack
 * @property {string} input
 * @property {string} action
 */

/**
 * The LL(1) parsing table M: M[nonTerminal][terminal] = production body.
 * @typedef {Record<string, Record<string, string[]>>} ParsingTable
 */

/**
 * Parser state (return of `initParser`).
 * @typedef {Object} ParserState
 * @property {string[]} tokens
 * @property {number} tokenIndex
 * @property {string[]} stack
 * @property {Step[]} steps
 * @property {string} status
 * @property {string} errorMsg
 * @property {ParsingTable} table
 * @property {string[]} terminals
 */

/**
 * A parsing-table conflict (two productions in one cell).
 * @typedef {Object} Conflict
 * @property {string} nonTerminal
 * @property {string} terminal
 * @property {string[][]} productions
 */

/**
 * FIRST / FOLLOW maps: non-terminal -> set of terminals (ε allowed in FIRST).
 * @typedef {Record<string, Set<string>>} SymbolSets
 */

export {};
