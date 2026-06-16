<script>
    /** @type {import("./types.js").Step[]} */
    export let steps = [];
</script>

<div
    class="card"
    style="overflow-x: auto; max-height: 400px; overflow-y: auto;"
>
    <h2>Visualizador de Pilha e Fita de Entrada</h2>
    {#if steps.length === 0}
        <p style="color: gray; font-style: italic;">
            A análise ainda não começou.
        </p>
    {:else}
        <table>
            <thead>
                <tr>
                    <th>Passo</th>
                    <th>Pilha</th>
                    <th>Entrada</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>
                {#each steps as step, i}
                    <tr>
                        <td>{i + 1}</td>
                        <td style="font-family: monospace;">{step.stack}</td>
                        <td style="font-family: monospace;">{step.input}</td>
                        <td>{step.action}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
