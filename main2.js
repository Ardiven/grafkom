function generateBezier(controlPoint, m) {
    var curves = [];
    var n = (controlPoint.length / 2) - 1; // degree = jumlah titik - 1

    function bernstein(i, n, t) {
        // Kombinasi binomial
        function C(n, k) {
            if (k === 0 || k === n) return 1;
            let res = 1;
            for (let j = 1; j <= k; j++) {
                res *= (n - (k - j));
                res /= j;
            }
            return res;
        }
        return C(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
    }

    for (var step = 0; step <= m; step++) {
        var t = step / m;
        var x = 0, y = 0;
        for (var i = 0; i <= n; i++) {
            var B = bernstein(i, n, t);
            x += controlPoint[i * 2] * B;
            y += controlPoint[i * 2 + 1] * B;
        }
        curves.push(x);
        curves.push(y);
    }
    return curves;
}

function main() {
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    /** @type {WebGLRenderingContext} */
    var GL = CANVAS.getContext("webgl", { antialias: true });

    var shader_vertex_source = `
        attribute vec2 position;
        void main(void) {
            gl_Position = vec4(position, 0., 1.);
            gl_PointSize = 10.0;
        }`;

    var shader_fragment_source = `
        precision mediump float;
        uniform vec3 uColor;
        void main(void) {
            gl_FragColor = vec4(uColor, 1.);
        }`;

    function compile_shader(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);
    GL.linkProgram(SHADER_PROGRAM);
    GL.useProgram(SHADER_PROGRAM);

    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_position);
    var uniform_color = GL.getUniformLocation(SHADER_PROGRAM, "uColor");

    // Titik kontrol Bézier
    var bezier_controlPoint = [
        -1.0, -1.0,
        -0.5,  1.0,
         0.5, -1.0,
         1.0,  1.0
    ];

    var CONTROL_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, CONTROL_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(bezier_controlPoint), GL.STATIC_DRAW);

    var bezier_vertex = generateBezier(bezier_controlPoint, 5);

    var CURVE_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, CURVE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(bezier_vertex), GL.STATIC_DRAW);

    GL.clearColor(0.0, 0.0, 0.0, 1.0);

    function animate() {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        // Gambar kurva Bézier
        GL.bindBuffer(GL.ARRAY_BUFFER, CURVE_VERTEX);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 0, 0);
        GL.uniform3f(uniform_color, 1, 1, 0);
        GL.drawArrays(GL.LINE_STRIP, 0, bezier_vertex.length / 2);

        // Gambar garis kontrol
        GL.bindBuffer(GL.ARRAY_BUFFER, CONTROL_VERTEX);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 0, 0);
        GL.uniform3f(uniform_color, 0, 1, 0);
        GL.drawArrays(GL.LINE_STRIP, 0, bezier_controlPoint.length / 2);

        // Gambar titik kontrol
        GL.uniform3f(uniform_color, 1, 0, 0);
        GL.drawArrays(GL.POINTS, 0, bezier_controlPoint.length / 2);

        requestAnimationFrame(animate);
    }
    animate();
}

window.addEventListener("load", main);
