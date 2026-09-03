# Contrato do ERP — front-end

O que o site envia e o que espera receber. Este é o documento para quem
for construir o backend, o banco e a integração com o Google Agenda.

O front-end **não guarda credencial, não cria evento e não escreve no
banco**. Ele coleta, valida e entrega. Toda decisão fica no servidor.

---

## 1. Agendamento

### Como trocar o canal

Hoje o envio vai pelo WhatsApp. Para passar a usar a API, muda **uma
linha** em `src/core/config.js`:

```js
export const CANAL = "api";      // era "whatsapp"

export const API = {
  base: "https://api.harmoniaorofacial.com.br",
  agendamentos: "/api/agendamentos",
};
```

Nada mais muda. A página não sabe qual canal está em uso.

### O payload

`POST {API.base}{API.agendamentos}`, `Content-Type: application/json`.

```json
{
  "versao": 2,
  "origem": "site",
  "criadoEm": "2026-09-03T18:20:41.000Z",
  "estagio": "contato",

  "paciente": {
    "nome": "Maria Souza",
    "email": "maria@exemplo.com",
    "telefone": "(79) 99876-4880",
    "telefoneE164": "79998764880",
    "nascimento": "1990-04-12",
    "idade": "35",
    "sexo": "Feminino",
    "endereco": "Rua X, 100",
    "cidade": "Aracaju"
  },

  "preferencia": { "data": "2026-09-15", "janela": "manha" },

  "saude": {
    "saude": "Não", "medicamento": "Sim", "alergia": "Não",
    "fumante": "Não", "cicatrizacao": "Sim", "tratamento": "Não",
    "anestesia": "Sim", "malEstar": "Não", "hemorragia": "Não"
  },

  "observacoes": "Uso losartana.",

  "consentimento": {
    "veracidade": true,
    "dados": true,
    "imagem": false,
    "marketing": true
  },

  "agenda": { "duracaoMinutos": 40, "fuso": "America/Maceio" }
}
```

Campos vazios **não são enviados**. `saude` pode vir como `{}`.

`versao` existe para o backend aceitar fichas antigas quando o formulário
mudar. Campo obrigatório novo = subir `VERSAO_DA_FICHA`.

---

## 2. Contato e cliente — a regra do funil

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

---

## 3. Google Agenda

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

---

## 4. Sessão e verificação

`src/services/sessao.js` fala com estas rotas, todas com
`credentials: "include"`:

| rota | corpo | resposta esperada |
|---|---|---|
| `POST /api/sessao` | `{ email, senha, lembrar }` | `{ verificacao: true, canal }` ou `{ destino }` |
| `POST /api/sessao/verificar` | `{ codigo }` | `{ destino }` |
| `POST /api/sessao/reenviar` | — | 200 |
| `POST /api/sessao/sair` | — | 200 |
| `GET /api/sessao/atual` | — | dados da sessão, ou 401 |

Códigos que o front trata: **401** credencial ou código errado, **410**
código expirado, **429** bloqueado por tentativas.

### O token vai em cookie httpOnly, não em localStorage

O front-end **nunca toca no token**. O servidor devolve
`Set-Cookie: sessao=...; HttpOnly; Secure; SameSite=Lax`, e o navegador
cuida do resto. É por isso que `sessao.js` não tem nenhuma linha de
`localStorage`.

Guardar token em `localStorage` o expõe a qualquer XSS na página. Num
sistema com dado de saúde, isso é a diferença entre um bug de script e um
vazamento de prontuário.

### Trava de tentativas

O cliente trava após 5 falhas, por 60 segundos. **Isso é conveniência, não
segurança** — qualquer um contorna chamando a API direto. A trava que vale
é a do servidor, por IP e por conta, e é ela que responde 429.

---

## 5. Proteger uma tela do ERP

```js
import { exigirSessao } from "../../src/services/guarda.js";

exigirSessao().then((sessao) => {
  if (!sessao) return;
  // a tela monta aqui
});
```

Sem sessão, redireciona para o login com `?volta=` da rota pedida, e o
login devolve a pessoa para lá depois de entrar. `destinoDeVolta` recusa
URL absoluta e `//`, para o parâmetro não virar redirecionamento aberto.

Isso é **navegação, não autorização**: esconder a tela no cliente não
protege o dado. Cada rota de API precisa validar a sessão por conta
própria.
