"use strict"


/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas)
}

/** @type {WebGLRenderingContext} */
var gl
var canvas

var clearColor = [0.3921, 0.5843, 0.9294, 1.0]

var program
var drawingInfo

var yRotation = 0.0


window.onload = async function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }

    var ext = gl.getExtension('OES_element_index_uint')
    if (!ext) { alert("OES_element_index_uint is not supported by your browser") }


    // configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(...clearColor)

    // load shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    
    // load the data object
    drawingInfo = await readOBJFile('../suzanne.obj', 1.0, true)

    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(drawingInfo.indices), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW)
    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW)
    var vNormal = gl.getAttribLocation(program, "vNormal")
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vNormal)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW)
    var vColor = gl.getAttribLocation(program, "vColor")
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vColor)

    render()
}


function render() {
    yRotation += 0.03
    yRotation %= 2 * Math.PI
    
    // where we are looking from
    var omega_o = vec3(10.0 * Math.sin(yRotation), 0.0, 10.0 * Math.cos(yRotation))
    gl.uniform3fv(gl.getUniformLocation(program, "omega_o"), flatten(omega_o))
    
    // camera matrix
    var cameraMatrix = mult(
        perspective(45.0, 1.0, 0.1, 100.0),
        lookAt(
            omega_o,
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 1.0, 0.0)))
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(cameraMatrix))

    // render
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0)
    requestAnimationFrame(render)
}
