<script>
    import "./app.css";
    import GrammarPanel from "./lib/GrammarPanel.svelte";
    import ParsingTable from "./lib/ParsingTable.svelte";
    import StackVisualizer from "./lib/StackVisualizer.svelte";

    import {
        initParser,
        parseStep,
        parseAll,
        generateRandomSentence,
    } from "./lib/parser.js";
    import { parseGrammar } from "./lib/grammar.js";
    import {
        computeFirst,
        computeFollow,
        buildParsingTable,
        detectLeftRecursion,
    } from "./lib/sets.js";

    const DEFAULT_GRAMMAR_TEXT = `S -> a A | b B
A -> c A | d
B -> e C | ε
C -> f | g`;

    let grammarText = DEFAULT_GRAMMAR_TEXT;

    // Computed grammar state.
    let grammar = null;
    let first = null;
    let follow = null;
    let table = null;
    let conflicts = [];
    let grammarError = "";

    let sentence = "";
    let sentenceError = "";
    let parserState = null;

    function handleCompute() {
        // Recomputing invalidates any in-flight parse.
        parserState = null;
        sentenceError = "";
        grammarError = "";
        try {
            const g = parseGrammar(grammarText);

            const leftRecursive = detectLeftRecursion(g);
            if (leftRecursive.length > 0) {
                grammar = null;
                first = null;
                follow = null;
                table = null;
                conflicts = [];
                grammarError = `Gramática com recursão à esquerda não é LL(1): ${leftRecursive.join(", ")}`;
                return;
            }

            const f = computeFirst(g);
            const fo = computeFollow(g, f);
            const { table: t, conflicts: c } = buildParsingTable(g, f, fo);

            grammar = g;
            first = f;
            follow = fo;
            table = t;
            conflicts = c;
        } catch (err) {
            grammar = null;
            first = null;
            follow = null;
            table = null;
            conflicts = [];
            grammarError =
                err instanceof Error ? err.message : String(err);
        }
    }

    // Terminals for the parser/table: the grammar's terminals plus the end marker.
    $: terminals = grammar ? [...grammar.terminals, "$"] : [];

    function handleGenerate() {
        if (!grammar) {
            sentenceError = "Compute uma gramática primeiro.";
            return;
        }
        sentence = generateRandomSentence(grammar);
        sentenceError = "";
        parserState = null;
    }

    function handleStart() {
        if (!grammar || !table) {
            sentenceError = "Compute uma gramática primeiro.";
            return;
        }
        if (!sentence.trim()) {
            sentenceError = "Por favor, insira uma sentença primeiro.";
            return;
        }
        sentenceError = "";
        parserState = initParser(sentence, {
            table,
            terminals,
            start: grammar.start,
        });
        parserState = parseStep(parserState);
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
        sentenceError = "";
        parserState = null;
    }

    // Compute the default grammar on first load.
    handleCompute();
</script>

<main>
    <h1>Analisador Sintático LL(1)</h1>

    <div class="card">
        <label
            for="grammarInput"
            style="display: block; margin-bottom: 0.5rem; font-weight: bold;"
            >Gramática:</label
        >
        <textarea
            id="grammarInput"
            bind:value={grammarText}
            rows="6"
            style="width: 100%; font-family: monospace;"
            placeholder={"S -> a A | b B\nA -> c A | d"}
        ></textarea>
        <div style="margin-top: 0.5rem;">
            <button on:click={handleCompute}>Computar</button>
        </div>

        {#if grammarError}
            <div
                style="margin-top: 1rem; padding: 0.75rem; border-radius: 4px; background-color: var(--error); color: white;"
            >
                {grammarError}
            </div>
        {/if}

        {#if conflicts.length > 0}
            <div
                style="margin-top: 1rem; padding: 0.75rem; border-radius: 4px; background-color: var(--error); color: white;"
            >
                <strong>Gramática não é LL(1):</strong>
                <ul style="margin: 0.5rem 0 0; padding-left: 1.25rem;">
                    {#each conflicts as c}
                        <li>
                            conflito em M[{c.nonTerminal}, {c.terminal}] —
                            {c.productions
                                .map((p) =>
                                    p.length === 0 ? "ε" : p.join(" "),
                                )
                                .join(" / ")}
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
    </div>

    <div class="card">
        <div style="margin-bottom: 1rem;">
            <label
                for="sentenceInput"
                style="display: block; margin-bottom: 0.5rem; font-weight: bold;"
                >Sentença:</label
            >
            <input
                id="sentenceInput"
                type="text"
                bind:value={sentence}
                placeholder="Ex: a c c d"
                style="width: 100%; max-width: 400px; margin-right: 1rem;"
                disabled={parserState !== null}
            />
            <button
                on:click={handleGenerate}
                disabled={parserState !== null || !grammar}
                >Gerar Aleatória</button
            >
        </div>

        {#if sentenceError}
            <div
                style="margin-bottom: 1rem; padding: 0.75rem; border-radius: 4px; background-color: var(--error); color: white;"
            >
                {sentenceError}
            </div>
        {/if}

        <div>
            {#if !parserState}
                <button on:click={handleStart} disabled={!grammar}
                    >Iniciar Análise</button
                >
            {:else}
                <button
                    on:click={handleStep}
                    disabled={parserState.status !== "running"}
                    >Próximo Passo</button
                >
                <button
                    on:click={handleRunAll}
                    disabled={parserState.status !== "running"}
                    >Analisar Tudo</button
                >
                <button
                    on:click={handleReset}
                    style="background-color: var(--error);">Reiniciar</button
                >
            {/if}
        </div>

        {#if parserState && parserState.status !== "running"}
            <div
                style="margin-top: 1rem; padding: 1rem; border-radius: 4px; background-color: {parserState.status ===
                'success'
                    ? 'var(--success)'
                    : 'var(--error)'}; color: white; font-weight: bold;"
            >
                {#if parserState.status === "success"}
                    Sentença reconhecida com sucesso!
                {:else}
                    {parserState.errorMsg}
                {/if}
            </div>
        {/if}
    </div>

    <GrammarPanel {grammar} {first} {follow} />
    <ParsingTable
        {table}
        {terminals}
        nonTerminals={grammar ? grammar.nonTerminals : []}
    />

    {#if parserState}
        <StackVisualizer steps={parserState.steps} />
    {/if}
</main>
