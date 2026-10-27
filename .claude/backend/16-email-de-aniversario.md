# E-mail de aniversário

No dia do aniversário, o paciente recebe um e-mail de parabéns da clínica,
assinado pela Dra. Célia. Ninguém precisa lembrar nem apertar botão: a API
faz sozinha.

## Quem recebe

Paciente (quem já aceitou um orçamento e está na tabela `pacientes`) que
tem, ao mesmo tempo:

- e-mail cadastrado;
- data de nascimento cadastrada;
- **a autorização de receber novidades da clínica por e-mail marcada na
  ficha mais recente** (`consentimento_marketing`).

A ficha mais recente, e não qualquer uma: quem marcou numa ficha e
desmarcou numa ficha seguinte desistiu, e não recebe. É a regra que a casa
segue desde a primeira migration: cada aceite vale para a sua finalidade, e
parabéns de clínica é comunicação de relacionamento.

## Quando

- A API confere **de hora em hora**, mas só envia **entre 9h e 21h** no
  fuso da clínica (`FUSO`, padrão `America/Maceio`). Parabéns de madrugada,
  porque o servidor reiniciou, não é parabéns.
- Cada paciente recebe **uma vez por ano**. O envio fica anotado na tabela
  `aniversarios_enviados` (migration 012), com paciente e ano, e é essa
  anotação que impede o segundo e-mail se a API reiniciar no meio do dia.
- Quem nasceu em **29 de fevereiro** recebe no dia **28** nos anos que não
  são bissextos, e no próprio dia 29 nos bissextos.
- Se o envio de um paciente falhar, ele **não** é anotado: a API tenta de
  novo na hora seguinte. A falha de um não trava os outros.

## Por onde sai

Pelo **Gmail da clínica**, o mesmo que a doutora conecta na tela de
Administração. A permissão `gmail.modify`, que a conexão já pede para ler
os exames, também cobre o envio: não há consentimento novo a pedir para a
doutora.

Sem o Google conectado, ou conectado sem a permissão de e-mail, nada é
enviado e nada é anotado. Quando a doutora conectar, os aniversariantes do
dia recebem na próxima conferência.

A mensagem vai em duas versões, texto simples e HTML, para quem abre em
programa que não mostra HTML ler o mesmo conteúdo.

## O texto

> **Assunto:** Feliz aniversário, Maria!
>
> Olá, Maria!
>
> Hoje é o seu dia, e toda a equipe da Harmonia Orofacial quer desejar um
> feliz aniversário.
>
> Que o novo ano venha com muita saúde, motivos para sorrir e bons momentos
> ao lado de quem você ama.
>
> Agradecemos por confiar o seu sorriso a nós. É um prazer cuidar de você.
>
> Com carinho,
> Dra. Célia Lima
> Harmonia Orofacial · Clínica Odontológica
> (79) 99876-4880
>
> *Você recebe este e-mail porque autorizou receber novidades da clínica.
> Se preferir não receber mais, é só responder a esta mensagem.*

O primeiro nome sai como a pessoa digitou na ficha, com só a primeira letra
maiúscula ("MARIA" vira "Maria"). O nome entra no HTML escapado: texto do
paciente nunca vira marcação.

A última linha não é enfeite: é o caminho para o paciente sair da lista. Se
alguém responder pedindo para não receber, a clínica desmarca a autorização
de e-mail na ficha dele, e o próximo aniversário já não sai.

## Onde mexer

| o quê | onde |
|---|---|
| o texto e o visual do e-mail | `mensagemDeAniversario`, em `service/aniversarioService.js` |
| o horário de envio | `HORA_DE_COMECAR` e `HORA_DE_PARAR`, no mesmo arquivo |
| a assinatura, o telefone e o nome da clínica | `constants/clinica.js` |
| a função que envia pelo Gmail | `enviarEmail`, em `integracoes/google.js` |
| quem já recebeu este ano | tabela `aniversarios_enviados` |

## Testes

O teste de ponta a ponta confere, com o Gmail de mentira dos testes: que
quem aceitou recebe, com o assunto e o nome certos; que o segundo envio do
mesmo dia não sai; que quem desmarcou na ficha mais recente não recebe; e a
regra de 29 de fevereiro em ano comum e em ano bissexto.
