"use strict"

/** @type {WebGLRenderingContext} */
var gl
var canvas

const clearColor = [0.3921, 0.5843, 0.9294, 1.0]

var program
const maxVerts = 800000
const maxNumSubdivisions = 8
var NumSubdivisions = 4

var yRotation = 0
var vertices = tetrahedron(NumSubdivisions, true)

var wrappingMode = 'repeat'
var filteringModeMag = 'linear'
var filteringModeMin = 'nearest mipmap linear'

// initial value, min, scale
var emittedRange = [1.0, 0.0, 2.0]
var ambientRange = [0.5, 0.0, 1.0]
var diffuseRange = [1.0, 0.0, 1.0]
var specularRange = [0.0, 0.0, 1.0]
var shineRange = [500.0, 0.0000000000001, 1000.0]


window.onload = async function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }

    var ext = gl.getExtension('OES_element_index_uint')
    if (!ext) { alert("OES_element_index_uint is not supported by your browser") }

    await load_texture('../earth.jpg')

    // configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(...clearColor)

    // load shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    // indexes
    var iBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(Array.from({ length: vertices.length }, (v, i) => i)), gl.STATIC_DRAW)

    // Create a buffer
    var vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec4'], gl.STATIC_DRAW)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))

    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)


    // texture ui
    document.getElementById("wrap-select").addEventListener(
        "change",
        function() {
            wrappingMode = this.value
        })

    document.getElementById("filtering-select-mag").addEventListener(
        "change",
        function() {
            filteringModeMag = this.value})
    document.getElementById("filtering-select-min").addEventListener(
        "change",
        function() {
            filteringModeMin = this.value})

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
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(Array.from({ length: vertices.length }, (v, i) => i)), gl.STATIC_DRAW)
            document.getElementById('TUI').innerHTML = 'Using ' + NumSubdivisions + ' subdivisions'})

    document.getElementById("DecrementButton").addEventListener(
        "click",
        function() {
            NumSubdivisions -= 1
            NumSubdivisions = Math.max(0, NumSubdivisions)
            vertices = tetrahedron(NumSubdivisions, true)
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(Array.from({ length: vertices.length }, (v, i) => i)), gl.STATIC_DRAW)
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

    render()
}


function render() {
    yRotation += 0.01
    yRotation %= 2 * Math.PI
    const distance = 2.0
    
    // where we are looking from
    var omega_o = vec3(distance * Math.sin(yRotation), 0.0, distance * Math.cos(yRotation))
    gl.uniform3fv(gl.getUniformLocation(program, "omega_o"), flatten(omega_o))
    
    // camera matrix
    var cameraMatrix = perspective(90.0, 1.0, 0.1, 100.0)
    cameraMatrix = mult(
        cameraMatrix,
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

    // texture
    switch (wrappingMode) {
        case "repeat":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
            break
        case "clamp-to-edge":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            break
    }

    switch (filteringModeMag) {
        case "nearest":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            break
        case "linear":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            break
    }

    switch (filteringModeMin) {
        case "nearest":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            break
        case "linear":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            break
        case "nearest mipmap nearest":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST)
            break
        case "linear mipmap nearest":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
            break
        case "nearest mipmap linear":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR)
            break
        case "linear mipmap linear":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            break
    }

    // draw
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    gl.drawElements(gl.TRIANGLES, vertices.length, gl.UNSIGNED_INT, 0)
    requestAnimationFrame(render)
}


/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas)
}


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


async function load_texture(filename) {
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    const pixel = new Uint8Array([255, 0, 255, 255])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel)

    var image = document.createElement('img')
    image.crossorigin = 'anonymous'
    image.onload = function () { 

        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        gl.generateMipmap(gl.TEXTURE_2D)
    }
    image.src = filename
}