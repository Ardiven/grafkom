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
    attribute vec2 position;
    attribute vec3 color;
    varying vec3 vColor;
   
    void main(void) {
        gl_Position = vec4(position, 0., 1.);
        gl_PointSize = 20.0;
        vColor = color;
    }`;

    var shader_fragment_source = `
    precision mediump float;
    // uniform vec3 uColor;
    varying vec3 vColor;
   
    void main(void) {
        // gl_FragColor = vec4(uColor, 1.);
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

    // POINTS
    var triangle_vertex = [
        -0.7, -0.8, 1, 0, 0,
        -0.7, 0.1, 1, 0, 0, 
        -0.1, 0.1, 1, 0, 0, 
        -0.1, -0.8, 1, 0, 0, 

        -0.6,-0.8,1,1,1,
        -0.6,-0.4,1,1,1,
        -0.2,-0.4,1,1,1,
        -0.2,-0.8,1,1,1,

        -0.8,0.1,1,1,1,
        -0.4,1,1,1,1,
        0.,0.1,1,1,1,

        -0.1,-0.8,1,0,1,
        -0.1,0.1,1,0,1,
        0.2,0.1,1,0,1,
        0.2,-0.8,1,0,1,

        -0.1,0.1,1,1,1,
        -0.4,0,1,1,1,
        0.2,0,1,1,1,
        0.2,0.1,1,1,1,
    ];

    // Bind buffer
    var TRIANGLE_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triangle_vertex), GL.STATIC_DRAW);

    var triangle_faces = [
        0, 1, 2,
        0, 2, 3,

        4, 5, 6,
        4, 6, 7,

        8, 9, 10,

        11, 12, 13,
        11, 13, 14,

        15, 16, 17,
        15, 17, 18
    ]
   
    // Bind buffer faces
    var TRIANGLE_FACES = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_faces), GL.STATIC_DRAW);

    // Drawing
    GL.clearColor(0.0, 0.0, 0.0, 1.0); // RGBA
    var animate = function() {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        //Draw stuff here ...
        GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4 * (2 + 3), 0);
        GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (2 + 3), 4 * 2);
        GL.uniform3f(uniform_color, 1, 1, 1);
        // GL.drawArrays(GL.TRIANGLES, 0, triangle_vertex.length/2);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
        GL.drawElements(GL.TRIANGLES, triangle_faces.length, GL.UNSIGNED_SHORT, 0)

        GL.flush();
        window.requestAnimationFrame(animate);
    };
    animate();

}
window.addEventListener('load', main);
