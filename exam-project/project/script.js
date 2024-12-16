"use strict"

/** @type {WebGLRenderingContext} */
var gl
var canvas
var program
var shadowFramebuffer

const cornflowerBlueClearColor = [0.3921, 0.5843, 0.9294, 1.0]
const blackClearColor = [0.0, 0.0, 0.0, 1.0]
const groundHeight = -1.0

var drawingInfo
var yRotationLight = 0
var yRotationObject = 0.5
var waveTime = 0
var normals
var vertices
var verticeIndices
const quadVerticesWater = new Float32Array([
    -2, groundHeight, -5, 1,
     2, groundHeight, -5, 1,
    -2, groundHeight, -1, 1,
     2, groundHeight, -1, 1
    // -12, groundHeight, -25, 1,
    //  12, groundHeight, -25, 1,
    // -12, groundHeight, -1, 1,
    //  12, groundHeight, -1, 1
])
const quadIndicesWater = new Uint32Array([0, 2, 1, 3, 1, 2])

const quadVerticesBackground = new Float32Array([
    -1, -1, 0.999, 1,
    1, -1, 0.999, 1,
    -1, 1, 0.999, 1,
    1, 1, 0.999, 1,
])
const quadIndicesBackground = new Uint32Array([0, 1, 2, 2, 1, 3])


var wrappingMode = 'repeat'
var filteringModeMag = 'nearest'
var filteringModeMin = 'nearest'

// initial value, min, scale
var animateObject = true
var animateLight = true
var animateWaves = true
var emittedRange = [1.0, 0.0, 2.0]
var ambientRange = [0.5, 0.0, 1.0]
var diffuseRange = [0.5, 0.0, 1.0]
var specularRange = [1.0, 0.0, 1.0]
var shineRange = [2.0, 0.0000000000001, 1000.0]

var lastTimestamp = null

var iBuffer
var vBuffer
var nBuffer
var quadVertexBufferWater
var quadIndexBufferWater
var quadVertexBufferBackground
var quadIndexBufferBackground
var vPosition
var vNormal

const cubemapDirs = [
    '../cubemaps/autumn_cubemap/',
    '../cubemaps/brightday2_cubemap/',
    '../cubemaps/cloudyhills_cubemap/',
    '../cubemaps/greenhill_cubemap/',
    '../cubemaps/house_cubemap/',
    '../cubemaps/terrain_cubemap/',
]
var cubemapIdx = 4
var cubemapDir = cubemapDirs[cubemapIdx]
var g_tex_ready = 0


window.onload = async function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }

    var ext = gl.getExtension('OES_element_index_uint')
    if (!ext) { alert("OES_element_index_uint is not supported by your browser") }

    // configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    shadowFramebuffer = initFramebufferObject(canvas.width, canvas.height)

    // load shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    await load_cubemap()
    await load_texture('../texture.png')
    drawingInfo = await readOBJFile('../teapot.obj', 1.0, true)
    vertices = drawingInfo.vertices
    verticeIndices = drawingInfo.indices
    normals = drawingInfo.normals

    iBuffer = gl.createBuffer()
    vBuffer = gl.createBuffer()
    nBuffer = gl.createBuffer()
    quadVertexBufferWater = gl.createBuffer()
    quadIndexBufferWater = gl.createBuffer()
    quadVertexBufferBackground = gl.createBuffer()
    quadIndexBufferBackground = gl.createBuffer()
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

    // water quad
    // vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBufferWater)
    gl.bufferData(gl.ARRAY_BUFFER, quadVerticesWater, gl.STATIC_DRAW)
    
    // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBufferWater)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndicesWater, gl.STATIC_DRAW)

    // background quad
    // vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBufferBackground)
    gl.bufferData(gl.ARRAY_BUFFER, quadVerticesBackground, gl.STATIC_DRAW)

    // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBufferBackground)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndicesBackground, gl.STATIC_DRAW)

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
        document.getElementById("toggleWaveAnimation").addEventListener(
            "click",
            function() {
                animateWaves = !animateWaves})

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

    // move random numbers
    [
        'amplitudes1sin',
        'amplitudes1cos',
        'amplitudes2sin',
        'amplitudes2cos',
        'amplitudes3sin',
        'amplitudes3cos',
        'amplitudes4sin',
        'amplitudes4cos',
        'amplitudes5sin',
        'amplitudes5cos',
        'amplitudes6sin',
        'amplitudes6cos',
        'amplitudes7sin',
        'amplitudes7cos',
        'amplitudes8sin',
        'amplitudes8cos'
    ].forEach(uniformName => {
        var nums = Array.from({length: 4}, () => Math.random() * (Math.random() > 0.5 ? 1 : -1))
        // console.log(uniformName, nums)
        gl.uniform4fv(gl.getUniformLocation(program, uniformName), nums)
    })

    render()
}

const identityMatrix = mat4()
var timeDiff

function render(timestamp) {

    if (timestamp === undefined) {
        timeDiff = 1.0
    } else if (lastTimestamp === null) {
        lastTimestamp = timestamp
        timeDiff = 1.0
    } else {
        timeDiff = (timestamp - lastTimestamp) / 40
        lastTimestamp = timestamp
    }

    if (animateLight) {
        yRotationLight += 0.02 * timeDiff
        yRotationLight %= 2 * Math.PI
    }
    if (animateObject) {
        yRotationObject -= 0.03 * timeDiff
        yRotationObject %= 360.0
    }
    if (animateWaves) {
        waveTime += 0.03 * timeDiff
        waveTime %= 200.0 * Math.PI
    }

    const distance = 3.0
    
    // light position
    var l_i = vec3(distance * Math.sin(yRotationLight), 4, distance * Math.cos(yRotationLight) - 3.0)
    gl.uniform3fv(gl.getUniformLocation(program, "l_i"), flatten(l_i))
    // where we are looking from
    var omega_o = vec3(0.0, 0.2, 1.0)
    gl.uniform3fv(gl.getUniformLocation(program, "omega_o"), flatten(omega_o))

    gl.uniform1f(gl.getUniformLocation(program, "waveTime"), waveTime)

    // scale and translate model matrix
    var modelMatrix = mult(
        mult(
            translate(0.0, 0.5, -3.0),
            scalem(0.25, 0.25, 0.25),
        ),
        rotateY(100.0 * yRotationObject))

    const identityMatrix = mat4()
    const eyePerspectiveMatrix = perspective(45.0, 1.0, 0.1, 100.0)
    const lightPerspectiveMatrix = perspective(45.0, 1.0, 1.5, 15.0)

    var lightViewProjectionMatrix = mult(
        lightPerspectiveMatrix,
        lookAt(
            l_i,
            vec3(0.0, groundHeight, -3.0),
            vec3(0.0, 1.0, 0.0)))

    var eyeViewProjectionMatrix = mult(
        eyePerspectiveMatrix,
        lookAt(
            omega_o,
            vec3(0.0, 0.0, -3.0),
            vec3(0.0, 1.0, 0.0)))

    var eyeModelViewProjectionMatrix = mult(eyeViewProjectionMatrix, modelMatrix)
    var lightModelViewProjectionMatrix = mult(lightViewProjectionMatrix, modelMatrix)

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
    gl.clearColor(...cornflowerBlueClearColor)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)


    // draw the shadow buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer)
    gl.viewport(0, 0, shadowFramebuffer.width, shadowFramebuffer.height)
    gl.clearColor(...blackClearColor)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // move quad
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBufferWater)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBufferWater)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // draw quad
    gl.uniform1i(gl.getUniformLocation(program, "colorMap2D"), 0)
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 3)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(identityMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(lightViewProjectionMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "lightModelViewProjectionMatrix"), false, flatten(lightViewProjectionMatrix))
    
    gl.enable(gl.DEPTH_TEST)
    gl.drawElements(gl.TRIANGLES, quadIndicesWater.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)

    // move model
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vNormal)

    // draw object
    gl.depthFunc(gl.LESS)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(modelMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(lightModelViewProjectionMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "lightModelViewProjectionMatrix"), false, flatten(lightModelViewProjectionMatrix))
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 3)
    gl.drawElements(gl.TRIANGLES, verticeIndices.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)


    gl.bindFramebuffer(gl.FRAMEBUFFER, null)



    // draw the scene
    gl.enable(gl.DEPTH_TEST)

    // draw the background
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBufferBackground)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBufferBackground)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 2)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(identityMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(identityMatrix))

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 2)
    gl.drawElements(gl.TRIANGLES, quadIndicesBackground.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)


    // move quad
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBufferWater)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBufferWater)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // draw quad
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 0)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(identityMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(eyeViewProjectionMatrix))
    // gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(lightViewProjectionMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "lightModelViewProjectionMatrix"), false, flatten(lightViewProjectionMatrix))

    gl.uniform1i(gl.getUniformLocation(program, "colorMap2D"), 1)
    gl.drawElements(gl.TRIANGLES, quadIndicesWater.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)

    // move model
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vNormal)

    // draw object
    gl.depthFunc(gl.LESS)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(modelMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(eyeModelViewProjectionMatrix))
    // gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewProjectionMatrix"), false, flatten(lightModelViewProjectionMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "lightModelViewProjectionMatrix"), false, flatten(lightModelViewProjectionMatrix ))
    gl.uniform1i(gl.getUniformLocation(program, "isObject"), 1)
    gl.drawElements(gl.TRIANGLES, verticeIndices.length, gl.UNSIGNED_INT, 0 * new Uint32Array([1]).byteLength)



    requestAnimationFrame(render)
}






function initFramebufferObject(width, height) {
    var framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    
    var renderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    
    var shadowMap = gl.createTexture()
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, shadowMap)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
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

async function load_cubemap() {

    var cubemap = [
        cubemapDir + 'posx.png',
        cubemapDir + 'negx.png',
        cubemapDir + 'posy.png',
        cubemapDir + 'negy.png',
        cubemapDir + 'posz.png',
        cubemapDir + 'negz.png']
    
    gl.activeTexture(gl.TEXTURE2)
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

    for(var i = 0; i < 6; i++) {
        var image = document.createElement('img')
        image.crossorigin = 'anonymous'
        image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i
        image.onload = function(event) {
            var image = event.target
            gl.activeTexture(gl.TEXTURE2)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, cubemapIdx == 4)
            gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)

            g_tex_ready++
        }
        image.src = cubemap[i]
    }
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 2)

    while (g_tex_ready < 6) {
        await new Promise(r => setTimeout(r, 100))
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 3);

    g_tex_ready = 0
}
