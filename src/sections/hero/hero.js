/* Hero: canvas WebGL, comportamento e animações, em um arquivo só. */

const ENTRADA = {
    duracao: 1.2,
    stagger: 0.14,
    atraso: 0.25,
    deslocamento: 40,
    desfoque: 12,
};

const CURSOR = {
    raioDeIma: 0.33,
    inclinacaoPerto: 16,
    inclinacaoLonge: 8,
    deslocamentoX: 280,
    deslocamentoY: 200,
};

const FLASHLIGHT_ALCANCE = 220;

const QUANTIDADE_PARTICULAS = 1400;
const PIXEL_RATIO_MAXIMO = 2;

const OPCOES_GL = { alpha: true, premultipliedAlpha: false };

/* Mesmo renderizador, apenas tentando os nomes de contexto em ordem: há
   máquina que nega "webgl" e entrega "webgl2" ou o nome experimental. */
const NOMES_DE_CONTEXTO = ["webgl2", "webgl", "experimental-webgl"];

const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    initHeroCanvas();

    if (typeof gsap === "undefined") {
        return;
    }

    const medalhao = hero.querySelector(".hero__medalhao");

    animarEntrada(hero);
    ligarFlashlight(medalhao);
    ligarAtracaoDoCursor(medalhao);

    if (prefereMovimentoReduzido || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    animarFundo();
    animarNaRolagem(hero, medalhao);
};

/* Canvas WebGL: gradiente em malha e nuvem de partículas */

const obterContexto = (canvas) => {
    for (var i = 0; i < NOMES_DE_CONTEXTO.length; i++) {
        var contexto = canvas.getContext(NOMES_DE_CONTEXTO[i], OPCOES_GL);

        if (contexto) {
            return contexto;
        }
    }

    return null;
};

/*
 * O loop de render não abre um requestAnimationFrame próprio: quando o
 * GSAP está presente ele entra no ticker, que já é o relógio do Lenis.
 * Dois loops independentes para a mesma página disputariam o mesmo
 * quadro sem necessidade.
 */
const agendarQuadro = (callback) => {
    if (typeof gsap !== "undefined") {
        gsap.ticker.add(() => callback(performance.now()));
        return;
    }

    const laco = (agora) => {
        callback(agora);
        requestAnimationFrame(laco);
    };

    requestAnimationFrame(laco);
};

/* Shaders e constantes vêm do site de referência, sem alteração. */
const initHeroCanvas = () => {
    var canvas = document.getElementById("hero-gl");
    if (!canvas) return;
    var gl = obterContexto(canvas);
    if (!gl) {
      console.error("[hero] nenhum contexto WebGL disponível neste navegador");
      return;
    }
    function resize() {
      var d = Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAXIMO);
      canvas.width = canvas.clientWidth * d;
      canvas.height = canvas.clientHeight * d;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resize);
    resize();
    function sh(t, s) {
      var o = gl.createShader(t);
      gl.shaderSource(o, s);
      gl.compileShader(o);
      return o;
    }
    function prog(v, f) {
      var p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, v));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f));
      gl.linkProgram(p);
      return p;
    }
    /* mesh gradient shader */
    var gp = prog(
      "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}",
      "precision mediump float;uniform vec2 r;uniform float t;" +
        "void main(){vec2 uv=gl_FragCoord.xy/r;" +
        "vec2 c1=vec2(.28+.14*sin(t*.31),.62+.12*cos(t*.42));" +
        "vec2 c2=vec2(.74+.12*cos(t*.24),.34+.14*sin(t*.37));" +
        "vec2 c3=vec2(.5+.2*sin(t*.19+2.),.5+.18*sin(t*.28+1.));" +
        "float d1=exp(-3.2*length(uv-c1));float d2=exp(-3.2*length(uv-c2));float d3=exp(-3.8*length(uv-c3));" +
        "vec3 col=vec3(.13,.25,.78)*d1+vec3(.04,.5,.6)*d2+vec3(.98,.55,.25)*d3*.5;" +
        "float a=clamp((d1+d2+d3)*.5,0.,.75);gl_FragColor=vec4(col,a);}"
    );
    /* particle shader */
    var pp = prog(
      "attribute vec2 a;attribute float s;varying float vs;void main(){vs=s;gl_Position=vec4(a,0.,1.);gl_PointSize=s;}",
      "precision mediump float;varying float vs;" +
        "void main(){vec2 d=gl_PointCoord-vec2(.5);float m=smoothstep(.5,.08,length(d));" +
        "vec3 c=mix(vec3(.55,.7,1.),vec3(1.,.78,.45),step(3.2,vs));" +
        "gl_FragColor=vec4(c*m,m*.9);}"
    );
    var qb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    /* attractor follows the cursor (defaults to center) */
    var mx = 0,
      my = 0;
    window.addEventListener("mousemove", function (e) {
      var b = canvas.getBoundingClientRect();
      mx = ((e.clientX - b.left) / b.width) * 2 - 1;
      my = -(((e.clientY - b.top) / b.height) * 2 - 1);
    });
    var N = QUANTIDADE_PARTICULAS,
      pos = new Float32Array(N * 2),
      vel = new Float32Array(N * 2),
      siz = new Float32Array(N);
    /* spawn particles spread across the whole hero */
    function spawn(i) {
      pos[2 * i] = Math.random() * 2 - 1;
      pos[2 * i + 1] = Math.random() * 2 - 1;
      vel[2 * i] = 0;
      vel[2 * i + 1] = 0;
      siz[i] = 1.5 + Math.random() * 3.5;
    }
    for (var i = 0; i < N; i++) {
      spawn(i);
    }
    var pb = gl.createBuffer(),
      sb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sb);
    gl.bufferData(gl.ARRAY_BUFFER, siz, gl.STATIC_DRAW);
    var t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000,
        dt = 0.016;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(gp);
      gl.bindBuffer(gl.ARRAY_BUFFER, qb);
      var lp = gl.getAttribLocation(gp, "p");
      gl.enableVertexAttribArray(lp);
      gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(gp, "r"), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(gp, "t"), t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      for (var i = 0; i < N; i++) {
        var dx = mx - pos[2 * i],
          dy = my - pos[2 * i + 1],
          d = Math.sqrt(dx * dx + dy * dy) + 1e-4;
        var f = 0.6 / (d + 0.08);
        vel[2 * i] += ((dx / d) * f - (dy / d) * f * 0.35) * dt;
        vel[2 * i + 1] += ((dy / d) * f + (dx / d) * f * 0.35) * dt;
        vel[2 * i] *= 0.99;
        vel[2 * i + 1] *= 0.99;
        pos[2 * i] += vel[2 * i] * dt;
        pos[2 * i + 1] += vel[2 * i + 1] * dt;
        if (d < 0.06) spawn(i);
      }
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(pp);
      gl.bindBuffer(gl.ARRAY_BUFFER, pb);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
      var la = gl.getAttribLocation(pp, "a");
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, sb);
      var ls = gl.getAttribLocation(pp, "s");
      gl.enableVertexAttribArray(ls);
      gl.vertexAttribPointer(ls, 1, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, N);
    }

    agendarQuadro(frame);
};

/* Animações */

const animarEntrada = (hero) => {
    gsap.fromTo(
        hero.querySelectorAll(".hero-el"),
        { opacity: 0, y: ENTRADA.deslocamento, filter: `blur(${ENTRADA.desfoque}px)` },
        {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: ENTRADA.duracao,
            stagger: ENTRADA.stagger,
            ease: "power3.out",
            delay: ENTRADA.atraso,
        }
    );
};

const animarFundo = () => {
    const trilho = { trigger: document.body, start: "top top", end: "bottom bottom" };

    gsap.to(".fundo__brilhos", { yPercent: -18, ease: "none", scrollTrigger: { ...trilho, scrub: 1.2 } });
    gsap.to(".fundo__estrelas", { yPercent: -35, ease: "none", scrollTrigger: { ...trilho, scrub: 0.8 } });
};

const animarNaRolagem = (hero, medalhao) => {
    gsap.to(medalhao, {
        yPercent: 30,
        rotate: 25,
        scale: 0.85,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
    });

    gsap.to(hero, {
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true },
    });

    gsap.to(medalhao, { y: "-=14", duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
};

/* Borda cônica que acende conforme o cursor se aproxima da peça. */
const ligarFlashlight = (medalhao) => {
    window.addEventListener("pointermove", (evento) => {
        const caixa = medalhao.getBoundingClientRect();
        const dx = evento.clientX - (caixa.left + caixa.width / 2);
        const dy = evento.clientY - (caixa.top + caixa.height / 2);
        const angulo = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const distancia = Math.hypot(dx, dy);
        const borda = Math.hypot(caixa.width / 2, caixa.height / 2);
        const proximidade = Math.max(0, 1 - Math.abs(distancia - borda) / FLASHLIGHT_ALCANCE);

        medalhao.style.setProperty("--cursor-angle", `${angulo}deg`);
        medalhao.style.setProperty("--proximity", proximidade.toFixed(3));
    });
};

/*
 * Perto do centro a logomarca é atraída pelo cursor; longe, volta ao
 * lugar com elástica.
 *
 * Este é o único movimento do hero que não é barrado por
 * `prefers-reduced-motion`: ele não roda sozinho, só responde ao gesto de
 * quem está com a mão no mouse. O movimento automático segue barrado em
 * `animarNaRolagem`.
 */
const ligarAtracaoDoCursor = (medalhao) => {
    window.addEventListener("mousemove", (evento) => {
        const px = evento.clientX / window.innerWidth - 0.5;
        const py = evento.clientY / window.innerHeight - 0.5;
        const perto = Math.hypot(px, py) < CURSOR.raioDeIma;

        gsap.to(medalhao, {
            rotationY: px * (perto ? CURSOR.inclinacaoPerto : CURSOR.inclinacaoLonge),
            rotationX: -py * (perto ? CURSOR.inclinacaoPerto : CURSOR.inclinacaoLonge),
            x: perto ? px * CURSOR.deslocamentoX : 0,
            y: perto ? py * CURSOR.deslocamentoY : 0,
            duration: perto ? 0.8 : 1.4,
            ease: perto ? "power3.out" : "elastic.out(1, 0.35)",
            overwrite: "auto",
        });
    });
};
