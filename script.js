// WebGL animated shader background (inspired by Pierre's site)
const canvas = document.getElementById('bgCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

// Vertex shader (full-screen quad)
const vertexSrc = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }`;

// Fragment shader (animated gradient / noise pattern)
const fragmentSrc = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  void main() {
    // Normalize pixel coordinates to [0,1]
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    // Time varying values for animation
    float t = u_time * 0.2;
    float wave = sin(uv.x * 10.0 + t) + cos(uv.y * 10.0 + t);
    // Compute color channels using wave patterns
    float r = 0.5 + 0.5 * sin(wave + t);
    float g = 0.5 + 0.5 * sin(wave + t + 2.0);
    float b = 0.5 + 0.5 * sin(wave + t + 4.0);
    // Combine with high contrast
    vec3 color = vec3(r, g, b);
    // Optionally, tone down intensity by blending towards black
    color = mix(color, vec3(0.0), 0.2);  // 20% blend to black to reduce brightness
    gl_FragColor = vec4(color, 1.0);
  }`;

// Compile shaders
function compileShader(src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
  }
  return shader;
}
const vertexShader = compileShader(vertexSrc, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
// Create program and link
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error('Shader link error:', gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// Set up fullscreen quad vertices
const vertices = new Float32Array([
  -1, -1,  // bottom left
   1, -1,  // bottom right
  -1,  1,  // top left
   1,  1   // top right
]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
const positionLoc = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

// Get uniform locations
const timeLoc = gl.getUniformLocation(program, 'u_time');
const resLoc = gl.getUniformLocation(program, 'u_resolution');

// Resize canvas to full screen
function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  // Update resolution uniform
  gl.uniform2f(resLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // initial size setup

// Animation loop
let startTime = performance.now();
let animating = true;
function render() {
  if (!animating) return;  // stop animation if disabled
  // compute time in seconds
  let currentTime = (performance.now() - startTime) / 1000;
  gl.uniform1f(timeLoc, currentTime);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Toggle background animation on button click
document.getElementById('toggle-bg').addEventListener('click', () => {
  if (animating) {
    animating = false;
    // Pause animation and hide canvas (tone down)
    canvas.style.opacity = '0';
  } else {
    // Resume animation
    animating = true;
    startTime = performance.now();  // reset time or adjust if needed for continuity
    canvas.style.opacity = '1';
    requestAnimationFrame(render);
  }
});
