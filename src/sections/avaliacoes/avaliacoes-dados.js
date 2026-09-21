/* AS AVALIAÇÕES DO GOOGLE

   Cópia fiel do que os pacientes escreveram no perfil da clínica no
   Google. Só se acerta digitação óbvia (caixa alta, acento, espaço depois
   da vírgula, "exelente"); nenhuma palavra é trocada nem acrescentada.

   Avaliação longa demais para o card entra por trechos literais, com […]
   marcando cada corte. Trecho, sim; resumo, nunca: o que está entre as
   marcas é exatamente o que o paciente escreveu.

   Enquanto a lista estiver vazia, a seção inteira fica escondida: a home
   nunca vai ao ar com card de exemplo.

   Cada item:
     nome    como aparece no Google; a tela mostra "Maria S.", não o
             sobrenome inteiro
     quando  como o Google mostra: "2 meses atrás"; vazio se o print não
             trouxe a data
     texto   o texto da avaliação

   A ordem é a da tela: as que contam o procedimento vêm primeiro, porque
   são as que mais ajudam quem ainda não conhece a clínica a decidir. */

export const RESUMO = {
    nota: "5,0",
    total: 61,
};

export const AVALIACOES = [
    {
        nome: "Caio Emanuel",
        quando: "2 meses atrás",
        texto:
            "Faço meu tratamento ortodôntico nessa clínica há um bom tempo e só tenho elogios. […] " +
            "Meus dentes alinharam muito bem e consigo ver claramente o progresso a cada manutenção, " +
            "o que me deixa muito satisfeito e confiante no trabalho realizado. […] " +
            "Recomendo essa clínica de olhos fechados para quem procura um tratamento odontológico " +
            "de qualidade, com excelentes profissionais e um atendimento verdadeiramente humanizado.",
    },
    {
        nome: "Leo Acipreste",
        quando: "",
        texto:
            "Atendimento impecável desde o primeiro contato pelo WhatsApp, a doutora Célia é uma " +
            "excelente profissional, foi o melhor procedimento de restauração com resina no meu dente " +
            "da frente que um dentista já realizou e também fiz com ela a placa de bruxismo. " +
            "A Dra. é maravilhosa!!",
    },
    {
        nome: "Diego Silva",
        quando: "um mês atrás",
        texto:
            "Quero agradecer à Dra. Célia pelo excelente atendimento. Fui muito bem recebido desde a " +
            "recepção e fiquei muito satisfeito com todo o cuidado, atenção e profissionalismo durante " +
            "a limpeza e a manutenção. A clínica é organizada, e toda a equipe está de parabéns pelo " +
            "atendimento. Recomendo de olhos fechados para quem procura um serviço de qualidade. " +
            "Muito obrigado à Dra. Célia e a toda a equipe!",
    },
    {
        nome: "Guilherme Lopes",
        quando: "2 meses atrás",
        texto:
            "Faço a manutenção do meu aparelho com a Dra. Célia e estou muito satisfeito com o " +
            "atendimento. Ela é uma excelente profissional, sempre muito atenciosa, cuidadosa e " +
            "paciente para esclarecer dúvidas. […] Estou muito satisfeito com o acompanhamento do meu " +
            "tratamento ortodôntico e recomendo a clínica para quem busca um atendimento de qualidade.",
    },
    {
        nome: "Rachel Santos",
        quando: "2 meses atrás",
        texto:
            "Excelente clínica! Ambiente bonito, organizado e muito acolhedor. A Dra. Célia é uma " +
            "profissional extremamente competente, atenciosa e cuidadosa, explica tudo com clareza e " +
            "transmite muita segurança. O atendimento é impecável. Recomendo a clínica sem dúvidas.",
    },
    {
        nome: "Sendy Micaelly",
        quando: "2 meses atrás",
        texto:
            "Existem profissionais que exercem uma profissão com excelência, e existem aqueles que, " +
            "além da competência, transformam vidas com o coração. Você é exatamente essa pessoa. […]",
    },
    {
        nome: "Jamilly Macedo",
        quando: "2 meses atrás",
        texto:
            "Já faço tratamento há anos e eu nunca tive um atendimento tão excelente, um resultado tão " +
            "incrível como estou tendo com a Dra., são maravilhosos, atenciosos e muito profissionais!",
    },
    {
        nome: "Joana Lino",
        quando: "2 meses atrás",
        texto:
            "Fui muito bem atendida! A equipe foi muito atenciosa, educada e prestativa desde o " +
            "primeiro contato. Tiraram minhas dúvidas com paciência e o atendimento foi excelente. " +
            "Recomendo!",
    },
    {
        nome: "Buffalos Steak",
        quando: "2 meses atrás",
        texto:
            "Clínica excelente, atendimento direto e muito prático. O atendimento com a Dra. Célia " +
            "muito prestativo, tudo muito claro com explicações claras sobre cada procedimento.",
    },
    {
        nome: "Marcinho Hunb",
        quando: "2 meses atrás",
        texto:
            "Super indico essa clínica, doutora Célia muito atenciosa, tem preço popular, amei o " +
            "procedimento, com total transparência.",
    },
];
