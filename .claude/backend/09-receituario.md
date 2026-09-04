# Receituário

Dentro do painel do paciente, a Dra. Célia escreve os medicamentos e clica
em **Emitir e imprimir**. O front salva o receituário e abre a janela de
impressão do navegador com a folha pronta.

## Rota

| rota | corpo | resposta |
|---|---|---|
| `POST /api/agendamentos/:id/receituarios` | o receituário (abaixo) | `{ id }` |

Os já emitidos voltam em `GET /api/agendamentos/:id`, no campo
`receituarios`, e aparecem no painel com um botão de reimprimir.

```json
{
  "emitidoEm": "2026-09-04T18:20:41.000Z",
  "remedios": [
    {
      "nome": "Amoxicilina",
      "forma": "500 mg, cápsula",
      "quantidade": "21 cáps.",
      "posologia": "1 cápsula de 8 em 8 horas, por 7 dias."
    }
  ]
}
```

Só `nome` é obrigatório — o front descarta linhas sem ele.

**Receituário não se edita nem se apaga.** Uma vez emitido, é um documento
entregue ao paciente. Errou, emite outro. O servidor não deve expor `PUT`
nem `DELETE` aqui, e o histórico mostra todos.

## A folha impressa

Ela é montada no cliente, em `montarReceitaImpressa` dentro de
`src/components/painel/painel.js`, e estilizada no bloco `@media print` de
`painel.css`: em impressão, tudo que não for `.impressao` some da página.

Sai com o cabeçalho da clínica, o nome do paciente, os medicamentos
numerados com a posologia embaixo, a cidade e a data por extenso, e a
linha de assinatura com nome e CRO — os dados reais, que vivem em
`CLINICA` e `PROFISSIONAL` em `src/core/config.js`.

## O problema da assinatura, que o front-end não resolve

A tela produz um receituário **para imprimir e assinar à mão**. Ela não
produz um receituário digital com validade jurídica, e a diferença não é
detalhe.

No Brasil, prescrição em meio eletrônico só tem validade com **assinatura
digital padrão ICP-Brasil** — Lei 14.063/2020, e as normas do CFO e do
CFM que a acompanham. Isso exige certificado do profissional (A3 em token
ou nuvem) e uma etapa de assinatura que **não pode acontecer no
navegador**: a chave privada não pode viver no front-end, e um PDF gerado
por `window.print()` não carrega assinatura nenhuma.

Para virar receituário digital de verdade, o backend precisa:

1. Gerar o PDF no servidor, a partir do mesmo conteúdo que hoje é
   impresso.
2. Assinar esse PDF com o certificado ICP-Brasil da Dra. Célia — via
   serviço de assinatura em nuvem, ou integrando com uma plataforma de
   prescrição eletrônica já credenciada (a do CFO, Memed, Nexodata e
   afins).
3. Devolver o PDF assinado e um código de validação que a farmácia possa
   conferir.

Enquanto isso não existir, **o que a tela entrega é o rascunho que ela
assina de caneta** — que é válido, é o que já se usa hoje no consultório, e
é honesto chamar pelo nome. O botão diz "Emitir e imprimir" justamente por
isso.

## Guarda

Receituário emitido faz parte do prontuário e segue a mesma retenção dele.
Registre quem emitiu, quando, e para qual paciente — e nunca deixe a lista
de receituários de um paciente acessível sem sessão válida: é dado de
saúde identificado.
