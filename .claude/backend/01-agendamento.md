# Agendamento

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
