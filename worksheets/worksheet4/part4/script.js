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
var maxVerts = 800000
var maxNumSubdivisions = 8
var NumSubdivisions = 4

var yRotation = 0
var vertices = tetrahedron(NumSubdivisions, true)

// initial value, min, scale
var emittedRange = [1.0, 0.0, 2.0]
var ambientRange = [0.1, 0.0, 1.0]
var diffuseRange = [0.9, 0.0, 1.0]
var specularRange = [0.1, 0.0, 1.0]
var shineRange = [500.0, 0.0000000000001, 1000.0]
var redRange = [1.0, 0.0, 1.0]
var greenRange = [0.0, 0.0, 1.0]
var blueRange = [0.0, 0.0, 1.0]


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
    program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    // Create a buffer
    var vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec4'], gl.STATIC_DRAW)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))

    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // UI update
    document.getElementById("emittedRange").value = Math.round((emittedRange[0] - emittedRange[1]) / emittedRange[2] * 1000)
    document.getElementById("ambientRange").value = Math.round((ambientRange[0] - ambientRange[1]) / ambientRange[2] * 1000)
    document.getElementById("diffuseRange").value = Math.round((diffuseRange[0] - diffuseRange[1]) / diffuseRange[2] * 1000)
    document.getElementById("specularRange").value = Math.round((specularRange[0] - specularRange[1]) / specularRange[2] * 1000)
    document.getElementById("shineRange").value = Math.round((shineRange[0] - shineRange[1]) / shineRange[2] * 1000)
    document.getElementById("redRange").value = Math.round((redRange[0] - redRange[1]) / redRange[2] * 1000)
    document.getElementById("greenRange").value = Math.round((greenRange[0] - greenRange[1]) / greenRange[2] * 1000)
    document.getElementById("blueRange").value = Math.round((blueRange[0] - blueRange[1]) / blueRange[2] * 1000)

    document.getElementById('emittedDisplay').innerHTML = emittedRange[0]
    document.getElementById('ambientDisplay').innerHTML = ambientRange[0]
    document.getElementById('diffuseDisplay').innerHTML = diffuseRange[0]
    document.getElementById('specularDisplay').innerHTML = specularRange[0]
    document.getElementById('shineDisplay').innerHTML = shineRange[0]
    document.getElementById('redDisplay').innerHTML = redRange[0]
    document.getElementById('greenDisplay').innerHTML = greenRange[0]
    document.getElementById('blueDisplay').innerHTML = blueRange[0]
    

    document.getElementById('TUI').innerHTML = 'Using ' + NumSubdivisions + ' subdivisions'

    // vertex parameters
    document.getElementById("IncrementButton").addEventListener(
        "click",
        function() {
            NumSubdivisions += 1
            NumSubdivisions = Math.min(maxNumSubdivisions, NumSubdivisions)
            vertices = tetrahedron(NumSubdivisions, true)
            console.log(vertices.length)
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))
            document.getElementById('TUI').innerHTML = 'Using ' + NumSubdivisions + ' subdivisions'})

    document.getElementById("DecrementButton").addEventListener(
        "click",
        function() {
            NumSubdivisions -= 1
            NumSubdivisions = Math.max(0, NumSubdivisions)
            vertices = tetrahedron(NumSubdivisions, true)
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))
            document.getElementById('TUI').innerHTML = 'Using ' + NumSubdivisions + ' subdivisions'})

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
    
    document.getElementById("redRange").addEventListener(
        "input",
        function() {
            redRange[0] = Math.max(this.value / 1000 * redRange[2], redRange[1])
            document.getElementById('redDisplay').innerHTML = redRange[0]})

    document.getElementById("greenRange").addEventListener(
        "input",
        function() {
            greenRange[0] = Math.max(this.value / 1000 * greenRange[2], greenRange[1])
            document.getElementById('greenDisplay').innerHTML = greenRange[0]})

    document.getElementById("blueRange").addEventListener(
        "input",
        function() {
            blueRange[0] = Math.max(this.value / 1000 * blueRange[2], blueRange[1])
            document.getElementById('blueDisplay').innerHTML = blueRange[0]})

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
    
    gl.uniform3fv(
        gl.getUniformLocation(program, "bodyColor"), flatten(vec3(redRange[0], greenRange[0], blueRange[0]))
    )

    // render
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length)
    requestAnimationFrame(render)
}
