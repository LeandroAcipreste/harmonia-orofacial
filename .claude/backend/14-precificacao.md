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

## A receita é rateada, e isso é uma escolha

Pagamento quita a conta do paciente, não um item do orçamento. Para saber
quanto cada procedimento rendeu, o recebido da avaliação entra em cada item
na proporção do valor dele no orçamento.

Num orçamento de R$ 4.400 com R$ 3.000 recebidos, um clareamento de R$ 1.200
recebe R$ 818. Quando o orçamento é de um procedimento só, rateio e valor
coincidem. É a leitura honesta possível: qualquer outra fingiria saber qual
item o dinheiro pagou primeiro.

## O ranking é por hora de cadeira

A clínica não vende procedimento, vende tempo. Um procedimento de ticket
alto que ocupa três horas pode deixar menos por hora do que um de ticket
baixo que ocupa uma. Por isso `paraConteudo.criterio` é
`"margem por hora de cadeira"`, e é assim que a lista sai ordenada.

## O bloco que a automação lê

```json
{
  "criadoEm": "2026-09-20T14:02:11.000Z",
  "criterio": "margem por hora de cadeira",
  "destaques": [
    { "procedimento": "Clareamento", "margemPorHora": 48000, "margemPercentual": 62.4, "vezes": 9 }
  ],
  "revisar": [
    { "procedimento": "Faceta em resina", "margem": -12000, "motivo": "custo acima do recebido no período" }
  ]
}
```

Valores em centavos, como em todo o resto do sistema.

### Ligando no n8n

1. **Credencial**: a chave do agente, a mesma já usada nas outras rotinas
   (`Authorization: Bearer <chave>`), que fica sob a guarda da doutora.
   Desde o contrato v9 essa chave abre o ERP inteiro, o que é mais um
   motivo para o fluxo do n8n mandar ao modelo só o `paraConteudo`, e não
   a resposta inteira de qualquer rota.
2. **Nó HTTP Request**: `GET {{API}}/api/relatorios/rentabilidade`, sem
   parâmetro traz o mês corrente.
3. **O que mandar para o modelo**: apenas `paraConteudo`. Os `destaques`
   viram pauta ("o que divulgar"), e `revisar` é alerta para a doutora, não
   assunto de post.
4. **Cadência**: uma vez por semana basta. O relatório muda com
   recebimento, e recebimento não muda de hora em hora.

### O relatório é agregado, mesmo com o agente enxergando tudo

Desde o contrato v9 o agente lê o ERP inteiro, prontuário incluído. Ainda
assim **este** relatório não carrega nome, CPF, telefone nem valor
individual de pagamento: ele é somado por procedimento porque é disso que a
pauta precisa, e mandar ficha de paciente para um modelo de linguagem sem
necessidade é risco de graça.

Há um teste de ponta a ponta que falha se um nome de paciente aparecer na
resposta desta rota.

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
