/* ROLAGEM NO TOQUE: no celular e no tablet os trechos presos (abertura, letreiro, ponte, letras da clinica,
   estrela) andam com METADE da rolagem do computador, e os videos alcancam o dedo mais depressa. No computador a
   rolagem lenta continua como ele pediu. Os trilhos em CSS usam a mesma condicao (@media (any-hover: none) and
   (pointer: coarse)) com as alturas pela metade.
   any-hover: none, e nao hover: none: notebook com tela de toque diz que o ponteiro principal e o dedo, mas tem
   trackpad; ali a rolagem tem que continuar a lenta do computador (aconteceu no notebook dele). */
const TOQUE = "(any-hover: none) and (pointer: coarse)";

export const noToque = () => window.matchMedia(TOQUE).matches;

// quanto de rolagem cada trecho preso pede, em relacao ao computador
export const FATOR_DO_TOQUE = 0.5;

export const rolagem = (telas) => (noToque() ? telas * FATOR_DO_TOQUE : telas);

// freio dos videos que perseguem a rolagem (fracao do que falta, por quadro): no toque, o dobro
export const freio = (fracao) => (noToque() ? Math.min(0.3, fracao * 2) : fracao);

// atraso do scrub do GSAP, em segundos: no toque, a metade
export const arrasto = (segundos) => (noToque() ? segundos * FATOR_DO_TOQUE : segundos);
