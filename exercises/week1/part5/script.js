"use strict";

var gl;
var points;
var NumPoints = 100;
var x = 0.5;
var r = 0.5;
var v = 0.5;
var g = -0.1;
var elasticity = 0.9;
var dt = 0.01;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    points = [];

    for ( var i = 0; i < NumPoints; ++i ) {
        var angle = 2 * Math.PI * i / NumPoints;
        var _x = Math.cos(angle) * r;
        var _y = Math.sin(angle) * r;
        points.push( vec2( _x, _y - 1 + r + x) );
    }

    // do simulation
    x += v * dt;
    v += g * dt;
    if (x < 0) {
        x = 0;
        v = -v * elasticity;
    }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, points.length );
}