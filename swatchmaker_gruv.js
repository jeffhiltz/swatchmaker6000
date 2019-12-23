const convert = require('color-convert')
const program = require('commander')
const fs = require('fs')
const yaml = require('js-yaml')

program
  .requiredOption('-l, --layout <filename>', 'YAML file containing layout for swatches')
  .requiredOption('-c, --colours <filename>', 'YAML file with colour scheme')
  .requiredOption('-o, --output <filename>', 'SVG file to create/replace')

program.parse(process.argv)

const coloursFile = program.colours
const outputFile = program.output

const colourFileContents = yaml.safeLoad(fs.readFileSync(coloursFile, 'utf8'))
const colours = colourFileContents.vogel5000 // TODO hard-coded scheme name

// TODO hard-coded sizes.  put swatch dimensions in layout file
const swatchWidth = 120
const swatchHeight = 100
const borderWidth = (swatchWidth + swatchHeight) / 8

// file contains array of arrays.
// super array is rows
// subarrays are columns of colour names
const layout = yaml.safeLoad(fs.readFileSync(program.layout, 'utf8'))

const rowCount = layout.length
const colCount = layout.map(row => row.length).reduce((acc, curr) => Math.max(acc, curr))

const top = `<?xml version="1.0" encoding="utf-8" ?>
<svg id="drawing" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${(swatchWidth * colCount) + (2 * borderWidth)}" height="${(swatchHeight * rowCount) + (2 * borderWidth)}">
`
const style = `
  <style>
    .hash {
      text-anchor: middle;
      font-family: sans-serif;
      font-size: ${swatchHeight * 0.2}px;
    }
    .name {
      text-anchor: middle;
      font-family: sans-serif;
      font-size: ${swatchHeight * 0.2}px;
    }
    .lab {
      text-anchor: middle;
      font-family: sans-serif;
      font-size: ${swatchHeight * 0.1}px;
    }
  </style>
`

const backgroundRect = `
  <rect width="${(swatchWidth * colCount) + (2 * borderWidth)}" height="${(swatchHeight * rowCount) + (2 * borderWidth)}" fill="black"></rect>
`

function swatch(name, rowIdx, colIdx) {
  const x = (colIdx * swatchWidth) + borderWidth
  const y = (rowIdx * swatchHeight) + borderWidth
  const colorHash = colours[name]
  const labValues = convert.hex.lab(colorHash)
  const textColour = labValues[0] < 50 ? colours['grey10'] : colours['grey0']
  return `
  <g>
    <rect width="${swatchWidth}" height="${swatchHeight}" fill="${colorHash}" x="${x}" y="${y}"></rect>
    <text class="name" fill="${textColour}" x="${x}" y="${y}">
      <tspan dx="${swatchWidth / 2}" dy="${swatchHeight * 0.33}">${name}</tspan>
    </text>
    <text class="hash" fill="${textColour}" x="${x}" y="${y}">
      <tspan dx="${swatchWidth / 2}" dy="${swatchHeight * 0.66}">${colorHash}</tspan>
    </text>
    <text class="lab" fill="${textColour}" x="${x}" y="${y}">
      <tspan dx="${swatchWidth / 2}" dy="${swatchHeight * 0.84}">L:${labValues[0]} a:${labValues[1]} b:${labValues[2]}</tspan>
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

  layout.forEach((row, rowIdx) => {
    row.forEach((label, colIdx) => {
      if (label) outFile.write(swatch(label, rowIdx, colIdx))
    })
  })

  outFile.write(bottom)
})

