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

var yRotation = 0

// initial value, min, scale
var emittedRange = [1.0, 0.0, 2.0]
var ambientRange = [0.1, 0.0, 1.0]
var diffuseRange = [0.9, 0.0, 1.0]
var specularRange = [0.1, 0.0, 1.0]
var shineRange = [500.0, 0.0000000000001, 1000.0]


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

    // UI update
    document.getElementById("emittedRange").value = Math.round((emittedRange[0] - emittedRange[1]) / emittedRange[2] * 1000)
    document.getElementById("ambientRange").value = Math.round((ambientRange[0] - ambientRange[1]) / ambientRange[2] * 1000)
    document.getElementById("diffuseRange").value = Math.round((diffuseRange[0] - diffuseRange[1]) / diffuseRange[2] * 1000)
    document.getElementById("specularRange").value = Math.round((specularRange[0] - specularRange[1]) / specularRange[2] * 1000)
    document.getElementById("shineRange").value = Math.round((shineRange[0] - shineRange[1]) / shineRange[2] * 1000)

    document.getElementById('emittedDisplay').innerHTML = emittedRange[0]
    document.getElementById('ambientDisplay').innerHTML = ambientRange[0]
    document.getElementById('diffuseDisplay').innerHTML = diffuseRange[0]
    document.getElementById('specularDisplay').innerHTML = specularRange[0]
    document.getElementById('shineDisplay').innerHTML = shineRange[0]
    

    // shading parameters
    document.getElementById("emittedRange").addEventListener(
        "input",
        function() {
            emittedRange[0] = Math.max(this.value / 1000 * emittedRange[2], emittedRange[1])
            document.getElementById('emittedDisplay').innerHTML = emittedRange[0]})

    document.getElementById("ambientRange").addEventListener(
        "input",
        function() {
            ambientRange[0] = Math.max(this.value / 1000 * ambientRange[2], ambientRange[1])
            document.getElementById('ambientDisplay').innerHTML = ambientRange[0]})

    document.getElementById("diffuseRange").addEventListener(
        "input",
        function() {
            diffuseRange[0] = Math.max(this.value / 1000 * diffuseRange[2], diffuseRange[1])
            document.getElementById('diffuseDisplay').innerHTML = diffuseRange[0]})

    document.getElementById("specularRange").addEventListener(
        "input",
        function() {
            specularRange[0] = Math.max(this.value / 1000 * specularRange[2], specularRange[1])
            document.getElementById('specularDisplay').innerHTML = specularRange[0]})

    document.getElementById("shineRange").addEventListener(
        "input",
        function() {
            shineRange[0] = Math.max(this.value / 1000 * shineRange[2], shineRange[1])
            document.getElementById('shineDisplay').innerHTML = shineRange[0]})

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
            
    // move the rest of the parameters
    gl.uniform1fv(
        gl.getUniformLocation(program, "rasterParam"),
        [
            emittedRange[0],
            ambientRange[0],
            diffuseRange[0],
            specularRange[0],
            shineRange[0]])

    // render
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0)
    requestAnimationFrame(render)
}
