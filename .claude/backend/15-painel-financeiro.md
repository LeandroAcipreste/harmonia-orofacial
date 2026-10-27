# Painel do financeiro

A visão de cima da clínica, na aba **Painel** do Financeiro: quanto da
procura vira tratamento, o que é mais procurado, quanto cada procedimento
vende, quem mais retorna e se a clínica está crescendo.

É também o que o **agente financeiro** da automação lê para ajudar a
clínica a decidir: a tela e o agente consomem a mesma rota, então os dois
enxergam os mesmos números.

## Rota

| rota | permissão |
|---|---|
| `GET /api/financeiro/painel?de=AAAA-MM-DD&ate=AAAA-MM-DD` | `financeiro.ver` |

Quem tem `financeiro.ver`: a doutora, o perfil financeiro e o agente. A
secretária não vê o painel; ela continua com o caixa do dia.

Sem `de` e `ate`, o período vai do dia 1º do mês corrente até hoje.

## O que cada número quer dizer

As definições estão escritas aqui porque o mesmo número lido de dois jeitos
leva a duas decisões diferentes.

**Conversão** (`conversao`). Das avaliações do período, quantas aconteceram
(a pessoa compareceu) e quantas dessas viraram tratamento (orçamento
aceito). A data que conta é a da consulta: o horário marcado ou, sem
horário, a chegada da ficha.

- `taxaDeComparecimento` = compareceram ÷ avaliações
- `taxaDeConversao` = viraram tratamento ÷ compareceram

A conversão é sobre quem compareceu, e não sobre todas as avaliações: falta
é um problema de agenda, conversão é um problema de orçamento, e misturar
os dois esconde qual dos dois está acontecendo.

**Mais procurados** (`maisProcurados`). Quantas vezes cada procedimento
entrou em orçamento no período, e quantos desses foram aceitos. Item
escrito fora do catálogo também conta, agrupado ignorando maiúscula e
acento, para o painel não ficar vazio enquanto o catálogo não é usado.

**Valor bruto por procedimento** (`valorBrutoPorProcedimento`). A soma dos
itens de orçamento **aceitos** no período, por procedimento. Bruto: antes
de taxa de cartão e imposto. É o quanto cada procedimento vendeu, não o
quanto já entrou no caixa.

**Pacientes com maior retorno** (`pacientesComMaiorRetorno`). Quem mais
pagou no período, somando os recebimentos não estornados, e em quantos
pagamentos.

**Crescimento** (`crescimento`). A semana até hoje contra a semana
anterior até o mesmo dia da semana, e o mês até hoje contra o mês anterior
até o mesmo dia do mês. Para receita (recebido bruto) e para avaliações
(fichas que chegaram).

Comparar o mês passado inteiro com o mês atual pela metade mostraria queda
todo dia 15. Por isso o crescimento **não segue** o período escolhido: é
sempre medido até hoje.

`taxa` vem `null` quando o período anterior é zero: não existe
crescimento percentual sobre nada.

## A resposta

```json
{
  "periodo": { "de": "2026-09-01", "ate": "2026-09-22" },
  "conversao": {
    "avaliacoes": 23,
    "compareceram": 18,
    "viraramTratamento": 11,
    "taxaDeComparecimento": 78.3,
    "taxaDeConversao": 61.1
  },
  "maisProcurados": [
    { "procedimento": "Clareamento", "orcado": 9, "aceito": 6, "valorBruto": 720000 }
  ],
  "valorBrutoPorProcedimento": [
    { "procedimento": "Clareamento", "orcado": 9, "aceito": 6, "valorBruto": 720000 }
  ],
  "pacientesComMaiorRetorno": [
    { "nome": "Nome do paciente", "recebido": 340000, "pagamentos": 2 }
  ],
  "crescimento": {
    "semanal": {
      "receita": { "atual": 315000, "anterior": 258300, "taxa": 22 },
      "avaliacoes": { "atual": 6, "anterior": 5, "taxa": 20 },
      "de": "2026-09-21", "anteriorDe": "2026-09-14", "anteriorAte": "2026-09-15"
    },
    "mensal": {
      "receita": { "atual": 745000, "anterior": 797150, "taxa": -6.5 },
      "avaliacoes": { "atual": 19, "anterior": 17, "taxa": 11.8 },
      "de": "2026-09-01", "anteriorDe": "2026-08-01", "anteriorAte": "2026-08-22"
    },
    "ate": "2026-09-22"
  }
}
```

Valores em **centavos**, como em todo o sistema: `720000` é R$ 7.200,00.
Taxas em percentual, com uma casa decimal. As listas trazem até dez itens.

## O agente financeiro

O agente usa a chave emitida na tela de Administração, no cabeçalho
`Authorization: Bearer <chave>`, e lê esta rota como a tela lê.

Duas coisas para quem montar o fluxo no n8n:

- **Esta resposta tem nome de paciente**, em `pacientesComMaiorRetorno`. As
  outras partes são agregadas. Se a decisão pedida ao modelo não precisa
  saber quem é o paciente (e para a maioria das perguntas de gestão não
  precisa), o fluxo deve mandar ao modelo só `conversao`,
  `maisProcurados`, `valorBrutoPorProcedimento` e `crescimento`. Nome de
  paciente é dado pessoal, e o que não vai para o modelo não vaza por ele.
- **Para escolher anúncio patrocinado**, a rota certa é
  `/api/relatorios/anuncios`, descrita em `14-precificacao.md`. Ela já
  cruza procura com custo-benefício; este painel mostra a procura, mas não
  a margem.

## Na tela

A aba Painel é a primeira do Financeiro e abre direto para quem tem
`financeiro.ver`. As cores das barras e das setas foram conferidas com o
validador de paleta contra o azul dos cards (os valores e o porquê estão no
comentário do bloco do painel em `pages/financeiro/financeiro.css`). A seta
de crescimento vem sempre com sinal e palavra ("alta", "queda"), porque
verde e vermelho se confundem para quem tem daltonismo.
