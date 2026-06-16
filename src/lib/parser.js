export const GRAMMAR = {
  S: ["a A", "b B"],
  A: ["c A", "d"],
  B: ["e C", "ε"],
  C: ["f", "g"]
};

export const FIRST = {
  S: ["a", "b"],
  A: ["c", "d"],
  B: ["e", "ε"],
  C: ["f", "g"]
};

export const FOLLOW = {
  S: ["$"],
  A: ["$"],
  B: ["$"],
  C: ["$"]
};

export const PARSING_TABLE = {
  S: { a: ["a", "A"], b: ["b", "B"] },
  A: { c: ["c", "A"], d: ["d"] },
  B: { e: ["e", "C"], $: [] },
  C: { f: ["f"], g: ["g"] }
};

export function isTerminal(symbol) {
  return ["a", "b", "c", "d", "e", "f", "g", "$"].includes(symbol);
}

// Generate random valid sentence
export function generateRandomSentence() {
  let sentence = "";
  
  // S -> aA | bB
  if (Math.random() < 0.5) {
    sentence += "a";
    // A -> cA | d
    while (Math.random() < 0.6) {
      sentence += "c";
    }
    sentence += "d";
  } else {
    sentence += "b";
    // B -> eC | ε
    if (Math.random() < 0.5) {
      sentence += "e";
      // C -> f | g
      if (Math.random() < 0.5) {
        sentence += "f";
      } else {
        sentence += "g";
      }
    }
  }
  
  return sentence.split("").join(" "); // return space separated tokens
}

// Parser initialization
export function initParser(sentence) {
  // Normalize input: remove spaces, create token array
  const tokens = sentence.replace(/\s+/g, "").split("");
  tokens.push("$");
  
  return {
    tokens,
    tokenIndex: 0,
    stack: ["$", "S"],
    steps: [],
    status: "running", // 'running', 'success', 'error'
    errorMsg: ""
  };
}

// Step function for parser
export function parseStep(state) {
  if (state.status !== "running") return state;
  
  const newState = { ...state, stack: [...state.stack], steps: [...state.steps] };
  
  if (newState.stack.length === 0) {
    if (newState.tokenIndex === newState.tokens.length) {
      newState.status = "success";
    } else {
      newState.status = "error";
      newState.errorMsg = "Pilha vazia mas ainda há tokens na entrada.";
    }
    return newState;
  }

  const top = newState.stack.pop();
  const currentToken = newState.tokens[newState.tokenIndex] || "$";
  
  const stackView = [...newState.stack].reverse().join(" ");
  const inputView = newState.tokens.slice(newState.tokenIndex).join(" ");

  if (isTerminal(top)) {
    if (top === currentToken) {
      newState.steps.push({
        stack: stackView,
        input: inputView,
        action: `Lê e remove '${top}'`
      });
      newState.tokenIndex++;
      
      if (newState.stack.length === 0 && newState.tokenIndex === newState.tokens.length) {
        newState.status = "success";
      }
    } else {
      newState.status = "error";
      newState.errorMsg = `Erro de sintaxe: Esperava '${top}', mas encontrou '${currentToken}'.`;
      newState.steps.push({
        stack: stackView,
        input: inputView,
        action: `ERRO: Esperava '${top}', encontrou '${currentToken}'`
      });
    }
  } else {
    // Non-terminal
    const production = PARSING_TABLE[top] && PARSING_TABLE[top][currentToken];
    if (production) {
      // push in reverse order
      for (let i = production.length - 1; i >= 0; i--) {
        newState.stack.push(production[i]);
      }
      
      const prodStr = production.length === 0 ? "ε" : production.join("");
      newState.steps.push({
        stack: stackView,
        input: inputView,
        action: `${top} -> ${prodStr}`
      });
    } else {
      newState.status = "error";
      newState.errorMsg = `Erro de sintaxe: Não há regra na tabela para M[${top}, ${currentToken}]. Sentença rejeitada.`;
      newState.steps.push({
        stack: stackView,
        input: inputView,
        action: `ERRO: Célula M[${top}, ${currentToken}] vazia`
      });
    }
  }
  
  return newState;
}

export function parseAll(state) {
  let currentState = state;
  while (currentState.status === "running") {
    currentState = parseStep(currentState);
  }
  return currentState;
}
