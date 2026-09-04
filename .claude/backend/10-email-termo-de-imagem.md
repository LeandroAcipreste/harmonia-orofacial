# O e-mail do termo de imagem

Quando o paciente marca na ficha que autoriza o registro fotográfico
(`consentimento.imagem: true`), o painel mostra um botão **Enviar termo de
imagem**. Ele dispara para o e-mail do paciente um texto que explica o que
foi autorizado, como as fotos são protegidas e como voltar atrás.

O botão só aparece quando as duas coisas são verdade: o paciente autorizou
**e** tem e-mail na ficha.

## Rota

| rota | corpo | resposta |
|---|---|---|
| `POST /api/agendamentos/:id/termo-imagem` | `{}` | 200 |

O servidor monta e envia. O front não manda o texto: o texto é o mesmo dos
dois lados e vive em `src/services/email.js`, em `TERMO_DE_IMAGEM`. Se o
backend reescrever por conta própria, os dois divergem — e o que vale
juridicamente é o que chegou na caixa do paciente.

**No modo de demonstração** não há servidor, então o front abre o cliente
de e-mail com assunto e corpo prontos (`mailto:`), para a Dra. Célia
revisar e enviar com a própria conta.

## O que o servidor precisa fazer

- **Registrar o envio.** Data, hora, endereço de destino e a versão do
  texto enviado, gravados junto do consentimento. Sem isso, a clínica não
  consegue provar que informou — e é justamente isso que o termo serve
  para provar.
- **Versionar o texto.** Toda alteração no `TERMO_DE_IMAGEM` sobe uma
  versão. Um consentimento vale para o texto que a pessoa recebeu, não
  para o texto de hoje.
- **Não reenviar sozinho.** Quem clica é a doutora. Um e-mail automático
  disparado a cada salvamento vira spam e enfraquece o valor do termo.
- **Responder à revogação.** O texto promete que basta responder o e-mail
  ou mandar mensagem no WhatsApp. Alguém precisa ler isso e registrar
  `consentimento.imagem: false` — e a partir daí as imagens do paciente
  ficam marcadas como não publicáveis.

## O que o texto promete

Ele está escrito por inteiro em `src/services/email.js`. Em resumo, a
clínica se compromete a:

- guardar as imagens em sistema de acesso restrito à equipe clínica;
- não vender, ceder nem compartilhar com terceiros;
- não publicar o nome junto da imagem sem pedido do paciente;
- recortar a imagem ao mínimo necessário na divulgação;
- não usar em propaganda paga sem avisar antes;
- aceitar revogação a qualquer momento, sem justificativa e sem custo.

**Essas promessas viram obrigação no momento em que o e-mail sai.** Se o
sistema não for capaz de cumprir alguma delas — por exemplo, se as imagens
ficarem num bucket público — o texto precisa mudar antes, não depois.

## A distinção que o texto faz, e que o banco precisa fazer também

São dois usos diferentes, com bases legais diferentes:

| uso | depende de autorização? |
|---|---|
| registro no prontuário, planejamento, acompanhamento | **não** — é obrigação do conselho |
| divulgação em rede social, site, material da clínica | **sim** — é o que `consentimento.imagem` libera |

Revogar a autorização **não apaga o prontuário**. Tira a imagem do ar e
impede novas publicações; o registro clínico continua guardado e restrito.
Se o banco tratar os dois como um campo só, a revogação vai ou apagar
prontuário que deve ser guardado, ou deixar no ar imagem que deveria sair.
