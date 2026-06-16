<script>
    import { PARSING_TABLE } from "./parser.js";
    const nonTerminals = Object.keys(PARSING_TABLE);
    const terminals = ["a", "b", "c", "d", "e", "f", "g", "$"];
</script>

<div class="card" style="overflow-x: auto;">
    <h2>Tabela de Parsing</h2>
    <table>
        <thead>
            <tr>
                <th></th>
                {#each terminals as t}
                    <th>{t}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each nonTerminals as nt}
                <tr>
                    <td><strong>{nt}</strong></td>
                    {#each terminals as t}
                        <td>
                            {#if PARSING_TABLE[nt][t]}
                                {nt} → {PARSING_TABLE[nt][t].length === 0
                                    ? "ε"
                                    : PARSING_TABLE[nt][t].join("")}
                            {/if}
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>
