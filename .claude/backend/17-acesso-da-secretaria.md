# O acesso da secretária

O que a secretária (papel `recepcao`) faz no sistema, como a clínica
definiu:

| o quê | como |
|---|---|
| Pacientes do dia | abre a ficha do atendimento de hoje e, dentro dela, registra o pagamento (forma, parcelas) e os insumos usados |
| Agenda do mês | vê o mês inteiro e remarca à mão quando precisar |
| Inventário | cadastra insumo, lança entrada, perda e ajuste de contagem |

O que ela **não** tem: a lista de todos os pacientes, anamnese, parecer,
exames, relatórios de período e o painel do financeiro.

A mudança está na migration `013_secretaria.sql`: sai `pacientes.ver`,
entra `inventario.gerenciar`.

## Só o atendimento de hoje

Quem não tem `pacientes.ver` (hoje, só a secretária) abre a ficha, lança
pagamento, lança consumo de insumo e marca comparecimento **só no
atendimento de hoje**. Qualquer outro dia o servidor recusa com 403 e o
código `fora_do_dia`.

O dia do atendimento é o do horário marcado, na hora da clínica, ou, sem
horário, o dia que a pessoa pediu na ficha.

A regra mora em `middlewares/atendimentoDoDia.js` e vale para estas rotas:

- `GET /api/agendamentos/:id`
- `PUT /api/agendamentos/:id/comparecimento`
- `POST /api/agendamentos/:id/pagamentos`
- `POST /api/agendamentos/:id/insumos`

Remarcar (`PUT /api/agendamentos/:id/horario`) **não** entra na regra:
remarcar outro dia é justamente para o que serve a agenda do mês.

## A agenda do mês

`GET /api/agenda?mes=AAAA-MM`, com `agenda.ver`. Traz o mesmo que a agenda
do dia (nome, telefone, hora, estágio) e o dia de cada um, em ordem de dia
e hora:

```json
{
  "mes": "2026-09",
  "agendamentos": [
    {
      "id": "…",
      "data": "2026-09-24",
      "hora": "10:20",
      "estagio": "contato",
      "status": "aguardando",
      "paciente": { "nome": "Maria Souza Andrade", "telefone": "(79) 99876-0000" }
    }
  ]
}
```

Sem dado de saúde: é o que precisa para achar a pessoa, ligar e remarcar.

## Na tela

A Agenda ganhou o seletor **Dia · Mês**. Cada linha tem o botão
**Remarcar**, para quem tem `agenda.marcar`: escolhe o novo dia e o novo
horário, e o servidor recusa se o horário já estiver ocupado.

Para a secretária, só as linhas de hoje abrem a ficha. As de outros dias
aparecem, para remarcar, mas não são clicáveis. O item **Pacientes** some
do menu dela, porque é a lista de todos.
