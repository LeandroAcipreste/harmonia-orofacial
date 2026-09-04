# Proteger uma tela do ERP

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
