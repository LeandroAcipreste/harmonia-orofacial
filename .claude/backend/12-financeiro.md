# Financeiro

O orçamento aceito é a conta do paciente. Aqui entra o outro lado: o que foi
recebido, por qual meio, e quanto sobrou depois da maquininha.

Três papéis encostam no dinheiro, e cada um enxerga um pedaço:

| quem | faz |
|---|---|
| Secretária (`recepcao`) | lança o pagamento depois do procedimento e confere o caixa do dia |
| Financeiro (`financeiro`) | vê tudo, de qualquer período, cuida das taxas e exporta a planilha |
| Dentista | as duas coisas |

O perfil `financeiro` **não recebe `prontuario.ver`**. Ele vê a conta do
paciente (total, recebido, saldo, pagamentos) e não vê anamnese, parecer,
exame nem requisição. Dado de saúde vai para quem trata, não para quem
cobra, e a rota da ficha já devolve menos para ele.

## Rotas

| rota | permissão | o que faz |
|---|---|---|
| `POST /api/agendamentos/:id/pagamentos` | `financeiro.registrar` | lança um recebimento |
| `PUT /api/financeiro/pagamentos/:id/estorno` | `financeiro.registrar` | estorna, com motivo |
| `GET /api/financeiro/lancamentos` | `financeiro.caixa` | o caixa de hoje |
| `GET /api/financeiro/lancamentos?de=&ate=` | `financeiro.ver` | o período, e `&formato=csv` baixa a planilha |
| `GET /api/financeiro/balanco?data=` | `financeiro.ver` | dia, semana e mês, com bruto, taxa e líquido |
| `GET /api/financeiro/abertos` | `financeiro.ver` | quem ainda deve |
| `GET` `POST` `/api/financeiro/taxas` | `financeiro.taxas` | as taxas da maquininha |

A conta de cada avaliação volta em `GET /api/agendamentos/:id`, no campo
`conta`, para quem tem `financeiro.registrar` ou `financeiro.ver`.

```json
{
  "valor": 200000,
  "forma": "credito",
  "parcelas": 3,
  "observacao": "Entrada do clareamento."
}
```

`valor` é **centavos, em inteiro**: 200000 é R$ 2.000,00. Ponto flutuante em
dinheiro erra centavo, e centavo errado no fim do mês vira conversa chata.

`forma` é `dinheiro`, `pix`, `debito` ou `credito`. Só o crédito aceita
`parcelas` acima de 1; nos outros o servidor recusa com 422.

## A taxa é carimbada, não calculada na leitura

Ao lançar, o servidor procura a taxa vigente para aquela forma e faixa de
parcelas **na data do recebimento**, calcula o valor da taxa e grava os
três números na linha do pagamento: percentual, taxa em centavos e líquido.

Isso é de propósito. Se a maquininha trocar de contrato em novembro, o
balanço de outubro continua mostrando o que de fato caiu na conta. Taxa
calculada na hora de ler faria o passado mudar sozinho, e relatório que
muda sozinho ninguém confia.

Pelo mesmo motivo, **taxa não se edita**: mudar uma taxa insere uma linha
nova em `taxas_de_pagamento` com `vigente_desde`, e a antiga continua
explicando os lançamentos antigos.

A migration 008 cria as seis faixas com **zero por cento**. É escolha: o
sistema não inventa a taxa da maquininha da clínica. Enquanto o financeiro
não lançar o contrato real, bruto e líquido são iguais, e ninguém é
enganado por um número bonito que não conferiu.

## Pagamento não se apaga

Erro vira estorno, com motivo obrigatório e autor. O lançamento continua na
ficha, marcado, e para de contar no balanço e no saldo. O servidor não expõe
`DELETE`, e estornar duas vezes devolve 409 `pagamento_ja_estornado`.

## O balanço é por caixa

O dia rende o que entrou nele. Semana e mês são os do calendário que contêm
a data pedida, e a semana começa na segunda.

O que **não** está modelado, e vale dizer em voz alta: antecipação de
recebível e prazo de repasse da maquininha. O sistema mostra o líquido do
dia da venda, não a data em que o dinheiro cai na conta. Para a clínica
saber quanto rendeu, serve; para conciliar extrato bancário, faltaria a
data de repasse, que é um campo a mais e uma conversa com a operadora.

## Exportação

`?formato=csv` devolve ponto e vírgula, vírgula decimal e BOM na frente:
é o que faz o Excel em português abrir o arquivo com acento certo e número
reconhecido como número. O contrato promete "exportável em planilha"
(Anexo I, página Financeiro), e é esta rota que cumpre.
