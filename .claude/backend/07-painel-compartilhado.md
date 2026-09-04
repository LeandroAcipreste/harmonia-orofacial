# Uma tela é a agenda, a outra é a lista — o painel é o mesmo

`src/components/painel/painel.js` é dono da ficha, do odontograma, do
parecer e do orçamento. As duas telas montam ele e passam só o registro:

```js
const painel = criarPainel({
  hospedeiro: document.querySelector("#painel"),
  aoFechar: limparDestaque,
  aoConverter: () => carregar(),
});

painel.abrir(registro);
```

O componente escreve a própria marcação, então quem usa não repete HTML —
e não há duas cópias para divergir quando o formulário mudar. Dado de
paciente entra sempre por `textContent`, nunca por `innerHTML`.

A Dra. Célia edita o caso **pelas duas telas**. A agenda serve o dia; a
lista de pacientes serve para voltar a um caso antigo e corrigir ou
completar o que ficou faltando. É o mesmo `PUT .../parecer` nos dois
caminhos.

`src/core/erp.css` guarda o que as telas do sistema têm em comum:
cabeçalho, navegação, listas e selos. **A home não importa esse arquivo** —
ela é cartão de visita e não compartilha esta língua visual.
