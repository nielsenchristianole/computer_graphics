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

var circleResolution = 128
var maxCircleVerts = 128 * circleResolution
var maxPointVerts = 512
var maxTriangleVerts = 512

var clearColor = [0.3921, 0.5843, 0.9294, 1.0]
var markerColor = [1.0, 1.0, 1.0, 1.0]
var addMode = "points" // points, triangle, or circle

var pointsIndex = 0
var trianglesIndex = 0
var triangleBufferIndex = 0 // where to store intermediate points for triangles
var circleIndex = 0
var circleBuffer = null // where to store intermediate point for circles


window.onload = function init() {

    var canvas = document.getElementById("gl-canvas")

    gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert("WebGL isn't available") }

    var points = [
        vec2(-0.5, -0.5),
        vec2(0, 0),
        vec2(0.5, 0.5),
    ]

    // configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(...clearColor)

    // load shaders
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)
    var maxVerts = maxPointVerts + maxTriangleVerts + maxCircleVerts

    // points to gpu
    var vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec2'], gl.STATIC_DRAW)

    var vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    // colors to gpu
    var cBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec4'], gl.STATIC_DRAW)

    var vColor = gl.getAttribLocation(program, "vColor")
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vColor)

    // Add first 3 points
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * pointsIndex, flatten(points))
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * pointsIndex, flatten(Array(points.length).fill(vec4(...markerColor))))
    pointsIndex += points.length


    // Callbacks
    canvas.addEventListener(
        "click",
        function(event) {
            
            // where to add the point
            var rectangle = event.target.getBoundingClientRect()
            var t = vec2(
                -1 + 2 * (event.clientX - rectangle.left) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rectangle.top) / canvas.height
            )

            switch (addMode) {
                case "points":
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
                    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * pointsIndex, flatten(t))
                    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
                    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * pointsIndex, flatten([vec4(...markerColor)]))
                    pointsIndex++
                    console.log("Adding point at", t)
                    break

                case "triangle":
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
                    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * (maxPointVerts + trianglesIndex + triangleBufferIndex), flatten(t))
                    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
                    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * (maxPointVerts + trianglesIndex + triangleBufferIndex), flatten([vec4(...markerColor)]))
                    triangleBufferIndex++

                    if (triangleBufferIndex >= 3) {
                        trianglesIndex += 3
                        triangleBufferIndex = 0
                        console.log("Adding triangle")
                    } else {
                        console.log("Adding triangle point at", t)
                    }
                    break

                case "circle":
                    if (circleBuffer === null) {
                        console.log("Adding circlecenter at", t)
                        circleBuffer = t
                        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
                        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * (maxPointVerts + maxTriangleVerts + circleIndex), flatten(t))
                        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
                        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * (maxPointVerts + maxTriangleVerts + circleIndex), flatten([vec4(...markerColor)]))
                    } else {
                        console.log("Adding circle")
                        var radius = length(subtract(t, circleBuffer))
                        var circle_perf = []
                        for (let i = 0; i < circleResolution - 2; i++) {
                            var angle = 2 * Math.PI * i / (circleResolution - 2)
                            circle_perf.push(add(circleBuffer, scale(radius, vec2(Math.cos(angle), Math.sin(angle)))))
                        }
                        circle_perf.push(circle_perf[0])

                        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
                        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * (maxPointVerts + maxTriangleVerts + circleIndex + 1), flatten(circle_perf))
                        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
                        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * (maxPointVerts + maxTriangleVerts + circleIndex + 1), flatten(Array(circle_perf.length).fill(vec4(...markerColor))))
                        circleIndex += circle_perf.length + 1
                        circleBuffer = null
                        console.log("Circle added with num points ", circle_perf.length, circleIndex)
                    }
                    break
            }
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
            pointsIndex = 0
            trianglesIndex = 0
            triangleBufferIndex = 0
            circleIndex = 0
            circleBuffer = null
            gl.clearColor(...clearColor)
        }
    )

    // Add points button
    document.getElementById("AddPointsButton").addEventListener(
        "click",
        function() {
            addMode = "points"
            console.log("Switched to points mode")
        }
    )

    // Add triangle button
    document.getElementById("AddTriangleButton").addEventListener(
        "click",
        function() {
            addMode = "triangle"
            console.log("Switched to triangle mode")
        }
    )

    // Add circle button
    document.getElementById("AddCircleButton").addEventListener(
        "click",
        function() {
            addMode = "circle"
            console.log("Switched to circle mode")
        }
    )

    render()
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (pointsIndex > 0) {
        gl.drawArrays(gl.POINTS, 0, pointsIndex)
    }
    if (trianglesIndex > 0) {
        gl.drawArrays(gl.TRIANGLES, maxPointVerts, trianglesIndex)
    }
    if (triangleBufferIndex > 0) {
        gl.drawArrays(gl.POINTS, maxPointVerts + trianglesIndex, triangleBufferIndex)
    }
    for (let i = 0; i < circleIndex; i += circleResolution) {
        gl.drawArrays(gl.TRIANGLE_FAN, maxPointVerts + maxTriangleVerts + i, circleResolution)
    }
    if (circleBuffer !== null) {
        gl.drawArrays(gl.POINTS, maxPointVerts + maxTriangleVerts + circleIndex, 1)
    }

    requestAnimationFrame(render, canvas)
}
