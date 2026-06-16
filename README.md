# Analisador Sintático Top-Down Preditivo Tabular
Este projeto implementa um simples analisador sintático tabular preditivo LL(1) usando o framework Svelte.
Você pode testar o projeto no seguinte link: https://top-down.andreschenato.dev.br

## Funcionalidades
- Geração automática de sentenças válidas.
- Entrada manual de sentenças.
- Reconhecimento token a token mostrando a pilha e a fita de entrada.
- Exibição estática da Gramática, dos conjuntos First, Follow e da Tabela de Parsing M.
- Verificação de aceitação ou rejeição com mensagens adequadas.

## Como Executar
1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O projeto estará rodando na porta `5173`, você pode acessar via `http://localhost:5173`
