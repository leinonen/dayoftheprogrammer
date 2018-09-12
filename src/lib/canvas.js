export function createCanvas() {
  let canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.setAttribute('style', ' width: 100%; height: 100%;');
  document.body.appendChild(canvas)
  document.body.setAttribute('style', 'padding:0; margin: 0; background-color: black;')
  return canvas;
}
