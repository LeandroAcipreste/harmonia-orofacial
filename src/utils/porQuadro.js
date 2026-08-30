/* Limita um tratador de evento a rodar uma vez por quadro. */

/*
 * Mouse de jogo dispara `pointermove` a 500 ou 1000 Hz, e a tela só
 * desenha a 60. Tudo que o tratador fizer além de um por quadro é
 * trabalho jogado fora — e quando esse trabalho é `getBoundingClientRect`
 * ou criar um tween, ele custa layout forçado e alocação, o que trava a
 * rolagem no mesmo quadro em que acontece.
 *
 * Guarda só o evento mais recente: os intermediários não interessam,
 * porque a posição que vale é a última.
 */
export const porQuadro = (tratador) => {
    let pendente = null;
    let agendado = false;

    const executar = () => {
        agendado = false;

        const evento = pendente;
        pendente = null;

        tratador(evento);
    };

    return (evento) => {
        pendente = evento;

        if (agendado) {
            return;
        }

        agendado = true;
        requestAnimationFrame(executar);
    };
};
