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
var clearColor = [0.3921, 0.5843, 0.9294, 1.0]
var markerColor = [1.0, 1.0, 1.0, 1.0]

window.onload = function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }


    points = [
        vec2(-0.5, -0.5),
        vec2(0, 0),
        vec2(0.5, 0.5),
    ]

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(...clearColor)

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    // Load the data into the GPU
    var vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW)

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // Load the data into the GPU
    var cBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW)

    // Associate out shader variables with our data buffer
    var vColor = gl.getAttribLocation(program, "vColor")
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vColor)

    // Add first 3 points
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, points.length * sizeof['vec2'] * index, flatten(points))
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, points.length * sizeof['vec4'] * index, flatten(Array(points.length).fill(vec4(...markerColor))))
    index += points.length

    // Callbacks
    canvas.addEventListener(
        "click",
        function() {
            var rectangle = event.target.getBoundingClientRect()
            var t = vec2(
                -1 + 2 * (event.clientX - rectangle.left) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rectangle.top) / canvas.height
            )
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(t))
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * index, flatten([vec4(...markerColor)]))
            index++
        }
    )

    // Color menu
    var clearColorMenu = document.getElementById("ClearColorMenu")
    clearColorMenu.addEventListener(
        "click",
        function() {
            switch (clearColorMenu.selectedIndex) {
                case 0:
                    clearColor = [0.3921, 0.5843, 0.9294, 1.0]
                    break
                case 1:
                    clearColor = [0.0, 0.0, 0.0, 1.0]
                    break
                case 2:
                    clearColor = [0.3, 0.3, 0.3, 1.0]
                    break
                case 3:
                    clearColor = [1.0, 0.0, 1.1, 1.0]
                    break
            }
        }
    )

    // Marker color menu
    var markerColorMenu = document.getElementById("MarkerColorMenu")
    markerColorMenu.addEventListener(
        "click",
        function() {
            switch (markerColorMenu.selectedIndex) {
                case 0:
                    markerColor = [1.0, 1.0, 1.0, 1.0]
                    break
                case 1:
                    markerColor = [1.0, 0.0, 0.0, 1.0]
                    break
                case 2:
                    markerColor = [0.0, 1.0, 0.0, 1.0]
                    break
                case 3:
                    markerColor = [0.0, 0.0, 1.0, 1.0]
                    break
            }
        }
    )

    // Clear button
    document.getElementById("ClearButton").addEventListener(
        "click",
        function() {
            index = 0
            gl.clearColor(...clearColor)
        }
    )

    render()
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.POINTS, 0, index)

    requestAnimationFrame(render, canvas)
}
