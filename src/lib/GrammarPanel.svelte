<script>
    // Props-driven (Step 4). `grammar` is the parsed structure; `first`/`follow`
    // are Record<NT, Set<string>>.
    /** @type {import("./types.js").Grammar | null} */
    export let grammar = null;
    /** @type {import("./types.js").SymbolSets | null} */
    export let first = null;
    /** @type {import("./types.js").SymbolSets | null} */
    export let follow = null;

    /** @param {string[]} alt */
    function fmtAlt(alt) {
        return alt.length === 0 ? "ε" : alt.join(" ");
    }
    /** @param {Set<string> | undefined} set */
    function fmtSet(set) {
        return set ? [...set].join(", ") : "";
    }
</script>

<div class="card">
    <h2>Gramática, First e Follow</h2>
    {#if !grammar}
        <p>Compute uma gramática para ver FIRST, FOLLOW e a tabela.</p>
    {:else}
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <div>
                <h3>Gramática</h3>
                <ul style="list-style-type: none; padding: 0;">
                    {#each grammar.nonTerminals as nt}
                        <li>
                            <strong>{nt}</strong> → {grammar.productions[nt]
                                .map(fmtAlt)
                                .join(" | ")}
                        </li>
                    {/each}
                </ul>
            </div>

            <div>
                <h3>FIRST</h3>
                <ul style="list-style-type: none; padding: 0;">
                    {#each grammar.nonTerminals as nt}
                        <li>
                            <strong>FIRST({nt})</strong> = {"{"}
                            {fmtSet(first?.[nt])}
                            {"}"}
                        </li>
                    {/each}
                </ul>
            </div>

            <div>
                <h3>FOLLOW</h3>
                <ul style="list-style-type: none; padding: 0;">
                    {#each grammar.nonTerminals as nt}
                        <li>
                            <strong>FOLLOW({nt})</strong> = {"{"}
                            {fmtSet(follow?.[nt])}
                            {"}"}
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    {/if}
</div>
