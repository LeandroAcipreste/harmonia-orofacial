# Sessão e verificação

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
