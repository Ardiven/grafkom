    function main() {
    var CANVAS = document.getElementById("mycanvas");

    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    // WEBGL CONTEXT
    /** @type {WebGLRenderingContext} */
    var GL;
    try {
        GL = CANVAS.getContext("webgl", { antialias: true });
    } catch (e) {
        alert ("WebGL context cannot be initialized");
        console.log(e);
        return false;
    }

    // SHADERS
    var shader_vertex_source = `
    attribute vec3 position;
    uniform mat4 Pmatrix, Vmatrix, Mmatrix;
    attribute vec3 color;
    varying vec3 vColor;

    void main(void) {
        gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);
        vColor = color;
    }`;

    var shader_fragment_source = `
    precision mediump float;
    varying vec3 vColor;

    void main(void) {
        gl_FragColor = vec4(vColor, 1.);
    }`;

    var compile_shader = function (source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    }
    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);

    GL.linkProgram(SHADER_PROGRAM);

    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");

    GL.enableVertexAttribArray(_position);
    GL.enableVertexAttribArray(_color);

    GL.useProgram(SHADER_PROGRAM);
    var uniform_color = GL.getUniformLocation(SHADER_PROGRAM, "uColor");

    var cube_vertex = [
        -1, -1, -1, 0, 0, 0,
        1, -1, -1, 1, 0, 0,
        1,  1, -1, 1, 1, 0,
        -1,  1, -1, 0, 1, 0,
        -1, -1,  1, 0, 0, 1,
        1, -1,  1, 1, 0, 1,
        1,  1,  1, 1, 1, 1,
        -1,  1,  1, 0, 1, 1
    ];

    var cube_faces = [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        0, 3, 7, 0, 4, 7,
        1, 2, 6, 1, 5, 6,
        2, 3, 6, 3, 7, 6,
        0, 1, 5, 0, 4, 5
    ];

    function createSphere(latBands, longBands, radius) {
        let vertices = [];
        let indices = [];

        for (let lat = 0; lat <= latBands; lat++) {
            let theta = lat * Math.PI / latBands;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= longBands; lon++) {
                let phi = lon * 2 * Math.PI / longBands;
                let sinPhi = Math.sin(phi);
                let cosPhi = Math.cos(phi);

                let x = radius * sinTheta * cosPhi;
                let y = radius * cosTheta;
                let z = radius * sinTheta * sinPhi;

                // warna sederhana: normalisasi posisi jadi warna
                let r = (x + 1) / 2;
                let g = (y + 1) / 2;
                let b = (z + 1) / 2;

                vertices.push(x, y, z, r, g, b);
            }
        }

        for (let lat = 0; lat < latBands; lat++) {
            for (let lon = 0; lon < longBands; lon++) {
                let first = (lat * (longBands + 1)) + lon;
                let second = first + longBands + 1;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
    }

    var sphere = createSphere(30, 30, 1.0);
    var CUBE_VERTEX = GL.createBuffer();
    // GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    // GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube_vertex), GL.STATIC_DRAW);

    var CUBE_FACES = GL.createBuffer();
    // GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    // GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_faces), GL.STATIC_DRAW);

    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, sphere.vertices, GL.STATIC_DRAW);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, sphere.indices, GL.STATIC_DRAW);

    var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

    var PROJMATRIX = LIBS.get_projection(45, CANVAS.width / CANVAS.height, 0.1, 100.0);
    var VIEWMATRIX = LIBS.get_I4();
    var MOVEMATRIX = LIBS.get_I4();

    zoom = -4.0;
    LIBS.translateZ(VIEWMATRIX, zoom);

    var THETA = 0, PHI = 0;
    var drag = false;
    var x_prev, y_prev;
    var FRICTION = 0.01;
    var dX = 0, dY = 0;

    var mouseDown = function (e) {
        drag = true;
        x_prev = e.pageX, y_prev = e.pageY;
        e.preventDefault();
        return false;
    };

    var mouseUp = function (e) {
        drag = false;
    };



    var mouseMove = function (e) {
        if (!drag) return false;
        dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
        THETA += dX;
        PHI += dY;
        x_prev = e.pageX, y_prev = e.pageY;
        e.preventDefault();
    };

    
    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);

    var SPEED = 0.06;

    var keyDown = function (e) {
        if (e.key === 'w') {
            dY -= SPEED;
        }
        else if (e.key === 'a') {
            dX -= SPEED;
        }
        else if (e.key === 's') {
            dY += SPEED;
        }
        else if (e.key === 'd') {
            dX += SPEED;
        }
        else if (e.key === 'q') {
            zoom += 0.05;
            LIBS.translateZ(VIEWMATRIX, 0.05);
        }
        else if (e.key === 'e') {
            zoom -= 0.05;
            LIBS.translateZ(VIEWMATRIX, -0.05);
        }
    };

    window.addEventListener("keydown", keyDown, false);




    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);

    var time_prev = 0;
    var animate = function (time) {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        var dt = time - time_prev;
        time_prev = time;

        // LIBS.rotateZ(MOVEMATRIX, dt * 0.001);
        // LIBS.rotateY(MOVEMATRIX, dt * 0.001);
        // LIBS.rotateX(MOVEMATRIX, dt * 0.001);

        LIBS.set_I4(MOVEMATRIX);
        LIBS.rotateY(MOVEMATRIX, THETA);
        LIBS.rotateX(MOVEMATRIX, PHI);

        // Tambahkan friction pada animate
    if (!drag) {
        dX *= (1 - FRICTION);
        dY *= (1 - FRICTION);
        THETA += dX;
        PHI += dY;
    }


        

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
        GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

        GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
        GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 4 * 3);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
        // GL.drawElements(GL.TRIANGLES, cube_faces.length, GL.UNSIGNED_SHORT, 0);
        GL.drawElements(GL.TRIANGLES, sphere.indices.length, GL.UNSIGNED_SHORT, 0);


        GL.flush();
        requestAnimationFrame(animate);
    };
    animate(0);

}
window.addEventListener('load', main);
