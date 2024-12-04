"use strict"

/** @type {WebGLRenderingContext} */
var gl
var canvas
var program

const clearColor = [0.3921, 0.5843, 0.9294, 1.0]
const groundHeight = -1.0

var drawingInfo
var yRotation = 0
var yHeight = 0.5
var yVelocity = 0.
var yAcceleration = -0.0001
var normals
var vertices
var verticeIndices
const quadVertices = new Float32Array([
    -2, groundHeight, -5, 1,
     2, groundHeight, -5, 1,
    -2, groundHeight, -1, 1,
     2, groundHeight, -1, 1
])
const quadIndices = new Uint32Array([0, 2, 1, 3, 1, 2])

var wrappingMode = 'repeat'
var filteringModeMag = 'nearest'
var filteringModeMin = 'nearest'

// initial value, min, scale
var animateObject = true
var animateLight = true
var emittedRange = [1.0, 0.0, 2.0]
var ambientRange = [0.2, 0.0, 1.0]
var diffuseRange = [1.0, 0.0, 1.0]
var specularRange = [1.0, 0.0, 1.0]
var shineRange = [500.0, 0.0000000000001, 1000.0]

var iBuffer
var vBuffer
var nBuffer
var quadVertexBuffer
var quadIndexBuffer
var vPosition
var vNormal


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
    drawingInfo = await readOBJFile('../teapot.obj', 1.0, true)
    vertices = drawingInfo.vertices
    verticeIndices = drawingInfo.indices
    normals = drawingInfo.normals

    iBuffer = gl.createBuffer()
    vBuffer = gl.createBuffer()
    nBuffer = gl.createBuffer()
    quadVertexBuffer = gl.createBuffer()
    quadIndexBuffer = gl.createBuffer()
    vPosition = gl.getAttribLocation(program, "vPosition")
    vNormal = gl.getAttribLocation(program, "vNormal")

    // teapor
    // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, verticeIndices, gl.STATIC_DRAW)

    // vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    // normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)

    // quad
    // vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)
    
    // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW)

    // update the texture parameters
    if (true) {

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
        document.getElementById("toggleObjectAnimation").addEventListener(
            "click",
            function() {
                animateObject = !animateObject})
        document.getElementById("toggleLightAnimation").addEventListener(
            "click",
            function() {
                animateLight = !animateLight})

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
    }

    render()
}

const identityMatrix = mat4()

function render() {

    if (animateLight) {
        yRotation += 0.02
        yRotation %= 2 * Math.PI
    }
    if (animateObject) {
        yHeight += yVelocity
        if (yHeight <= -1.0) {
            yHeight = -1.0
            yVelocity = -yVelocity
        }
        yVelocity += yAcceleration
    }

    const distance = 5.0
    
    // light position
    var l_i = vec3(distance * Math.sin(yRotation), 3, distance * Math.cos(yRotation) - 3.0)
    gl.uniform3fv(gl.getUniformLocation(program, "l_i"), flatten(l_i))
    // where we are looking from
    var omega_o = vec3(0.0, 0.2, 1.0)
    gl.uniform3fv(gl.getUniformLocation(program, "omega_o"), flatten(omega_o))
    
    // camera matrix
    var projectionMatrix = mat4(1.0)
    projectionMatrix[3][3] = 0.0
    projectionMatrix[3][1] = 1.0 / - (l_i[1] - groundHeight + 0.01)
    projectionMatrix = mult(
        translate(...l_i),
        projectionMatrix)
    projectionMatrix = mult(
        projectionMatrix,
        translate(...negate(l_i)))

    // scale and translate model matrix
    var modelMatrix = mult(
        translate(0.0, yHeight, -3.0),
        scalem(0.25, 0.25, 0.25),
    )

    const identityMatrix = mat4()

    var lightViewProjectionMatrix = mult(
        perspective(45.0, 1.0, 0.1, 100.0),
        lookAt(
            l_i,
            vec3(0.0, groundHeight, -3.0),
            vec3(0.0, 1.0, 0.0)))

    var eyeViewProjectionMatrix = mult(
        perspective(45.0, 1.0, 0.1, 100.0),
        lookAt(
            omega_o,
            vec3(0.0, 0.0, -3.0),
            vec3(0.0, 1.0, 0.0)))
    
    var viewProjectionMatrix = eyeViewProjectionMatrix
    
    var shadowViewMatrix = mult(
        mult(viewProjectionMatrix, projectionMatrix),
        modelMatrix)

    var modelViewProjectionMatrix = mult(viewProjectionMatrix, modelMatrix)

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


    // draw quad
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 0)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(identityMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(viewProjectionMatrix))
    // gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrixNormal"), false, flatten(modelMatrix))
    
    gl.enable(gl.DEPTH_TEST)
    // gl.enable(gl.CULL_FACE)
    // gl.cullFace(gl.BACK)
    gl.drawElements(gl.TRIANGLES, quadIndices.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)

    // draw shadow
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vNormal)
    
    gl.depthFunc(gl.GREATER)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(modelMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(shadowViewMatrix))
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 2)
    gl.drawElements(gl.TRIANGLES, verticeIndices.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)
    
    // draw object
    gl.depthFunc(gl.LESS)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(modelViewProjectionMatrix))
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 1)
    gl.drawElements(gl.TRIANGLES, verticeIndices.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)

    requestAnimationFrame(render)
}






function initFramebufferObject(gl, width, height) {
    var framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    
    var renderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    
    var shadowMap = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, shadowMap).texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    framebuffer.texture = shadowMap

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer object is incomplete: ' + status.toString())
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    framebuffer.width = width
    framebuffer.height = height
    return framebuffer
}







/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas)
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
    gl.uniform1i(gl.getUniformLocation(program, "colorMap2D"), 0)
}
