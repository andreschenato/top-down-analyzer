<script>
  import { GRAMMAR, FIRST, FOLLOW } from './parser.js';
  const nonTerminals = Object.keys(GRAMMAR);
</script>

<div class="card">
  <h2>Gramática, First e Follow</h2>
  <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
    <div>
      <h3>Gramática</h3>
      <ul style="list-style-type: none; padding: 0;">
        {#each nonTerminals as nt}
          <li><strong>{nt}</strong> → {GRAMMAR[nt].join(' | ')}</li>
        {/each}
      </ul>
    </div>
    
    <div>
      <h3>FIRST</h3>
      <ul style="list-style-type: none; padding: 0;">
        {#each nonTerminals as nt}
          <li><strong>FIRST({nt})</strong> = {'{'} {FIRST[nt].join(', ')} {'}'}</li>
        {/each}
      </ul>
    </div>

    <div>
      <h3>FOLLOW</h3>
      <ul style="list-style-type: none; padding: 0;">
        {#each nonTerminals as nt}
          <li><strong>FOLLOW({nt})</strong> = {'{'} {FOLLOW[nt].join(', ')} {'}'}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>
