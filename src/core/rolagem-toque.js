/* ROLAGEM NO TOQUE: o celular segue o ritmo do site da AuronTech, que ele aprovou. Os trilhos dos videos em CSS
   (@media (any-hover: none) and (pointer: coarse)) tem os trechos das viagens de la (230vh a 340vh); os trechos
   presos de texto (letreiro, letras da clinica, cartoes) andam com 3/4 da rolagem do computador; os videos
   perseguem a rolagem com o mesmo freio macio de la (0,075 por quadro), sem pular quadros.
   any-hover: none, e nao hover: none: notebook com tela de toque diz que o ponteiro principal e o dedo, mas tem
   trackpad; ali a rolagem tem que continuar a lenta do computador (aconteceu no notebook dele). */
const TOQUE = "(any-hover: none) and (pointer: coarse)";

export const noToque = () => window.matchMedia(TOQUE).matches;

// quanto de rolagem cada trecho preso de texto pede, em relacao ao computador
export const FATOR_DO_TOQUE = 0.75;

export const rolagem = (telas) => (noToque() ? telas * FATOR_DO_TOQUE : telas);

// freio dos videos que perseguem a rolagem (fracao do que falta, por quadro): no toque, o do site da AuronTech
const FREIO_DO_TOQUE = 0.075;

export const freio = (fracao) => (noToque() ? FREIO_DO_TOQUE : fracao);

// atraso do scrub do GSAP, em segundos: igual ao do computador (pela metade, o texto pulava)
export const arrasto = (segundos) => segundos;
