/*
 * Entrar.
 *
 * Ainda não existe back-end. Quando existir, só duas coisas mudam aqui:
 * `ENDPOINT`, para onde as credenciais são enviadas, e `DESTINO`, a página
 * aberta depois que a sessão é criada. Sem JavaScript o formulário faz um
 * POST comum para o mesmo endereço do atributo `action`.
 */

const ENDPOINT = "/api/sessao";
const DESTINO = "/";

const MIN_SENHA = 8;

/* Aceita "nome@dominio.br". Validação de e-mail no cliente serve para
   pegar erro de digitação, não para decidir se o endereço existe. */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MENSAGENS = {
    emailVazio: "Informe seu e-mail.",
    emailInvalido: "Esse endereço está incompleto. Confira antes de entrar.",
    senhaVazia: "Digite sua senha.",
    senhaCurta: `A senha tem no mínimo ${MIN_SENHA} caracteres.`,
    credenciais: "E-mail ou senha não conferem.",
    servidor: "Não foi possível entrar agora. Tente de novo em instantes.",
    conexao: "A conexão falhou. Verifique a internet e tente de novo.",
};

const REGRAS = {
    email: (valor) => {
        if (!valor) {
            return MENSAGENS.emailVazio;
        }

        return FORMATO_EMAIL.test(valor) ? "" : MENSAGENS.emailInvalido;
    },

    senha: (valor) => {
        if (!valor) {
            return MENSAGENS.senhaVazia;
        }

        return valor.length >= MIN_SENHA ? "" : MENSAGENS.senhaCurta;
    },
};

const initLogin = () => {
    const form = document.querySelector("#login-form");

    if (!form) {
        return;
    }

    const pagina = document.querySelector(".acesso");
    const alerta = form.querySelector("#login-alerta");
    const botao = form.querySelector(".acesso__enviar");
    const campos = montarCampos(form);

    /* Enquanto ninguém tentou enviar, o erro fica calado: apontar falha em
       campo que a pessoa ainda está preenchendo só atrapalha. */
    let jaTentou = false;

    const atualizar = () => {
        if (jaTentou) {
            campos.forEach(marcarCampo);
        }

        mostrarProgresso(pagina, campos);
    };

    campos.forEach(({ input }) => {
        input.addEventListener("input", atualizar);
        input.addEventListener("blur", atualizar);
    });

    ligarOlho(form);

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        jaTentou = true;
        campos.forEach(marcarCampo);
        mostrarProgresso(pagina, campos);

        const invalido = campos.find((campo) => campo.erro());

        if (invalido) {
            esconderAlerta(alerta);
            invalido.input.focus();
            return;
        }

        esconderAlerta(alerta);
        trancar(botao, true);

        const recado = await autenticar(new FormData(form));

        trancar(botao, false);

        if (!recado) {
            return;
        }

        mostrarAlerta(alerta, recado);
    });

    mostrarProgresso(pagina, campos);
    animarEntrada();
};

/* Cada campo vira um objeto pequeno: o input, o parágrafo de erro e a
   regra que sabe julgá-lo. O resto do módulo não precisa saber mais nada. */
const montarCampos = (form) =>
    Object.keys(REGRAS)
        .map((nome) => {
            const input = form.querySelector(`[name="${nome}"]`);

            if (!input) {
                return null;
            }

            return {
                input,
                bloco: input.closest(".campo"),
                aviso: form.querySelector(`#erro-${nome}`),
                erro: () => REGRAS[nome](input.value.trim()),
            };
        })
        .filter(Boolean);

const marcarCampo = ({ input, bloco, aviso, erro }) => {
    const mensagem = erro();

    bloco.classList.toggle("is-invalido", Boolean(mensagem));
    input.setAttribute("aria-invalid", String(Boolean(mensagem)));
    aviso.textContent = mensagem;
};

/*
 * O feixe entre as duas colunas mede quanto do formulário já está pronto.
 * O CSS faz o desenho; daqui sai só o número de 0 a 1.
 */
const mostrarProgresso = (pagina, campos) => {
    if (!pagina) {
        return;
    }

    const prontos = campos.filter((campo) => !campo.erro()).length;

    pagina.style.setProperty("--progresso", (prontos / campos.length).toFixed(3));
};

const ligarOlho = (form) => {
    const botao = form.querySelector("[data-olho]");
    const senha = form.querySelector('[name="senha"]');

    if (!botao || !senha) {
        return;
    }

    botao.addEventListener("click", () => {
        const visivel = senha.type === "password";

        senha.type = visivel ? "text" : "password";
        botao.setAttribute("aria-pressed", String(visivel));
        botao.setAttribute("aria-label", visivel ? "Ocultar senha" : "Mostrar senha");
        senha.focus();
    });
};

const trancar = (botao, ocupado) => {
    botao.classList.toggle("is-enviando", ocupado);
    botao.disabled = ocupado;
};

/*
 * Devolve a mensagem a exibir, ou string vazia quando a sessão foi criada
 * e a navegação já está a caminho de `DESTINO`.
 */
const autenticar = async (dados) => {
    try {
        const resposta = await fetch(ENDPOINT, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: dados,
        });

        if (resposta.ok) {
            window.location.assign(DESTINO);
            return "";
        }

        return resposta.status === 401 ? MENSAGENS.credenciais : MENSAGENS.servidor;
    } catch {
        return MENSAGENS.conexao;
    }
};

const mostrarAlerta = (alerta, texto) => {
    alerta.textContent = texto;
    alerta.hidden = false;
};

const esconderAlerta = (alerta) => {
    alerta.hidden = true;
    alerta.textContent = "";
};

/* Entrada em cascata. É enfeite: se o GSAP não carregar, ou se a pessoa
   pediu menos movimento, a página já nasce legível pelo CSS. */
const animarEntrada = () => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduzido || typeof gsap === "undefined") {
        return;
    }

    const linha = gsap.timeline({ defaults: { ease: "power3.out" } });

    linha
        .from(".acesso__cartao", { y: 24, opacity: 0, duration: 0.9 })
        .from(".acesso-el", { y: 16, opacity: 0, duration: 0.7, stagger: 0.06 }, "-=0.55")
        .from(".trilho", { opacity: 0, duration: 0.8 }, "-=0.6");
};

initLogin();
