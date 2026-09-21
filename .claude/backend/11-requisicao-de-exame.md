# Requisição de exames

A Dra. Célia indica clínicas de diagnóstico por imagem para os pacientes
dela. Hoje ela preenche à mão o bloco de papel do laboratório. No painel do
paciente, o botão **Solicitar exame** abre o formulário, e ao emitir o front
salva a requisição e abre a janela de impressão com a folha pronta.

A folha é da Harmonia, em papel timbrado, com a clínica de imagem impressa
como destinatária. O sistema não reproduz o formulário nem a marca do
laboratório: o bloco de papel continua sendo material deles.

## Rota

| rota | corpo | resposta |
|---|---|---|
| `POST /api/agendamentos/:id/requisicoes` | a requisição (abaixo) | `{ id, emitidoEm }` |

As já emitidas voltam em `GET /api/agendamentos/:id`, no campo
`requisicoes`, e aparecem no painel com um botão de reimprimir. Como os
anexos, elas seguem o **paciente**, e não a avaliação: a ficha de hoje
mostra o que foi pedido no mês passado.

```json
{
  "emitidoEm": "2026-09-18T14:02:11.000Z",
  "laboratorio": {
    "id": "oralbook-aracaju",
    "nome": "OralBook Diagnóstico Bucal",
    "unidade": "Unidade Aracaju",
    "endereco": "Rua Cedro, 290, Treze de Julho",
    "cidade": "Aracaju, SE, CEP 49020-170",
    "telefone": "(79) 9.9674-8163",
    "email": "oralbook.aju@outlook.com"
  },
  "dentes": [18, 46],
  "pedidos": {
    "periapicais": true,
    "panoramica": true,
    "mandibulaRegiao": "região do 46",
    "objetivoImplante": true
  },
  "observacao": "Paciente com trismo, marcar com folga."
}
```

`laboratorio.nome` e ao menos um item em `pedidos` são obrigatórios. Caixa
marcada vale `true`; linha escrita vale o texto dela, e linha em branco não
entra. `dentes` são os do odontograma, na notação FDI, e o servidor recusa
o que estiver fora dela.

## O servidor não conhece exame

As chaves de `pedidos` são os ids do formulário, que vive no front, em
`src/services/requisicao.js`. Ele é a transcrição das duas faces do bloco
de papel: intra-bucais, extra-bucais, tomografia, documentação ortodôntica,
análises cefalométricas, fotografias, escaneamento e guia cirúrgico.

O servidor confere formato, tamanho e quantidade, e guarda em `jsonb`. Ele
não valida se `periapicais` existe, de propósito: repetir a lista aqui
criaria duas listas para manter iguais, e no dia em que o laboratório mudar
o bloco de papel só uma delas mudaria.

O `laboratorio` é gravado por cópia, não por referência. O endereço e o
telefone que saíram impressos naquele dia ficam congelados no registro: se
a clínica de imagem mudar de endereço amanhã, a requisição de ontem
continua contando a verdade do papel que o paciente levou.

## Requisição emitida não se edita nem se apaga

Uma vez emitida, é documento entregue ao paciente e levado para fora da
clínica. Errou, emite outra. O servidor não expõe `PUT` nem `DELETE` aqui, e
o histórico mostra todas. Cada emissão entra em `avaliacao_historico` como
`requisicao_emitida`, com o autor.

## Quem pode

Permissão `requisicao.emitir`, que a migration 007 dá ao papel `dentista`.
Pedir exame é ato clínico, e a folha sai assinada com o CRO: a recepção
marca horário e registra comparecimento, mas não emite requisição.

A leitura vem junto da ficha e, como parecer e anexos, só sai do servidor
para quem tem `prontuario.ver`.

## A folha impressa

Montada no cliente, em `montarRequisicaoImpressa` dentro de
`src/components/painel/painel.js`, e estilizada no bloco `@media print` de
`painel.css`, junto da folha do receituário.

Sai com o cabeçalho da clínica, o nome do paciente e a data de nascimento,
os dentes assinalados, os exames pedidos agrupados como no formulário, a
observação, o quadro do destinatário com o endereço da clínica de imagem, a
cidade e a data por extenso, e a linha de assinatura com nome e CRO.

Vale aqui a mesma ressalva do receituário, em `09-receituario.md`: isto é um
documento **para imprimir e assinar à mão**. Não é documento eletrônico com
validade jurídica, e a diferença está explicada lá.
