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
