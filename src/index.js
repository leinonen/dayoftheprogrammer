import './lib/polyfills'
import { createCanvas } from './lib/canvas'
import { compile, setBuffersAndAttributes, setUniforms } from './lib/shader'

import vertexShaderSource from './shaders/shader.vert'
import fragmentShaderSource from './shaders/shader.frag'

let gl;
let canvas;
let time = 0;
let start = 0;

let programInfo;
let bufferInfo;
let uniforms = {
  resolution: [0, 0],
  time: 0
};


function main() {
  console.log('Demo init')
  canvas = createCanvas()

  window.addEventListener('resize', handleResize);
  handleResize()

  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    alert('OpenGL could not be initialized.');
    return;
  }

  programInfo = compile(gl, vertexShaderSource, fragmentShaderSource)
  gl.useProgram(programInfo.program)

  bufferInfo = {
    attribs: {
      a_position: {
        buffer: gl.createBuffer(),
        numComponents: 2,
        arrays: new Float32Array([
          -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
          -1.0, 1.0, 1.0, -1.0, 1.0, 1.0
        ])
      }
    }
  }

  console.log('Demo Start')
  start = Date.now();

  render();
}

function render() {
  let elapsedtime = (Date.now() - start) / 1000.0;
  let framespeed = 1.0;

  time += framespeed * elapsedtime;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.clearColor(0.0, 0.0, 0.0, 1.0)

  uniforms.resolution = [gl.canvas.width, gl.canvas.height]
  uniforms.time = time

  gl.useProgram(programInfo.program);

  setBuffersAndAttributes(gl, programInfo, bufferInfo)
  setUniforms(programInfo, uniforms);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_position.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, bufferInfo.attribs.a_position.arrays, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  start = Date.now();
  window.requestAnimationFrame(render, canvas);
}

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = main
