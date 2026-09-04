# Anexos — fotos da boca e exames

A Dra. Célia anexa fotos da boca e exames dentro do painel do paciente, na
seção **Fotos e exames**. São dois grupos, distinguidos pelo campo
`tipo_anexo`: `foto` e `exame`.

## Rotas

| rota | corpo | resposta |
|---|---|---|
| `POST /api/agendamentos/:id/anexos` | o anexo (abaixo) | `{ id, url, criadoEm }` |
| `DELETE /api/agendamentos/:id/anexos/:anexoId` | — | 200 |

Os anexos já salvos voltam junto de `GET /api/agendamentos/:id`, no campo
`anexos`, cada um com `id`, `tipo_anexo`, `nome`, `tipo`, `tamanho` e
`url`.

## O que o front envia

```json
{
  "tipo_anexo": "foto",
  "nome": "sorriso-frontal.jpg",
  "tipo": "image/jpeg",
  "tamanho": 612340,
  "tamanhoOriginal": 4881220,
  "largura": 2000,
  "altura": 1500,
  "conteudo": "data:image/jpeg;base64,…"
}
```

`conteudo` é um dataURL. **Isso é o caminho mais simples, não o melhor.**
Base64 infla o corpo em ~33% e ocupa memória do servidor no parse. Quando
o volume crescer, troque por `multipart/form-data` ou por URL pré-assinada
(o servidor devolve um endereço, o navegador manda o arquivo direto para o
armazenamento). O front muda em um lugar só: `salvarAnexo` em
`src/services/atendimento.js`.

## A imagem já chega reduzida

`src/utils/imagem.js` encolhe antes de enviar, no navegador:

1. Limita o maior lado a **2000 px**.
2. Persegue um alvo de **800 KB** baixando a qualidade JPEG pela escala
   0,90 → 0,58.
3. Só se ainda não couber, reduz a dimensão em 20% e tenta de novo —
   **nunca abaixo de 900 px de lado**.

A ordem é essa de propósito: qualidade de compressão se recupera olhando a
foto; **detalhe apagado por redimensionamento não volta**, e é justamente o
detalhe que interessa num registro clínico. `tamanhoOriginal` viaja junto
para o servidor saber o quanto foi perdido.

PDF e qualquer coisa que não seja imagem passam intactos.

O limite duro é `TAMANHO_MAXIMO` em `src/core/config.js`, hoje 12 MB, e
vale para o arquivo escolhido, antes de encolher. **O servidor precisa
repetir esse limite** — validação no cliente é conveniência, contorna-se
chamando a API direto.

## O que o servidor precisa garantir

- **Não confie no `tipo` que o front manda.** Determine o tipo real pelo
  conteúdo do arquivo e recuse o que não for imagem ou PDF. Um `.jpg` que
  na verdade é HTML vira XSS quando alguém abre a URL do anexo.
- **Sirva o anexo com `Content-Disposition: attachment`** ou de um domínio
  separado. Servir arquivo enviado por usuário no mesmo domínio da
  aplicação é como um XSS entra.
- **A URL do anexo precisa de autorização.** Uma URL longa e difícil de
  adivinhar não é controle de acesso: é foto de dentro da boca de um
  paciente identificado. Exija sessão, ou use URL assinada de vida curta.
- **Apagar é apagar.** O `DELETE` some com o arquivo do armazenamento, não
  só com a linha no banco.
- **Registre quem anexou e quem apagou.** É prontuário; a trilha importa.

## LGPD

Foto da boca de pessoa identificada é **dado pessoal sensível** (art. 5º,
II — dado referente à saúde). Some-se a isso que imagem de face é
biométrica.

O consentimento de imagem que o paciente marca na ficha
(`consentimento.imagem`) é sobre **divulgação** — o antes e depois em rede
social. O registro clínico no prontuário tem base legal própria e não
depende dele. O painel mostra isso: quando o paciente **não** autorizou,
aparece o aviso de que as fotos ali valem só como prontuário; quando
autorizou, aparece o botão que dispara o termo descrito em
[10-email-termo-de-imagem.md](10-email-termo-de-imagem.md).

Se a autorização for revogada, o servidor precisa marcar as imagens como
não publicáveis — sem apagá-las do prontuário, cuja guarda é exigida.
