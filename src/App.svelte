<script>
  import "./app.css";
  import GrammarPanel from "./lib/GrammarPanel.svelte";
  import ParsingTable from "./lib/ParsingTable.svelte";
  import StackVisualizer from "./lib/StackVisualizer.svelte";
  
  import { initParser, parseStep, parseAll, generateRandomSentence } from "./lib/parser.js";

  let sentence = "";
  let parserState = null;

  function handleGenerate() {
    sentence = generateRandomSentence();
    parserState = null;
  }

  function handleStart() {
    if (!sentence.trim()) {
      alert("Por favor, insira uma sentença primeiro.");
      return;
    }
    parserState = initParser(sentence);
  }

  function handleStep() {
    if (parserState && parserState.status === "running") {
      parserState = parseStep(parserState);
    }
  }

  function handleRunAll() {
    if (parserState && parserState.status === "running") {
      parserState = parseAll(parserState);
    }
  }

  function handleReset() {
    sentence = "";
    parserState = null;
  }
</script>

<main>
  <h1>Analisador Sintático LL(1)</h1>
  
  <div class="card">
    <div style="margin-bottom: 1rem;">
      <label for="sentenceInput" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Sentença:</label>
      <input 
        id="sentenceInput"
        type="text" 
        bind:value={sentence} 
        placeholder="Ex: a c c d" 
        style="width: 100%; max-width: 400px; margin-right: 1rem;"
        disabled={parserState !== null}
      />
      <button on:click={handleGenerate} disabled={parserState !== null}>Gerar Aleatória</button>
    </div>
    
    <div>
      {#if !parserState}
        <button on:click={handleStart}>Iniciar Análise</button>
      {:else}
        <button on:click={handleStep} disabled={parserState.status !== "running"}>Próximo Passo</button>
        <button on:click={handleRunAll} disabled={parserState.status !== "running"}>Analisar Tudo</button>
        <button on:click={handleReset} style="background-color: var(--error);">Reiniciar</button>
      {/if}
    </div>

    {#if parserState && parserState.status !== "running"}
      <div style="margin-top: 1rem; padding: 1rem; border-radius: 4px; background-color: {parserState.status === 'success' ? 'var(--success)' : 'var(--error)'}; color: white; font-weight: bold;">
        {#if parserState.status === "success"}
          Sentença reconhecida com sucesso!
        {:else}
          {parserState.errorMsg}
        {/if}
      </div>
    {/if}
  </div>

  <GrammarPanel />
  <ParsingTable />
  
  {#if parserState}
    <StackVisualizer steps={parserState.steps} />
  {/if}

</main>
