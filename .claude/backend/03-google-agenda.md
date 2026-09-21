# Google Agenda

A agenda da clínica mora no Google. O backend fala com ela pela conta da
Dra. Célia, que autoriza uma vez (OAuth). **A credencial do Google não
pode viver no site**: o fluxo OAuth e o token ficam no servidor, e o site
só pergunta ao backend quais horários estão livres.

## De onde saem os horários

A doutora abre horários criando eventos numa agenda própria do Google,
"Horários de avaliação" (pode ser recorrente: toda terça, das 8h às 12h).
O servidor divide cada evento em blocos de `AGENDA.duracaoMinutos` e tira:

- o que bate com qualquer evento ocupado da agenda principal dela,
  inclusive compromissos pessoais;
- o que já foi reservado no ERP, mesmo que o evento do Google tenha
  falhado;
- o que começa em menos de 3 horas.

`GET /api/horarios` é pública e devolve só o que está livre, nunca quem
ocupa:

```json
{
  "duracaoMinutos": 40,
  "fuso": "America/Maceio",
  "dias": [
    { "data": "2026-09-15", "horarios": ["08:00", "08:40", "09:20"] }
  ]
}
```

Sem parâmetros, cobre os próximos 21 dias. Aceita `de` e `ate`
(`AAAA-MM-DD`, até 60 dias). Responde 503 quando a agenda online está
desligada; o site então mostra "data preferida e turno", como antes.

## A reserva acontece no envio da ficha

A ficha versão 3 manda `"horario": "2026-09-15T08:40"`, na hora da
clínica. O servidor confere de novo, sem cache, e responde **409** se o
horário acabou de ser pego. A tela recarrega as opções. O banco também
recusa duas avaliações sobrepostas, então nem dois cliques no mesmo
segundo reservam o mesmo bloco.

A clínica ainda remarca e desmarca pelo ERP
(`PUT /api/agendamentos/:id/horario`), e o evento acompanha.

## O evento

| campo do evento | vem de |
|---|---|
| `summary` | `"Avaliação · " + paciente.nome` |
| `description` | telefone do paciente |
| `start` e `end` | o horário reservado, mais `duracaoMinutos`, em `America/Maceio` |
| `extendedProperties.private.avaliacaoId` | o id da avaliação no ERP |

**Nenhum dado de saúde vai para o Google.** A anamnese fica só no ERP.
O paciente não é convidado para o evento.
