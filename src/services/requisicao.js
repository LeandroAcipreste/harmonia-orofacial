/* O FORMULÁRIO DE REQUISIÇÃO, COMO ELE EXISTE NO PAPEL.

   A doutora indica clínicas de diagnóstico por imagem para os pacientes
   dela, e hoje preenche à mão o bloco de requisição da clínica. Este
   arquivo é a transcrição das duas faces desse bloco: o que está aqui é o
   que existe lá, na mesma ordem, com as mesmas palavras.

   A folha que o sistema imprime é da Harmonia, em papel timbrado, e a
   clínica de imagem aparece como destinatária. O sistema não reproduz
   material de marca de terceiro.

   Quem desenha a tela e a folha não sabe nada sobre exame: os dois leem
   BLOCOS e se viram. Exame novo no bloco de papel é linha nova aqui. */

export const LABORATORIOS = [
    {
        id: "oralbook-aracaju",
        nome: "OralBook Diagnóstico Bucal",
        unidade: "Unidade Aracaju",
        endereco: "Rua Cedro, 290, Treze de Julho",
        cidade: "Aracaju, SE, CEP 49020-170",
        telefone: "(79) 9.9674-8163",
        email: "oralbook.aju@outlook.com",
    },
    {
        id: "oralbook-lagarto",
        nome: "OralBook Diagnóstico Bucal",
        unidade: "Matriz Lagarto",
        endereco: "Av. Zacarias Júnior, 474, Centro",
        cidade: "Lagarto, SE, CEP 49400-000",
        telefone: "(79) 9.9950-2737",
        email: "oralbook@hotmail.com",
    },
    {
        id: "oralbook-itabaiana",
        nome: "OralBook Diagnóstico Bucal",
        unidade: "Unidade Itabaiana",
        endereco: "Rua General Siqueira, 287, Centro",
        cidade: "Itabaiana, SE, CEP 49500-229",
        telefone: "(79) 9.9851-1104",
        email: "oralbookitabaiana@outlook.com",
    },
];

/* Uma opção é uma caixa para marcar. Com `tipo: "texto"`, é uma linha para
   escrever (região, observação). `dentes: true` diz que aquele pedido usa
   os dentes assinalados no odontograma, e a folha os lista embaixo. */
export const BLOCOS = [
    {
        id: "intraBucais",
        titulo: "Exames intra-bucais",
        opcoes: [
            { id: "periapicais", rotulo: "Periapicais", dentes: true },
            { id: "bocaCompleta", rotulo: "Boca completa" },
            { id: "bocaCompletaInterproximais", rotulo: "Boca completa + interproximais" },
            { id: "oclusalMandibula", rotulo: "Oclusal · mandíbula" },
            { id: "oclusalMaxila", rotulo: "Oclusal · maxila" },
            { id: "interproximaisPreMolares", rotulo: "Interproximais (bite-wing) · pré-molares" },
            { id: "interproximaisMolares", rotulo: "Interproximais (bite-wing) · molares" },
            { id: "interproximaisDireito", rotulo: "Interproximais (bite-wing) · direito" },
            { id: "interproximaisEsquerdo", rotulo: "Interproximais (bite-wing) · esquerdo" },
        ],
    },
    {
        id: "extraBucais",
        titulo: "Exames extra-bucais",
        opcoes: [
            { id: "panoramica", rotulo: "Panorâmica" },
            { id: "teleLateral", rotulo: "Teleradiografia · lateral perfil" },
            { id: "teleFrontal", rotulo: "Teleradiografia · frontal (PA)" },
            { id: "atm", rotulo: "Outras radiografias · ATM" },
            { id: "maoEPunho", rotulo: "Outras radiografias · mão e punho" },
            { id: "seiosMaxilares", rotulo: "Outras radiografias · seios maxilares" },
        ],
    },
    {
        id: "tomografia",
        titulo: "Tomografia computadorizada em alta resolução",
        opcoes: [
            { id: "maxilaTotal", rotulo: "Maxila (total)" },
            { id: "mandibulaTotal", rotulo: "Mandíbula (total)" },
            { id: "tomografiaAtm", rotulo: "ATM" },
            { id: "maxilaRegiao", rotulo: "Maxila, região", tipo: "texto" },
            { id: "mandibulaRegiao", rotulo: "Mandíbula, região", tipo: "texto" },
            { id: "objetivoCirurgia", rotulo: "Objetivo · cirurgia e traumatologia" },
            { id: "objetivoPatologia", rotulo: "Objetivo · patologia" },
            { id: "objetivoImplante", rotulo: "Objetivo · implante" },
            { id: "objetivoEndodontia", rotulo: "Objetivo · endodontia" },
            { id: "objetivoDenteIncluso", rotulo: "Objetivo · dente incluso" },
            { id: "objetivoFratura", rotulo: "Objetivo · fratura ou alteração dentária" },
            { id: "tomografiaObservacao", rotulo: "Observação", tipo: "texto" },
        ],
    },
    {
        id: "documentacao",
        titulo: "Documentação ortodôntica",
        opcoes: [
            { id: "documentacaoDigital", rotulo: "Digital" },
            { id: "documentacaoImpressaResina", rotulo: "Impressa · resina" },
            { id: "documentacaoImpressaFilamento", rotulo: "Impressa · filamento" },
            {
                id: "comModelo",
                rotulo: "Documentação com modelo",
                nota: "panorâmica, teleradiografia lateral com traçado, 08 fotos, 02 periapicais de dentes anteriores, modelo",
            },
            {
                id: "semModelo",
                rotulo: "Documentação sem modelo",
                nota: "panorâmica, teleradiografia lateral com traçado, 08 fotos, 02 periapicais de dentes anteriores",
            },
            {
                id: "simplificada",
                rotulo: "Documentação simplificada",
                nota: "panorâmica, teleradiografia e 08 fotos",
            },
        ],
    },
    {
        id: "cefalometricas",
        titulo: "Análises cefalométricas computadorizadas",
        opcoes: [
            { id: "ricketts", rotulo: "Ricketts" },
            { id: "usp", rotulo: "USP" },
            { id: "macnamara", rotulo: "Macnamara" },
            { id: "tweed", rotulo: "Tweed" },
            { id: "downs", rotulo: "Downs" },
            { id: "steiner", rotulo: "Steiner" },
            { id: "bimier", rotulo: "Bimier" },
            { id: "petrovic", rotulo: "Petrovic" },
            { id: "cefalometricaOutra", rotulo: "Outra análise", tipo: "texto" },
        ],
    },
    {
        id: "fotografias",
        titulo: "Fotografias",
        opcoes: [
            {
                id: "intraOrais",
                rotulo: "Intra orais",
                nota: "frontal, lateral D/E, oclusal superior, oclusal inferior",
            },
            {
                id: "extraOrais",
                rotulo: "Extra orais",
                nota: "frontal normal, frontal sorrindo, perfil D/E",
            },
        ],
    },
    {
        id: "escaneamento",
        titulo: "Escaneamento",
        opcoes: [
            { id: "escaneamentoMaxila", rotulo: "Maxila" },
            { id: "escaneamentoMandibula", rotulo: "Mandíbula" },
            { id: "modeloResina", rotulo: "Modelo em resina" },
            { id: "modeloFilamento", rotulo: "Modelo em filamento" },
            { id: "modeloStl", rotulo: "Modelo STL (digital)" },
            { id: "modeloClareamento", rotulo: "Modelo para clareamento" },
            { id: "placaMiorrelaxante", rotulo: "Placa miorrelaxante" },
            { id: "invisalign", rotulo: "Invisalign" },
            { id: "prototipagemEstendida", rotulo: "Prototipagem · estendida" },
            { id: "prototipagemParcial", rotulo: "Prototipagem · parcial" },
            { id: "goteiraEstendida", rotulo: "Goteira cirúrgica · estendida" },
            { id: "goteiraParcial", rotulo: "Goteira cirúrgica · parcial" },
            { id: "escaneamentoObservacao", rotulo: "Observação", tipo: "texto" },
        ],
    },
    {
        id: "guiaCirurgico",
        titulo: "Guia cirúrgico",
        opcoes: [
            { id: "guiaMaxila", rotulo: "Maxila" },
            { id: "guiaMaxila1", rotulo: "Maxila · guia 1 furo" },
            { id: "guiaMaxila2", rotulo: "Maxila · guia 2 furos" },
            { id: "guiaMaxila3", rotulo: "Maxila · guia 3 furos" },
            { id: "guiaMaxila4", rotulo: "Maxila · guia 4 furos" },
            { id: "guiaMaxilaProtocolo", rotulo: "Maxila · protocolo" },
            { id: "guiaMandibula", rotulo: "Mandíbula" },
            { id: "guiaMandibula1", rotulo: "Mandíbula · guia 1 furo" },
            { id: "guiaMandibula2", rotulo: "Mandíbula · guia 2 furos" },
            { id: "guiaMandibula3", rotulo: "Mandíbula · guia 3 furos" },
            { id: "guiaMandibula4", rotulo: "Mandíbula · guia 4 furos" },
            { id: "guiaMandibulaProtocolo", rotulo: "Mandíbula · protocolo" },
            { id: "guiaObservacao", rotulo: "Observação", tipo: "texto" },
        ],
    },
];

const TODAS = BLOCOS.flatMap(({ opcoes }) => opcoes);

export const opcaoDe = (id) => TODAS.find((opcao) => opcao.id === id) || null;

export const laboratorioDe = (id) =>
    LABORATORIOS.find((lugar) => lugar.id === id) || LABORATORIOS[0];

/* O que a doutora marcou, na ordem do papel: a folha impressa e o resumo do
   histórico leem daqui, e nenhum dos dois precisa conhecer os ids. */
export const pedidosDe = (requisicao) =>
    BLOCOS.map(({ id, titulo, opcoes }) => ({
        id,
        titulo,
        itens: opcoes
            .map((opcao) => {
                const valor = (requisicao.pedidos || {})[opcao.id];

                if (!valor) {
                    return null;
                }

                return {
                    ...opcao,
                    valor: opcao.tipo === "texto" ? String(valor) : "",
                };
            })
            .filter(Boolean),
    })).filter(({ itens }) => itens.length);

/* Uma linha só, para caber na lista de emitidas: "Panorâmica, Periapicais
   e mais 3". */
export const resumoDe = (requisicao) => {
    const nomes = pedidosDe(requisicao).flatMap(({ itens }) =>
        itens.map(({ rotulo }) => rotulo),
    );

    if (!nomes.length) {
        return "Sem exames marcados";
    }

    const [primeiro, segundo, ...resto] = nomes;
    const inicio = segundo ? primeiro + ", " + segundo : primeiro;

    return resto.length ? inicio + " e mais " + resto.length : inicio;
};
