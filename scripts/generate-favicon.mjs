import sharp from 'sharp'

// Generate favicon.ico from the 32px PNG
// Most modern browsers accept a PNG-derived .ico file

await sharp('public/favicon-32.png')
  .resize(32, 32)
  .toFile('public/favicon.ico')

console.log('favicon.ico generated from public/favicon-32.png')
