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
var markerColor = [1.0, 1.0, 1.0, 1.0]

var pointsIndex = 0


window.onload = function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }

    var ext = gl.getExtension('OES_element_index_uint')
    if (!ext) { alert("OES_element_index_uint is not supported by your browser") }


    // Create a cube
    //    v5----- v6
    //   /|      /|
    //  v1------v2|
    //  | |     | |
    //  | |v4---|-|v7
    //  |/      |/
    //  v0------v3

    var vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0)]
    
    // Wireframe indice
    var wire_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0,  // front
        2, 3, 3, 7, 7, 6, 6, 2,  // right
        0, 3, 3, 7, 7, 4, 4, 0,  // down
        1, 2, 2, 6, 6, 5, 5, 1,  // up
        4, 5, 5, 6, 6, 7, 7, 4,  // back
        0, 1, 1, 5, 5, 4, 4, 0]) // left

    // Triangle mesh indices
    var face_indices = new Uint32Array([
        1, 0, 3, 3, 2, 1,  // front
        2, 3, 7, 7, 6, 2,  // right
        3, 0, 4, 4, 7, 3,  // down
        6, 5, 1, 1, 2, 6,  // up
        4, 5, 6, 6, 7, 4,  // back
        5, 4, 0, 0, 1, 5]) // left

    // configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(...clearColor)

    // load shaders
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    // Create a buffer
    var iBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices), gl.STATIC_DRAW)

    var vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)

    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // rotation matrix
    var cameraMatrix = perspective(45.0, 1.0, 0.1, 100.0)
    var modelViewMatrix

        
    // render
    gl.clear(gl.COLOR_BUFFER_BIT)
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")
    
    // see from the front
    modelViewMatrix = mult(
        cameraMatrix,
        lookAt(
            vec3(0.5, 0.5, 5),
            vec3(0.5, 0.5, 0.0),
            vec3(0.0, 1.0, 0.0)))
    modelViewMatrix = mult(translate(-0.6, 0, 0), modelViewMatrix)
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0)

    // from the side
    modelViewMatrix = mult(
        cameraMatrix,
        lookAt(
            vec3(0.5, 5, 5),
            vec3(0.5, 0, 0.0),
            vec3(0.0, 1.0, 0.0)))
    modelViewMatrix = mult(translate(0.1, 0, 0), modelViewMatrix)
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0)

    // see from the corner
    modelViewMatrix = mult(
        cameraMatrix,
        lookAt(
            vec3(5, 5, 5),
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 1.0, 0.0)))
    modelViewMatrix = mult(translate(0.7, 0, 0), modelViewMatrix)
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix))
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0)
}


// function render() {
//     gl.clear(gl.COLOR_BUFFER_BIT)

//     // gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0)
//     gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0)
    
//     // requestAnimationFrame(render)
// }
