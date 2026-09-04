# Agenda do dia e parecer clínico

A tela `pages/agenda/agenda.html` é o painel da Dra. Célia. Ela lista as
avaliações de um dia, abre a ficha que o paciente preencheu e recebe o
parecer clínico e o orçamento. `src/services/atendimento.js` fala com
estas rotas, todas com `credentials: "include"`:

| rota | corpo | resposta esperada |
|---|---|---|
| `GET /api/agenda?data=YYYY-MM-DD` | — | `{ agendamentos: [...] }` |
| `GET /api/agendamentos/:id` | — | o registro completo |
| `PUT /api/agendamentos/:id/parecer` | `{ dentes, texto, orcamento }` | 200 |
| `PUT /api/agendamentos/:id/estagio` | `{ estagio: "cliente" }` | 200 |
| `GET /api/pacientes?busca=&estagio=` | — | `{ pacientes: [...] }` |

`busca` é texto livre: o servidor procura em nome, e-mail e telefone. A
comparação precisa ignorar acento e maiúscula, e o telefone precisa ser
comparado **só pelos dígitos** — quem digita `79998764880` tem que achar
quem está gravado como `(79) 99876-4880`. `estagio` vazio devolve todo
mundo; preenchido, filtra por `contato` ou `cliente`.

`data` é sempre a data **local da clínica**, não UTC. Quem monta o dia é o
servidor, no fuso de `AGENDA.fuso`.

### O item da lista

```json
{
  "id": "a3f9",
  "hora": "08:30",
  "estagio": "contato",
  "paciente": { "nome": "Maria Souza", "telefone": "(79) 99876-4880" }
}
```

`GET /api/agendamentos/:id` devolve o mesmo objeto acrescido de tudo que a
ficha enviou (`paciente` completo, `preferencia`, `saude`, `observacoes`,
`consentimento`) e do `parecer`, se já existir.

### O parecer

```json
{
  "dentes": [11, 12, 21, 22],
  "texto": "Desgaste incisal nos centrais e laterais superiores…",
  "orcamento": {
    "itens": [
      { "procedimento": "Clareamento supervisionado", "valor": 120000 },
      { "procedimento": "Faceta em resina (4 elementos)", "valor": 320000 }
    ],
    "total": 440000
  }
}
```

**Dinheiro trafega em centavos, como número inteiro.** Nunca em reais com
casa decimal: `0.1 + 0.2` não dá `0.3` em ponto flutuante, e orçamento com
centavo errado é problema com o paciente. A tela converte na entrada e na
saída; o banco guarda o inteiro.

`dentes` usa a **notação FDI de dois dígitos** — quadrante e posição:
`11` a `18` superior direito, `21` a `28` superior esquerdo, `31` a `38`
inferior esquerdo, `41` a `48` inferior direito. É a notação da OMS, e é a
que `src/services/odontograma.js` desenha.

### O parecer é o momento da conversão

É nesta tela que o funil da seção 2 vira ação. O botão **"Compareceu —
virar cliente"** é a única porta por onde alguém passa de `contato` a
`cliente`, e ele existe aqui porque é aqui que a clínica constata o
comparecimento. O site público nunca envia `estagio: "cliente"`.

Enquanto a pessoa é `contato`, a anamnese é **declaração**. Depois da
conversão, o conjunto anamnese + parecer + odontograma vira **prontuário**,
e passa a valer a retenção legal do CFO. Isso muda o regime de exclusão:
um `contato` que pede remoção pela LGPD sai; um prontuário de paciente
atendido tem prazo de guarda próprio.

### Modo de demonstração

`DEMONSTRACAO` em `src/core/config.js` está **ligado** enquanto o backend
não existe. Com ele ligado, `atendimento.js` e `sessao.js` respondem com os
dados de `src/services/demonstracao.js` — é para avaliar a interface, não
para uso real.

O login funciona de ponta a ponta, contra a credencial fixa em
`demonstracao.js` (`adm@adm.com` / `12345`). A guarda, a trava de cinco
tentativas e o `?volta=` seguem o mesmo caminho de sempre; só a resposta do
servidor é que vem de dentro do arquivo. O mínimo de 8 caracteres da senha
também cede ao modo demo, e volta sozinho quando ele desliga.

**Isso não é autenticação.** Credencial escrita em JavaScript de front-end é
legível por qualquer pessoa que abra o arquivo ou o DevTools: ela destranca
a interface, não protege dado nenhum. Quem autentica é o servidor, e é ele
que precisa validar a sessão em cada rota.

**Ao subir o backend: `export const DEMONSTRACAO = false;`** — e
`demonstracao.js` pode ser apagado. Deixar isso ligado em produção abre o
painel para qualquer pessoa que souber a URL.

### O odontograma é uma imagem com alvos medidos

`assets/dentes.png` é o desenho das duas arcadas. Os alvos de clique não
são adivinhados: `src/services/odontograma.js` guarda, para cada dente, a
posição em **porcentagem da imagem**, extraída do canal alfa do próprio
PNG. Cada alvo cresce até o meio do vão com o vizinho, então não existe
zona morta entre dentes.

Se a imagem for trocada, **as porcentagens precisam ser medidas de novo** —
elas descrevem aquele arquivo, não um desenho qualquer. Trocar o PNG sem
refazer o mapa desalinha as 32 marcações em silêncio.
