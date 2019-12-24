const fs = require('fs')

const inputFile = '.Xresources'
const outputFile = 'swatch.svg'

const xresources = fs.readFileSync(inputFile, {encoding: 'utf8'})
const xcolors = {}
const regex = /(background|foreground|color[0-9]{1,2}):\s*(#[A-Fa-f0-9]{6})/g
let result
while ((result = regex.exec(xresources)) !== null) {
  xcolors[result[1]] = result[2]
}

const top = `<?xml version="1.0" encoding="utf-8" ?>
<svg id="drawing" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="1100" height="200">
`
const style = `
  <style>
    .hash {
      text-anchor: middle;
    }
    .name {
      text-anchor: middle;
    }
  </style>
`

const backgroundRect = `
  <rect width="1100" height="200" fill="${xcolors.background}"></rect>
`
function swatch(name, colorHash, x, y) {
  const isBackground = colorHash === xcolors.background
  return `
  <g>
    <rect width="100" height="50" fill="${colorHash}" x="${x}" y="${y}"></rect>
    <text class="name" fill="${isBackground ? xcolors.foreground : colorHash}" x="${x}" y="${y}">
      <tspan dx="50" dy="-10">${name}</tspan>
    </text>
    <text class="hash" fill="${isBackground ? xcolors.foreground : xcolors.background}" x="${x}" y="${y}">
      <tspan dx="50" dy="30">${colorHash}</tspan>
    </text>
  </g>
`
}

const bottom = `
</svg>
`

const outFile = fs.createWriteStream(outputFile)
outFile.on('open', () => {
  outFile.write(top)
  outFile.write(style)
  outFile.write(backgroundRect)

  xPos = 20
  yPos = 40

  function drawSwatch(name) {
    outFile.write(swatch(name, xcolors[name], xPos, yPos))
    if (xPos >= 960) {
      xPos = 20
      yPos += 90
    } else {
      xPos += 120
    }
  }

  drawSwatch('foreground')
  for (let i = 0; i < 8; i++) {
    drawSwatch(`color${i}`)
  }
  drawSwatch('background')
  for (let i = 8; i < 16; i++) {
    drawSwatch(`color${i}`)
  }

  outFile.write(bottom)
})

