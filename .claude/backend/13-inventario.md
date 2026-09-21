# Inventário

O que a clínica tem em casa, quanto disso cada atendimento gasta, e o aviso
quando alguma coisa está acabando.

A doutora e a secretária usam a tela. O perfil `financeiro` não entra: o
inventário é da clínica, não do caixa.

| quem | faz |
|---|---|
| Dentista | tudo: cadastra insumo, define o mínimo, lança entrada, consumo, perda e ajuste |
| Secretária (`recepcao`) | vê, lança entrada, perda e ajuste de contagem |

## O saldo é a soma do extrato

Não existe coluna de saldo. Existe `movimentos_de_insumo`, e o saldo é a
soma das quantidades, servida pela view `saldos_de_insumo`.

A quantidade é **assinada**: entrada positiva, saída e perda negativas,
ajuste dos dois lados. Somar vira somar, sem `CASE` no meio, e o tipo
continua dizendo o que aconteceu.

O motivo de não guardar o saldo numa coluna é prático: coluna solta mente
na primeira digitação errada e ninguém descobre onde. Com extrato, "por que
faltou anestésico?" tem resposta com data, quantidade, motivo e autor.

## Rotas

| rota | permissão | o que faz |
|---|---|---|
| `GET /api/insumos?busca=&situacao=` | `inventario.ver` | a prateleira; `situacao=baixos` traz só o que está no mínimo |
| `GET /api/insumos/alertas` | `inventario.ver` | o que está no mínimo, para o selo e a faixa |
| `GET /api/insumos/:id/extrato` | `inventario.ver` | os últimos 200 movimentos do insumo |
| `POST /api/insumos` | `inventario.gerenciar` | cadastra |
| `PUT /api/insumos/:id` | `inventario.gerenciar` | renomeia, muda unidade, mínimo e ativo |
| `POST /api/insumos/:id/movimentos` | `inventario.mover` | entrada, perda ou ajuste |
| `POST /api/agendamentos/:id/insumos` | `inventario.mover` | o consumo do atendimento |

O consumo daquela avaliação volta em `GET /api/agendamentos/:id`, no campo
`insumos`, para quem tem `prontuario.ver` e `inventario.ver`.

## O ajuste pede a contagem, não a diferença

```json
{ "tipo": "ajuste", "contagem": 5, "motivo": "Contagem do mês" }
```

A tela manda **o que foi contado na prateleira**, e o servidor calcula a
diferença para o saldo dele. Pedir a diferença seria pedir que a pessoa
faça de cabeça uma conta que a máquina faz melhor, e é assim que entra
ajuste com o sinal trocado.

Se a contagem bater com o saldo, a resposta é 409 `nada_a_ajustar`: não há
movimento a registrar, e gravar um ajuste de zero só sujaria o extrato.

Entrada e perda pedem `quantidade` positiva; o sinal quem põe é o servidor,
pelo tipo. Motivo é obrigatório em tudo que tira do saldo.

## O consumo do atendimento vai em lote

```json
{ "itens": [{ "insumoId": "...", "quantidade": 2 }, { "insumoId": "...", "quantidade": 1 }] }
```

"Gastei anestésico, agulha e sugador" é um gesto, não três: ou entra
inteiro ou não entra, numa transação só. Cada item vira uma saída ligada à
avaliação, e é esse vínculo que responde depois quanto cada procedimento
consome de verdade.

## O aviso de mínimo

`saldo <= minimo` liga o alerta. Ele aparece em dois lugares, e nenhum dos
dois é e-mail:

- **selo** com a contagem no menu de todas as telas do sistema;
- **faixa** no topo da agenda, que é onde a doutora começa o dia, com os
  três nomes mais críticos por extenso.

Quem monta os dois é `src/components/aviso-estoque/aviso-estoque.js`. Ele
falha em silêncio de propósito: ficar sem o aviso é chato, quebrar a agenda
por causa dele seria pior.

Se um dia o aviso precisar sair da tela (e-mail diário, WhatsApp), o
`GET /api/insumos/alertas` já é a fonte pronta. E-mail exigiria pedir ao
Google o escopo `gmail.send`, que a conexão de hoje não tem.

## Nome é chave

`insumos_nome_unico` é um índice único sobre `lower(nome)`. Dois
"Anestésico Mepivacaína 3%" com grafia diferente viram dois saldos pela
metade, e aí o aviso de mínimo nunca dispara direito. Cadastro repetido
devolve 409 `duplicado`.

## O que não está aqui

Lote e validade. Para saber **o que vencer primeiro**, seria preciso um
nível a mais (lotes dentro do insumo), e o consumo passaria a escolher de
qual lote sai. Vale a pena no dia em que a clínica perder material por
vencimento; hoje seria complexidade sem uso.
