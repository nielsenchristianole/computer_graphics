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

var maxVerts = 2 ** 16
var maxNumSubdivisions = 6
var NumSubdivisions = 0

var modelViewMatrixLoc
var yRotation = 0
var vertices = tetrahedron(NumSubdivisions, true)


function mix(a, b) {
    return scale(0.5, add(a, b))
}

function divideTriangle(a, b, c, count, pointsArray, is_face) {
    if (count > 0) {
        var ab = normalize(mix(a, b), true)
        var ac = normalize(mix(a, c), true)
        var bc = normalize(mix(b, c), true)
        divideTriangle(a, ab, ac, count - 1, pointsArray, is_face)
        divideTriangle(ab, b, bc, count - 1, pointsArray, is_face)
        divideTriangle(bc, c, ac, count - 1, pointsArray, is_face)
        divideTriangle(ab, bc, ac, count - 1, pointsArray, is_face)
    } else {
        if (is_face) {
            pointsArray.push(a)
            pointsArray.push(b)
            pointsArray.push(c)
        } else {
            pointsArray.push(a)
            pointsArray.push(b)
            pointsArray.push(b)
            pointsArray.push(c)
            pointsArray.push(c)
            pointsArray.push(a)
        }
    }
}

function tetrahedron(count, is_face=true) {
    var pointsArray = []
    
    var a = vec4(0.0, 0.0, 1.0, 1)
    var b = vec4(0.0, 0.942809, -0.333333, 1)
    var c = vec4(-0.816497, -0.471405, -0.333333, 1)
    var d = vec4(0.816497, -0.471405, -0.333333, 1)

    divideTriangle(a, b, c, count, pointsArray, is_face)
    divideTriangle(d, c, b, count, pointsArray, is_face)
    divideTriangle(a, d, b, count, pointsArray, is_face)
    divideTriangle(a, c, d, count, pointsArray, is_face)
    return pointsArray
}


window.onload = function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }

    var ext = gl.getExtension('OES_element_index_uint')
    if (!ext) { alert("OES_element_index_uint is not supported by your browser") }


    // configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(...clearColor)

    // load shaders
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    // Create a buffer
    var vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec4'], gl.STATIC_DRAW)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))

    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // get uniform location for modelViewMatrix
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    document.getElementById("IncrementButton").addEventListener(
        "click",
        function() {
            NumSubdivisions += 1
            NumSubdivisions = Math.min(maxNumSubdivisions, NumSubdivisions)
            vertices = tetrahedron(NumSubdivisions, true)
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))
        }
    )

    document.getElementById("DecrementButton").addEventListener(
        "click",
        function() {
            NumSubdivisions -= 1
            NumSubdivisions = Math.max(0, NumSubdivisions)
            vertices = tetrahedron(NumSubdivisions, true)
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))
        }
    )

    // render
    render()
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    yRotation += 0.01
    yRotation %= 2 * Math.PI

    var cameraMatrix = mult(
        perspective(45.0, 1.0, 0.1, 100.0),
        lookAt(
            vec3(10 * Math.sin(yRotation), 0.0, 10 * Math.cos(yRotation)),
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 1.0, 0.0)))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(cameraMatrix))
    
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    gl.cullFace(gl.BACK)

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length)
    document.getElementById('TUI').innerHTML = 'Using ' + NumSubdivisions + ' subdivisions'
    requestAnimationFrame(render)
}
