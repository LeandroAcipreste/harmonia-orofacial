/*
 * A preferência do sistema por menos movimento, lida num lugar só.
 *
 * Quem obedece a ela aqui é o movimento de ambiente: o preloader, a
 * cascata dos procedimentos, a cintilação e a correnteza das partículas
 * da dobra dos cards. São coisas que acontecem sozinhas, sem ninguém
 * pedir, e é justamente esse tipo de movimento que a preferência existe
 * para conter.
 *
 * A coreografia de rolagem — o recolhimento do letreiro, a leitura da
 * dobra da doutora, as letras da clínica — não passa por aqui, e a
 * ausência é deliberada. Aquilo não é enfeite: é a própria maneira como o
 * conteúdo se apresenta, e não acontece sozinho, acontece porque a pessoa
 * rolou. Contido, o que sobrava não era uma versão calma da dobra, era
 * uma dobra que parecia quebrada.
 *
 * Houve aqui, antes, uma chave que destravava a coreografia em localhost
 * para quem estivesse construindo o site. Ela existia porque a
 * coreografia obedecia à preferência; deixando de obedecer, a chave
 * perdeu a razão de ser e saiu.
 */

export const prefereMovimentoReduzido = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
