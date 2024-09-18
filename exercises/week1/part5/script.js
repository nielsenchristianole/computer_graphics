"use strict";


/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas)
}


var gl;
var points;
var heightLoc;

var init_height = 1.0;
var init_v = 0;

var _height = init_height;
var _v = init_v;

var NumPoints = 100;
var r = 0.5
var g = -0.1;
var elasticity = 0.8;
var dt = 0.1;
var deltaFloor = 0.01;


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
        points.push( vec2( _x, _y - 1 + r) );
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

    heightLoc = gl.getUniformLocation(program, "height")

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    // do simulation
    _height += _v * dt;
    _v += g * dt;
    if (_height < 0) {
        _height = 0;
        _v = -_v * elasticity - 0.02;
    }
    if (_height <= deltaFloor && Math.abs(_v) <= deltaFloor) {
        _height = init_height;
        _v = init_v;
    }
    gl.uniform1f(heightLoc, _height)
    gl.drawArrays( gl.TRIANGLE_FAN, 0, points.length );

    requestAnimationFrame(render);
}