# Contato e cliente — a regra do funil

Quem preenche a ficha **não é cliente**. Entra como `estagio: "contato"`,
e só vira `cliente` depois de comparecer à avaliação. Quem decide isso é a
clínica, dentro do ERP — o site nunca envia `estagio: "cliente"`.

```
ficha preenchida  ->  contato   (marketing, automação de e-mail)
                          |
                  compareceu à avaliação
                          v
                       cliente  (prontuário, histórico, tratamento)
```

Consequências para o banco:

- `contato` e `cliente` são **estados da mesma pessoa**, não tabelas
  separadas. Duplicar a pessoa ao converter quebra o histórico.
- A anamnese chega junto com o contato, mas só vira prontuário na
  conversão. Antes disso é declaração, não registro clínico.
- A base de marketing é a de `contato` **com `consentimento.marketing`
  verdadeiro** — nunca a lista inteira.

### Consentimento de marketing é separado, e isso não é detalhe

`consentimento.dados` autoriza **enviar a ficha para agendar**.
`consentimento.marketing` autoriza **receber campanha**. São finalidades
diferentes; pela LGPD, consentimento vale para a finalidade informada.
Mandar campanha para quem só marcou o primeiro é uso não consentido.

Todo e-mail de marketing precisa de link de descadastro, e o
descadastro precisa voltar para o banco como `marketing: false`.
