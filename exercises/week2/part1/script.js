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
var points = []
var index = 0
var max_verts = 512
var canvas


window.onload = function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }


    points = [
        vec2(-0.5, -0.5),
        vec2(0, 0),
        vec2(0.5, 0.5),
    ]

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    // Load the data into the GPU
    var vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, max_verts * sizeof['vec2'], gl.STATIC_DRAW)

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // Add first 3 points
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(points))
    index += points.length

    // Callbacks
    canvas.addEventListener(
        "click",
        function() {
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
            var rectangle = event.target.getBoundingClientRect()
            var t = vec2(
                -1 + 2 * (event.clientX - rectangle.left) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rectangle.top) / canvas.height
            )
            gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(t))
            index++
        }
    )

    render()
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.POINTS, 0, index)

    requestAnimationFrame(render, canvas)
}
