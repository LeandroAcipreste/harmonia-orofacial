import { entrar, reenviarCodigo, verificar } from "../../src/services/sessao.js";
import { destinoDeVolta } from "../../src/services/guarda.js";

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

        const dados = new FormData(form);

        const saida = await entrar({
            email: dados.get("email"),
            senha: dados.get("senha"),
            lembrar: dados.get("lembrar"),
        });

        trancar(botao, false);

        if (!saida.ok) {
            mostrarAlerta(alerta, saida.erro);
            return;
        }

        if (saida.etapa === "verificacao") {
            abrirVerificacao(form, dados.get("email"));
            return;
        }

        location.assign(destinoDeVolta(saida.destino));
    });

    ligarVerificacao(form);

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

const abrirVerificacao = (formLogin, email) => {
    const formCodigo = document.querySelector("#codigo-form");
    const destino = document.querySelector("#codigo-destino");

    if (!formCodigo) {
        return;
    }

    if (destino && email) {
        destino.textContent = email;
    }

    formLogin.hidden = true;
    formCodigo.hidden = false;

    const campo = formCodigo.querySelector("#login-codigo");

    if (campo) {
        campo.value = "";
        campo.focus();
    }
};

const ligarVerificacao = (formLogin) => {
    const formCodigo = document.querySelector("#codigo-form");

    if (!formCodigo) {
        return;
    }

    const alerta = formCodigo.querySelector("#codigo-alerta");
    const botao = formCodigo.querySelector(".acesso__enviar");
    const campo = formCodigo.querySelector("#login-codigo");
    const erro = formCodigo.querySelector("#erro-codigo");

    campo.addEventListener("input", () => {
        campo.value = campo.value.replace(/\D/g, "").slice(0, 6);
        erro.textContent = "";
    });

    formCodigo.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (campo.value.length !== 6) {
            erro.textContent = "O código tem seis dígitos.";
            campo.focus();
            return;
        }

        esconderAlerta(alerta);
        trancar(botao, true);

        const saida = await verificar({ codigo: campo.value });

        trancar(botao, false);

        if (!saida.ok) {
            mostrarAlerta(alerta, saida.erro);
            campo.focus();
            return;
        }

        location.assign(destinoDeVolta(saida.destino));
    });

    const reenviar = formCodigo.querySelector("#codigo-reenviar");

    if (reenviar) {
        reenviar.addEventListener("click", async () => {
            trancar(reenviar, true);

            const saida = await reenviarCodigo();

            trancar(reenviar, false);
            mostrarAlerta(
                alerta,
                saida.ok ? "Enviamos um código novo." : "Não foi possível reenviar agora."
            );
        });
    }

    const voltar = formCodigo.querySelector("#codigo-voltar");

    if (voltar) {
        voltar.addEventListener("click", () => {
            formCodigo.hidden = true;
            formLogin.hidden = false;
            esconderAlerta(alerta);
        });
    }
};
