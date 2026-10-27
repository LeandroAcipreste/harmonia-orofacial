# Precificação, rentabilidade e a automação

Quanto custa de verdade cada procedimento, quanto ele deixa, e qual deles
merece o conteúdo que a automação vai produzir.

## A conta

```
custo da hora   = (custos fixos do mês + pró-labore) / horas clínicas
custo do proc.  = insumos da ficha técnica + custo da hora × duração
preço sugerido  = custo / (1 - margem - impostos - taxa de cartão)
```

A terceira linha **divide**, e não soma. Margem, imposto e taxa da
maquininha incidem sobre o preço, não sobre o custo. Um procedimento de
R$ 100 de custo com 29% retido não custa R$ 129: custa R$ 140,85, porque os
29% saem do preço final. Somar por cima é o erro silencioso que faz clínica
trabalhar de graça e não entender por quê.

Nada nessa conta é chutado pelo sistema. Pró-labore, margem e imposto
nascem zerados, e o preço sugerido começa igual ao custo até alguém dizer
quanto quer ganhar. A única exceção é a **taxa média de cartão**, que não é
opinião: sai dos recebimentos dos últimos 90 dias, ponderada pelo valor, e
já mistura pix sem taxa com crédito parcelado na proporção real da casa.

## De onde vem cada número

| número | origem |
|---|---|
| Custos fixos | `custos_fixos`, lançados na tela (aluguel, energia, salário, contador) |
| Pró-labore e horas | `parametros_de_preco`, linha nova a cada mudança |
| Custo do insumo | média ponderada das **entradas** de estoque que informaram `custoUnitario` |
| Consumo por procedimento | `procedimento_insumos`, a ficha técnica |
| Taxa de cartão | `pagamentos` dos últimos 90 dias |
| Receita realizada | `pagamentos` do período, rateados pelo orçamento |

O insumo sem nenhuma entrada com preço **não entra como zero**: ele sai
listado em `insumosSemPreco` no procedimento, para a tela poder dizer "este
custo está incompleto" em vez de mostrar um número bonito e errado.

## O catálogo, e por que ele existe

O orçamento sempre foi texto livre, e continua sendo. Mas "Clareamento",
"clareamento" e "Clareamento dental" são três linhas diferentes num
relatório, e o ranking vira ruído.

Então existe `procedimentos`, e ao salvar o parecer o servidor amarra cada
item ao catálogo **pelo nome**, ignorando caixa e acento. Quem escreve
livre continua escrevendo; só fica de fora do relatório. No painel, o campo
tem `list=` com o catálogo, e escolher da lista preenche o preço de tabela.

## Rotas

| rota | permissão |
|---|---|
| `GET /api/precificacao` | `financeiro.precificar` |
| `GET /api/precificacao/hora` | `financeiro.precificar` |
| `GET` `POST` `/api/precificacao/custos`, `DELETE /api/precificacao/custos/:id` | `financeiro.precificar` |
| `POST /api/precificacao/parametros` | `financeiro.precificar` |
| `POST /api/precificacao/procedimentos`, `PUT /api/precificacao/procedimentos/:id` | `financeiro.precificar` |
| `GET /api/precificacao/catalogo` | `parecer.editar` |
| `GET /api/relatorios/rentabilidade?de=&ate=` | `relatorio.rentabilidade` |
| `GET /api/relatorios/anuncios?de=&ate=` | `relatorio.rentabilidade` |

## A receita é rateada, e isso é uma escolha

Pagamento quita a conta do paciente, não um item do orçamento. Para saber
quanto cada procedimento rendeu, o recebido da avaliação entra em cada item
na proporção do valor dele no orçamento.

Num orçamento de R$ 4.400 com R$ 3.000 recebidos, um clareamento de R$ 1.200
recebe R$ 818. Quando o orçamento é de um procedimento só, rateio e valor
coincidem. É a leitura honesta possível: qualquer outra fingiria saber qual
item o dinheiro pagou primeiro.

## Os dois relatórios

- **`/api/relatorios/rentabilidade`** é o da aba Rentabilidade do
  Financeiro: o que cada procedimento de fato deixou no período, com a
  receita rateada como descrito acima.
- **`/api/relatorios/anuncios`** é o do n8n: qual procedimento patrocinar.

## O relatório para os anúncios (n8n)

A automação usa este relatório para decidir sobre qual procedimento fazer
publicação patrocinada. Ele responde duas perguntas juntas, dentro do
período pedido:

**Procura.** Quantas vezes o procedimento entrou no orçamento de uma
avaliação (é alguém que veio e precisa dele) e quantas dessas viraram
aceite. A data que conta é a da consulta: o horário marcado ou, quando não
houve horário, a chegada da ficha. Item de orçamento escrito fora do
catálogo não entra na conta.

**Custo-benefício.** Quanto sobra por hora de cadeira no preço de tabela,
depois de custo, imposto e taxa de cartão. Sai da precificação (a conta do
começo deste documento).

**Pontuação**, de 0 a 100, junta as duas:

```
(procura ÷ maior procura do período) × (margem por hora ÷ maior margem por hora do período) × 100
```

Multiplica, e não soma, de propósito: um procedimento muito procurado que
dá prejuízo, ou muito lucrativo que ninguém procura, fica perto de zero.
Para anúncio patrocinado só interessa o que tem as duas coisas. Margem
negativa conta como zero.

### A chamada

```
GET /api/relatorios/anuncios?de=2026-09-01&ate=2026-09-30
Authorization: Bearer <chave do agente>
```

Sem `de` e `ate`, o período é do dia 1º do mês corrente até hoje. Datas
em `AAAA-MM-DD`.

### A resposta

```json
{
  "periodo": { "de": "2026-09-01", "ate": "2026-09-30" },
  "criterio": "pontuação de 0 a 100: procura relativa × margem por hora relativa, no período",
  "paraPatrocinar": [
    {
      "procedimento": "Clareamento",
      "pontuacao": 100,
      "procura": { "orcado": 12, "aceito": 7, "taxaDeAceite": 58.3 },
      "custoBeneficio": {
        "precoDeTabela": 120000,
        "margemPercentual": 64.5,
        "margemPorHora": 77400,
        "duracaoMinutos": 60
      },
      "custoIncompleto": false
    }
  ],
  "procedimentos": [ "... todos os procedimentos ativos, no mesmo formato, do maior para o menor" ]
}
```

- **`paraPatrocinar`**: os até três com maior pontuação, só os que têm
  pontuação acima de zero. É o que o n8n usa para escolher a pauta.
- **`procedimentos`**: todos os ativos, ordenados pela pontuação, para
  quando o fluxo precisar de mais opções ou quiser evitar repetir o anúncio
  da semana anterior.
- **`custoIncompleto: true`**: algum insumo da ficha técnica não tem preço
  de compra, então a margem está otimista. O fluxo deve tratar como alerta
  para a doutora, e não como pauta.
- Valores em **centavos**, como em todo o sistema: `120000` é R$ 1.200,00.

### Ligando no n8n

1. **Credencial**: Header Auth no cofre do n8n, com
   `Authorization: Bearer <chave do agente>`. A chave é emitida na tela
   de Administração.
2. **Nó HTTP Request**: `GET {{API}}/api/relatorios/anuncios`, com `de` e
   `ate` do período que a campanha deve olhar (as últimas quatro semanas,
   por exemplo).
3. **O que mandar para o modelo**: `paraPatrocinar`. É o que basta para
   escolher o procedimento e o argumento do anúncio (procura alta, aceite
   alto).
4. **Cadência**: semanal. Procura e aceite mudam com as consultas, não de
   hora em hora.

### O que o relatório não carrega

Nenhum nome de paciente, CPF, telefone, ficha ou valor individual de
pagamento: tudo é somado por procedimento. A chave do agente abre o ERP
inteiro, mas este relatório é agregado por desenho, porque mandar dado de
paciente para um modelo de linguagem, sem necessidade, é risco de graça.
Há um teste de ponta a ponta que falha se um nome de paciente aparecer na
resposta.

## O que não está modelado

- **Prazo de repasse da maquininha.** O líquido é o da data da venda, não o
  do dia em que o dinheiro cai. Serve para saber quanto rendeu; não serve
  para conciliar extrato bancário.
- **Consumo real por procedimento.** O consumo é lançado por atendimento, e
  um atendimento pode ter três procedimentos. O custo do relatório é o
  **previsto** pela ficha técnica. Comparar previsto com real exigiria
  lançar insumo por item do orçamento, o que é mais trabalho na cadeira do
  que a clínica quer ter hoje.
- **Custo de laboratório protético.** Entra como insumo da ficha técnica se
  alguém cadastrar, mas não tem tratamento próprio.
