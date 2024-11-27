"use strict"

/** @type {WebGLRenderingContext} */
var gl
var canvas
var program

const clearColor = [0.3921, 0.5843, 0.9294, 1.0]

const maxVerts = 800000
const maxNumSubdivisions = 8
var NumSubdivisions = 4

var yRotation = 0
var vertices = new Float32Array([
    -2, -1, -5, 1,
     2, -1, -5, 1,
    -2, -1, -1, 1,
     2, -1, -1, 1,
    0.25, -0.5, -1.75, 1,
    0.75, -0.5, -1.75, 1,
    0.25, -0.5, -1.25, 1,
    0.75, -0.5, -1.25, 1,
    -1, -1, -3.0, 1,
    -1, -1, -2.5, 1,
    -1,  0, -3.0, 1,
    -1,  0, -2.5, 1,
])
// var vertice_indices = new Uint32Array(Array.from({ length: vertices.length }, (v, i) => i))
var vertice_indices = new Uint32Array([
    0, 1, 2, 3, 2, 1,
    4, 5, 6, 7, 6, 5,
    8, 9, 10, 11, 10, 9,
])


var wrappingMode = 'repeat'
var filteringModeMag = 'nearest'
var filteringModeMin = 'nearest'

// initial value, min, scale
var emittedRange = [1.0, 0.0, 2.0]
var ambientRange = [1.0, 0.0, 1.0]
var diffuseRange = [0.0, 0.0, 1.0]
var specularRange = [0.0, 0.0, 1.0]
var shineRange = [500.0, 0.0000000000001, 1000.0]

const cubemapDirs = [
    '../cubemaps/autumn_cubemap/',
    '../cubemaps/brightday2_cubemap/',
    '../cubemaps/cloudyhills_cubemap/',
    '../cubemaps/greenhill_cubemap/',
    '../cubemaps/house_cubemap/',
    '../cubemaps/terrain_cubemap/',
]
var cubemapIdx = 0
var cubemapDir = cubemapDirs[cubemapIdx]
var g_tex_ready = 0


var iBuffer
var vBuffer
var quadVertexBuffer
var quadIndexBuffer
var vPosition


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

    // await load_cubemap()
    await load_texture('../texture.png')

    iBuffer = gl.createBuffer()
    vBuffer = gl.createBuffer()
    quadVertexBuffer = gl.createBuffer()
    quadIndexBuffer = gl.createBuffer()
    vPosition = gl.getAttribLocation(program, "vPosition")

    // indexes
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(Array.from({ length: vertices.length }, (v, i) => i)), gl.STATIC_DRAW)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertice_indices, gl.STATIC_DRAW)

    // Create a buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec4'], gl.STATIC_DRAW)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))

    // create the quad
    var quadVertices = new Float32Array([
        -1, -1, 0.999, 1,
        1, -1, 0.999, 1,
        -1, 1, 0.999, 1,
        1, 1, 0.999, 1,
    ])
    
    const quadIndices = new Uint16Array([0, 1, 2, 2, 1, 3])
    
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW)


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
    // document.getElementById("IncrementButton").addEventListener(
    //     "click",
    //     function() {
    //         NumSubdivisions += 1
    //         NumSubdivisions = Math.min(maxNumSubdivisions, NumSubdivisions)
    //         vertices = tetrahedron(NumSubdivisions, true)
    //         console.log(vertices.length)
    //         gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    //         gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))
    //         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    //         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(Array.from({ length: vertices.length }, (v, i) => i)), gl.STATIC_DRAW)
    //         document.getElementById('TUI').innerHTML = 'Using ' + NumSubdivisions + ' subdivisions'})

    // document.getElementById("DecrementButton").addEventListener(
    //     "click",
    //     function() {
    //         NumSubdivisions -= 1
    //         NumSubdivisions = Math.max(0, NumSubdivisions)
    //         vertices = tetrahedron(NumSubdivisions, true)
    //         gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    //         gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices))
    //         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    //         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(Array.from({ length: vertices.length }, (v, i) => i)), gl.STATIC_DRAW)
    //         document.getElementById('TUI').innerHTML = 'Using ' + NumSubdivisions + ' subdivisions'})

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

const identityMatrix = mat4()

function render() {

    yRotation += 0.02
    if (yRotation > 2 * Math.PI) {
        yRotation %= 2 * Math.PI
        // cubemapIdx++
        // cubemapIdx %= cubemapDirs.length
        // cubemapDir = cubemapDirs[cubemapIdx]
        // gl.activeTexture(gl.TEXTURE0)
        // load_cubemap()
    }
    const distance = 2.0
    
    // where we are looking from
    var l_i = vec3(distance * Math.sin(yRotation), 2.0, distance * Math.cos(yRotation) - 2)
    gl.uniform3fv(gl.getUniformLocation(program, "l_i"), flatten(l_i))
    // var omega_o = vec3(distance * Math.sin(yRotation), 3.0, distance * Math.cos(yRotation))
    var omega_o = vec3(0.0, 1, 3)
    gl.uniform3fv(gl.getUniformLocation(program, "omega_o"), flatten(omega_o))
    
    // camera matrix
    var projectionMatrix = mat4(1.0);
    projectionMatrix[3][3] = 0.0
    projectionMatrix[3][1] = 1.0 / - (l_i[1] - (-1.01))
    projectionMatrix = mult(
        translate(...l_i),
        projectionMatrix)
    projectionMatrix = mult(
        projectionMatrix,
        translate(...negate(l_i)))
    



    var cameraMatrix = perspective(45.0, 1.0, 0.1, 100.0)
    cameraMatrix = mult(
        cameraMatrix,
        lookAt(
            omega_o,
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 1.0, 0.0)))
    
    // const identityCamera = mat4()

    // move the rest of the parameters
    gl.uniform1fv(
        gl.getUniformLocation(program, "rasterParam"),
        [
            emittedRange[0],
            ambientRange[0],
            diffuseRange[0],
            specularRange[0],
            shineRange[0]])

    // texture
    // switch (wrappingMode) {
    //     case "repeat":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.REPEAT)
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.REPEAT)
    //         break
    //     case "clamp-to-edge":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    //         break
    // }

    // switch (filteringModeMag) {
    //     case "nearest":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    //         break
    //     case "linear":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    //         break
    // }

    // switch (filteringModeMin) {
    //     case "nearest":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    //         break
    //     case "linear":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    //         break
    //     case "nearest mipmap nearest":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST)
    //         break
    //     case "linear mipmap nearest":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
    //         break
    //     case "nearest mipmap linear":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR)
    //         break
    //     case "linear mipmap linear":
    //         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    //         break
    // }

    // render
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)



    // draw the quad
    var invMatrix = inverse4(lookAt(
        omega_o,
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0)))
    invMatrix[0][3] = 0
    invMatrix[1][3] = 0
    invMatrix[2][3] = 0
    invMatrix[3][3] = 0
    // invMatrix[3] = vec4(0, 0, 0, 0)
    invMatrix = mult(
        invMatrix,
        inverse4(perspective(90.0, 1.0, 0.1, 100.0)),
    )

    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 0)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(cameraMatrix))
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    
    gl.enable(gl.DEPTH_TEST)
    // gl.enable(gl.CULL_FACE)
    // gl.cullFace(gl.BACK)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)
    
    
    // draw shadow
    gl.depthFunc(gl.GREATER)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(mult(cameraMatrix, projectionMatrix)))
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 2)
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_INT, 6 * new Uint32Array([1]).byteLength)

    // body
    gl.depthFunc(gl.LESS)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(cameraMatrix))
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 1)
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_INT, 6 * new Uint32Array([1]).byteLength)



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

    var isLoaded = false
    gl.activeTexture(gl.TEXTURE0)
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
        isLoaded = true
    }
    image.src = filename

    while (!isLoaded) {
        await new Promise(r => setTimeout(r, 100))
    }
    gl.uniform1i(gl.getUniformLocation(program, "normalMap2D"), 0)
}


async function load_cubemap() {

    var cubemap = [
        cubemapDir + 'posx.png',
        cubemapDir + 'negx.png',
        cubemapDir + 'posy.png',
        cubemapDir + 'negy.png',
        cubemapDir + 'posz.png',
        cubemapDir + 'negz.png']
    
    gl.activeTexture(gl.TEXTURE1)
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

    for(var i = 0; i < 6; i++) {
        var image = document.createElement('img')
        image.crossorigin = 'anonymous'
        image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i
        image.onload = function(event) {
            var image = event.target
            gl.activeTexture(gl.TEXTURE1)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, cubemapIdx == 4)
            gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)

            g_tex_ready++
        }
        image.src = cubemap[i]
    }
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0)

    while (g_tex_ready < 6) {
        await new Promise(r => setTimeout(r, 100))
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);

    g_tex_ready = 0
}
