import { MyObject } from "./MyObject.js";

function main() {
    /** @type {HTMLCanvasElement} */
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;


    /*===================== GET WEBGL CONTEXT ===================== */
    /** @type {WebGLRenderingContext} */
    var GL;
    try {
        GL = CANVAS.getContext("webgl", { antialias: true });
    } catch (e) {
        alert("WebGL context cannot be initialized");
        return false;
    }


    /*========================= SHADERS ========================= */
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
        uniform float greyScality;

        void main(void) {
            float greyScaleValue = (vColor.r + vColor.b + vColor.g) / 3.0;
            vec3 greyScaleColor = vec3(greyScaleValue, greyScaleValue, greyScaleValue);
            vec3 color = mix(vColor, greyScaleColor, greyScality);
            gl_FragColor = vec4(color, 1.0);
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
    };
    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");


    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);


    GL.linkProgram(SHADER_PROGRAM);


    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_position);


    var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
    GL.enableVertexAttribArray(_color);

    var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

    var _greyscality = GL.getUniformLocation(SHADER_PROGRAM, "greyScality");

    GL.useProgram(SHADER_PROGRAM);


    /*======================== THE TRIANGLE ======================== */
    // POINTS:    

    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX, -6);


    var Object1 = new MyObject(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
    var Object2 = new MyObject(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
    var Object3 = new MyObject(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);

    Object1.childs.push(Object2);
    Object2.childs.push(Object3);

    LIBS.translateX(Object2.POSITION_MATRIX, 5);
    LIBS.scaleX(Object2.POSITION_MATRIX, 0.75);
    LIBS.scaleY(Object2.POSITION_MATRIX, 0.75);
    LIBS.scaleZ(Object2.POSITION_MATRIX, 0.75);

    LIBS.translateY(Object3.POSITION_MATRIX, 4);
    LIBS.scaleX(Object3.POSITION_MATRIX, 0.75);
    LIBS.scaleY(Object3.POSITION_MATRIX, 0.75);
    LIBS.scaleZ(Object3.POSITION_MATRIX, 0.75);

    Object1.setup();

   

    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);

    var time_prev = 0;
    var animate = function (time) {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

       
        var t = time;
        var lastTime = time_prev;
        var dt = 1; lastTime = t;

        LIBS.rotateY(Object1.MOVE_MATRIX, dt * 0.01);
        LIBS.rotateX(Object2.MOVE_MATRIX, dt * 0.01);
        LIBS.rotateZ(Object3.MOVE_MATRIX, dt * 0.01);

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);

        Object1.render(LIBS.get_I4());
        requestAnimationFrame(animate);
    };
    animate(0);
}
window.addEventListener('load', main);