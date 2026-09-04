# Google Agenda

| campo do evento | vem de |
|---|---|
| `summary` | `"Avaliação — " + paciente.nome` |
| `start.dateTime` | `preferencia.data` + horário escolhido pela clínica dentro de `preferencia.janela` |
| `start.timeZone` | `agenda.fuso` |
| `end.dateTime` | `start` + `agenda.duracaoMinutos` |
| `attendees[0].email` | `paciente.email` |
| `description` | `observacoes` e o resumo de `saude` |

`preferencia` é **preferência, não marcação**: quem confirma o horário é a
clínica. O site nunca cria evento sozinho.

**A credencial do Google não pode viver no site.** O fluxo OAuth e a
service account ficam no backend. Qualquer tentativa de chamar a API do
Calendar direto do navegador expõe o segredo.
