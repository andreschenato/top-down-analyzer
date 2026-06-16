<script>
    // Props-driven (Step 4).
    /** @type {import("./types.js").ParsingTable | null} */
    export let table = null;
    /** @type {string[]} */
    export let terminals = [];
    /** @type {string[]} */
    export let nonTerminals = [];

    // show all terminals except the reserved end-marker isn't a grammar symbol;
    // we still render `$` as a column because table cells may key on it.
    $: columns = terminals;
</script>

<div class="card" style="overflow-x: auto;">
    <h2>Tabela de Parsing</h2>
    {#if !table}
        <p>Compute uma gramática para ver a tabela M.</p>
    {:else}
        <table>
            <thead>
                <tr>
                    <th></th>
                    {#each columns as t}
                        <th>{t}</th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each nonTerminals as nt}
                    <tr>
                        <td><strong>{nt}</strong></td>
                        {#each columns as t}
                            <td>
                                {#if table[nt] && table[nt][t]}
                                    {nt} → {table[nt][t].length === 0
                                        ? "ε"
                                        : table[nt][t].join("")}
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
