/* Canvas WebGL do hero: gradiente em malha e nuvem de partículas. */

const QUANTIDADE_PARTICULAS = 1400;
const PIXEL_RATIO_MAXIMO = 2;

/*
 * Shaders e constantes vêm do site de referência, sem alteração.
 *
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

export const initHeroCanvas = () => {
    var canvas = document.getElementById("hero-gl");
    if (!canvas) return;
    var gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
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
