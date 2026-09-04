# O que o backend precisa fazer

Esta pasta é o pedido de obra para quem for construir o servidor, o banco e
as integrações do ERP da Harmonia Orofacial. Cada arquivo descreve uma
parte: o que o front-end envia, o que ele espera de volta, e as decisões
que não podem ser tomadas de outro jeito sem quebrar alguma coisa.

O front-end **não guarda credencial, não cria evento e não escreve no
banco**. Ele coleta, valida e entrega. Toda decisão fica no servidor.

| arquivo | assunto |
|---|---|
| [01-agendamento.md](01-agendamento.md) | a ficha que o site envia e como trocar WhatsApp por API |
| [02-funil-contato-cliente.md](02-funil-contato-cliente.md) | a regra que separa quem é contato de quem é cliente |
| [03-google-agenda.md](03-google-agenda.md) | como a preferência de horário vira evento |
| [04-sessao-e-seguranca.md](04-sessao-e-seguranca.md) | login, verificação, cookie e trava de tentativas |
| [05-proteger-uma-tela.md](05-proteger-uma-tela.md) | a guarda de rota no cliente, e por que ela não basta |
| [06-agenda-e-parecer.md](06-agenda-e-parecer.md) | agenda do dia, lista de pacientes, odontograma e orçamento |
| [07-painel-compartilhado.md](07-painel-compartilhado.md) | como as duas telas usam o mesmo painel |
| [08-anexos.md](08-anexos.md) | fotos da boca e exames |
| [09-receituario.md](09-receituario.md) | receituário, impressão e o problema da assinatura |
| [10-email-termo-de-imagem.md](10-email-termo-de-imagem.md) | o e-mail que sai quando o paciente autoriza a imagem |

---

## Antes de subir qualquer coisa

**`DEMONSTRACAO` em `src/core/config.js` precisa virar `false`.** Enquanto
está `true`, o sistema responde com dados de mentira de
`src/services/demonstracao.js` e o login aceita uma credencial escrita em
JavaScript (`adm@adm.com` / `12345`), legível por qualquer pessoa que abra
o DevTools. Isso destranca a interface para avaliação; não protege nada.
Com o backend no ar, `demonstracao.js` pode ser apagado.

**Cada rota valida a sessão por conta própria.** Esconder uma tela no
cliente é navegação, não autorização.

**Dado de saúde é dado pessoal sensível pela LGPD.** Anamnese, foto da
boca, exame e receituário estão todos nessa categoria. O que isso implica
está escrito em cada arquivo, no lugar em que importa.

---

## Rotas, em uma tabela

| método | rota | arquivo |
|---|---|---|
| `POST` | `/api/agendamentos` | 01 |
| `POST` | `/api/sessao` | 04 |
| `POST` | `/api/sessao/verificar` | 04 |
| `POST` | `/api/sessao/reenviar` | 04 |
| `POST` | `/api/sessao/sair` | 04 |
| `GET` | `/api/sessao/atual` | 04 |
| `GET` | `/api/agenda?data=` | 06 |
| `GET` | `/api/pacientes?busca=&estagio=` | 06 |
| `GET` | `/api/agendamentos/:id` | 06 |
| `PUT` | `/api/agendamentos/:id/parecer` | 06 |
| `PUT` | `/api/agendamentos/:id/estagio` | 06 |
| `POST` | `/api/agendamentos/:id/anexos` | 08 |
| `DELETE` | `/api/agendamentos/:id/anexos/:anexoId` | 08 |
| `POST` | `/api/agendamentos/:id/receituarios` | 09 |
| `POST` | `/api/agendamentos/:id/termo-imagem` | 10 |

Todas com `credentials: "include"` — o cookie de sessão viaja sozinho.
