import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { montarAvisoDeEstoque } from "../../src/components/aviso-estoque/aviso-estoque.js";
import {
    agentes,
    atualizarUsuario,
    chavesDoAgente,
    criarAgente,
    criarUsuario,
    emitirChave,
    enderecoDeConexaoDoGoogle,
    papeis,
    revogarChave,
    situacaoDoGoogle,
    usuarios,
} from "../../src/services/administracao.js";

const PERMISSAO = "usuarios.gerenciar";

const QUANDO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const comoData = (valor) => (valor ? QUANDO.format(new Date(valor)) : "");

const initAdministracao = (sessao) => {
    const conteudo = document.querySelector("#adm-conteudo");
    const semAcesso = document.querySelector("#adm-sem-acesso");
    const quem = document.querySelector("#erp-quem");

    if (quem && sessao.nome) {
        quem.textContent = sessao.nome;
    }

    document.querySelector("#erp-sair").addEventListener("click", async () => {
        await sair();

        location.replace("../login/login.html");
    });

    montarAvisoDeEstoque(sessao);

    if (!(sessao.permissoes || []).includes(PERMISSAO)) {
        semAcesso.hidden = false;
        return;
    }

    conteudo.hidden = false;

    const erro = document.querySelector("#adm-erro");

    const avisar = (recado) => {
        erro.textContent = recado;
        erro.hidden = !recado;
    };

    /* A CHAVE, QUE APARECE UMA VEZ SÓ

       Não existe "ver de novo": o servidor guarda o sha256 dela. Por isso a
       janela é grande, com botão de copiar, e diz isso em voz alta. Quem
       fechar sem copiar emite outra, que custa um clique. */

    const janela = document.querySelector("#adm-chave");
    const valorDaChave = document.querySelector("#chave-valor");
    const botaoCopiar = document.querySelector("#chave-copiar");

    const mostrarChave = (chave) => {
        valorDaChave.textContent = chave;
        botaoCopiar.textContent = "Copiar";
        janela.showModal();
    };

    botaoCopiar.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(valorDaChave.textContent);
            botaoCopiar.textContent = "Copiado";
        } catch (falha) {
            /* Sem permissão de área de transferência, o jeito é selecionar
               na mão: a chave está visível na tela, que é o que importa. */
            botaoCopiar.textContent = "Selecione e copie";
        }
    });

    document.querySelector("#chave-fechar").addEventListener("click", () => {
        valorDaChave.textContent = "";
        janela.close();
    });

    /* OS AGENTES */

    const listaDeAgentes = document.querySelector("#adm-agentes");
    const semAgente = document.querySelector("#adm-sem-agente");
    const modeloAgente = document.querySelector("#modelo-agente");
    const modeloChave = document.querySelector("#modelo-chave");
    const avisoAgente = document.querySelector("#adm-agente-aviso");

    const montarChaves = (destino, chaves) => {
        destino.textContent = "";

        chaves.forEach((chave) => {
            const linha = modeloChave.content.firstElementChild.cloneNode(true);
            const revogar = linha.querySelector(".chave-linha__revogar");

            linha.querySelector(".chave-linha__prefixo").textContent = chave.prefixo + "…";

            const datas = ["criada em " + comoData(chave.criadaEm)];

            datas.push(chave.usadaEm ? "usada em " + comoData(chave.usadaEm) : "nunca usada");

            if (chave.revogadaEm) {
                datas.push("revogada em " + comoData(chave.revogadaEm));
            }

            linha.querySelector(".chave-linha__datas").textContent = datas.join("  ·  ");
            linha.classList.toggle("esta-revogada", Boolean(chave.revogadaEm));

            if (chave.revogadaEm) {
                revogar.remove();
            } else {
                revogar.addEventListener("click", async () => {
                    avisar("");

                    try {
                        await revogarChave(chave.id);
                        await carregarAgentes();
                    } catch (falha) {
                        avisar(falha.message);
                    }
                });
            }

            destino.appendChild(linha);
        });
    };

    const carregarAgentes = async () => {
        const { agentes: lista } = await agentes();

        listaDeAgentes.textContent = "";
        semAgente.hidden = lista.length > 0;

        for (const agente of lista) {
            const item = modeloAgente.content.firstElementChild.cloneNode(true);
            const desligar = item.querySelector("[data-desligar]");
            const emitir = item.querySelector("[data-emitir]");

            item.querySelector(".agente__nome").textContent = agente.nome;
            item.querySelector(".agente__situacao").textContent = agente.ativo
                ? "ligado"
                : "desligado";
            item.classList.toggle("esta-desligado", !agente.ativo);

            const { chaves } = await chavesDoAgente(agente.id);

            montarChaves(item.querySelector(".agente__chaves"), chaves);

            desligar.textContent = agente.ativo ? "Desligar agente" : "Ligar agente";
            desligar.classList.toggle("adm__acao--perigo", agente.ativo);

            desligar.addEventListener("click", async () => {
                avisar("");

                try {
                    await atualizarUsuario(agente.id, { ativo: !agente.ativo });
                    await carregarAgentes();
                } catch (falha) {
                    avisar(falha.message);
                }
            });

            emitir.addEventListener("click", async () => {
                avisar("");

                try {
                    const { chave } = await emitirChave(agente.id);

                    mostrarChave(chave);
                    await carregarAgentes();
                } catch (falha) {
                    avisar(falha.message);
                }
            });

            listaDeAgentes.appendChild(item);
        }
    };

    document.querySelector("#adm-agente-form").addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nome = document.querySelector("#agente-nome").value.trim();

        if (!nome) {
            avisoAgente.textContent = "Dê um nome ao agente, para reconhecê-lo no histórico.";
            avisoAgente.classList.add("esta-errado");
            return;
        }

        avisoAgente.classList.remove("esta-errado");
        avisoAgente.textContent = "Criando…";

        try {
            const { chave } = await criarAgente(nome);

            document.querySelector("#agente-nome").value = "";
            avisoAgente.textContent = "Agente criado.";

            mostrarChave(chave);
            await carregarAgentes();
        } catch (falha) {
            avisoAgente.textContent = falha.message;
            avisoAgente.classList.add("esta-errado");
        }
    });

    /* AS PESSOAS */

    const listaDePessoas = document.querySelector("#adm-pessoas");
    const modeloPessoa = document.querySelector("#modelo-pessoa");
    const escolhaDePapel = document.querySelector("#pessoa-papel");
    const avisoPessoa = document.querySelector("#adm-pessoa-aviso");

    let nomeDoPapel = new Map();

    const carregarPessoas = async () => {
        const { usuarios: lista } = await usuarios();

        listaDePessoas.textContent = "";

        lista
            .filter((usuario) => usuario.tipo === "pessoa")
            .forEach((usuario) => {
                const item = modeloPessoa.content.firstElementChild.cloneNode(true);
                const alternar = item.querySelector(".pessoa__alternar");

                item.querySelector(".pessoa__nome").textContent = usuario.nome;
                item.querySelector(".pessoa__detalhe").textContent = [
                    usuario.email,
                    usuario.papeis.map((papel) => nomeDoPapel.get(papel) || papel).join(", "),
                    usuario.ativo ? "" : "desativada",
                ]
                    .filter(Boolean)
                    .join("  ·  ");

                item.classList.toggle("esta-desligado", !usuario.ativo);

                alternar.textContent = usuario.ativo ? "Desativar" : "Reativar";

                alternar.addEventListener("click", async () => {
                    avisar("");

                    try {
                        await atualizarUsuario(usuario.id, { ativo: !usuario.ativo });
                        await carregarPessoas();
                    } catch (falha) {
                        avisar(falha.message);
                    }
                });

                listaDePessoas.appendChild(item);
            });
    };

    const carregarPapeis = async () => {
        const { papeis: lista } = await papeis();

        nomeDoPapel = new Map(lista.map((papel) => [papel.codigo, papel.nome]));

        escolhaDePapel.textContent = "";

        /* O papel 'agente' não entra na lista: agente não é gente, e se cria
           no bloco de cima, que já devolve a chave. */
        lista
            .filter((papel) => papel.codigo !== "agente")
            .forEach((papel) => {
                const opcao = document.createElement("option");

                opcao.value = papel.codigo;
                opcao.textContent = papel.nome;
                opcao.title = papel.descricao;

                escolhaDePapel.appendChild(opcao);
            });
    };

    document.querySelector("#adm-pessoa-form").addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nome = document.querySelector("#pessoa-nome").value.trim();
        const email = document.querySelector("#pessoa-email").value.trim();
        const senha = document.querySelector("#pessoa-senha").value;

        if (!nome || !email || !senha) {
            avisoPessoa.textContent = "Nome, e-mail e senha inicial são obrigatórios.";
            avisoPessoa.classList.add("esta-errado");
            return;
        }

        avisoPessoa.classList.remove("esta-errado");
        avisoPessoa.textContent = "Cadastrando…";

        try {
            await criarUsuario({ nome, email, senha, papeis: [escolhaDePapel.value] });

            document.querySelector("#adm-pessoa-form").reset();
            avisoPessoa.textContent = "Pessoa cadastrada. Peça para ela trocar a senha no primeiro acesso.";

            await carregarPessoas();
        } catch (falha) {
            avisoPessoa.textContent = falha.message;
            avisoPessoa.classList.add("esta-errado");
        }
    });

    /* O GOOGLE */

    const situacao = document.querySelector("#google-situacao");
    const detalhe = document.querySelector("#google-detalhe");
    const conectar = document.querySelector("#google-conectar");

    const carregarGoogle = async () => {
        const google = await situacaoDoGoogle();

        if (!google.ligado) {
            situacao.textContent = "Integração desligada";
            detalhe.textContent =
                "A agenda funciona com data e turno preferidos, e os exames não são lidos do e-mail.";
            return;
        }

        situacao.textContent = google.conectada
            ? google.respondendo
                ? "Conectada e respondendo"
                : "Conectada, mas o Google não respondeu"
            : "Não conectada";

        detalhe.textContent = google.conectada
            ? [
                  google.conta,
                  "conectada em " + comoData(google.conectadaEm),
                  google.email ? "com leitura de e-mail" : "sem leitura de e-mail",
              ]
                  .filter(Boolean)
                  .join("  ·  ")
            : "Conecte para publicar horários livres e receber exames por e-mail.";

        conectar.hidden = google.conectada && google.respondendo;
        conectar.href = enderecoDeConexaoDoGoogle();
    };

    const carregar = async () => {
        avisar("");

        try {
            await carregarPapeis();
            await carregarPessoas();
            await carregarAgentes();
            await carregarGoogle();
        } catch (falha) {
            avisar(falha.message);
        }
    };

    carregar();
};

/* Chamado pelo main.js, que descobre a página pelo data-pagina do body. */
export const init = () =>
    exigirSessao().then((sessao) => {
        if (sessao) {
            initAdministracao(sessao);
        }
    });
