import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const INPUT = 'c:/Users/varga/OneDrive/Documents/Personal/Code/klowk/assets/images/Klowk Waving.json';
const OUTPUT = 'c:/Users/varga/OneDrive/Documents/Personal/Code/klowk/assets/images/Klowk Waving Transparent.json';

// Color tolerance for flood fill from corners
const TOLERANCE = 30;

function colorDist(pixels, idx, r, g, b) {
  return Math.abs(pixels[idx] - r) + Math.abs(pixels[idx+1] - g) + Math.abs(pixels[idx+2] - b);
}

function floodFill(pixels, width, height, channels, seedX, seedY, tolerance) {
  const idx = (seedY * width + seedX) * channels;
  const seedR = pixels[idx], seedG = pixels[idx+1], seedB = pixels[idx+2];

  const visited = new Uint8Array(width * height);
  const queue = [seedY * width + seedX];
  visited[seedY * width + seedX] = 1;

  while (queue.length > 0) {
    const pos = queue.pop();
    const x = pos % width, y = (pos / width) | 0;
    const pi = pos * channels;
    pixels[pi + 3] = 0; // make transparent

    for (const [nx, ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const npos = ny * width + nx;
      if (visited[npos]) continue;
      visited[npos] = 1;
      if (colorDist(pixels, npos * channels, seedR, seedG, seedB) <= tolerance) {
        queue.push(npos);
      }
    }
  }
}

const lottie = JSON.parse(readFileSync(INPUT, 'utf8'));

console.log(`Processing ${lottie.assets.length} frames...`);

for (let i = 0; i < lottie.assets.length; i++) {
  const asset = lottie.assets[i];
  if (!asset.p || !asset.p.startsWith('data:image')) continue;

  const base64 = asset.p.split(',')[1];
  const imgBuffer = Buffer.from(base64, 'base64');

  const { data, info } = await sharp(imgBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  // Flood fill from all 4 corners
  floodFill(pixels, width, height, channels, 0, 0, TOLERANCE);
  floodFill(pixels, width, height, channels, width-1, 0, TOLERANCE);
  floodFill(pixels, width, height, channels, 0, height-1, TOLERANCE);
  floodFill(pixels, width, height, channels, width-1, height-1, TOLERANCE);

  const outBuffer = await sharp(Buffer.from(pixels), { raw: { width, height, channels } })
    .webp({ lossless: true })
    .toBuffer();

  asset.p = 'data:image/webp;base64,' + outBuffer.toString('base64');

  if ((i + 1) % 10 === 0 || i === lottie.assets.length - 1) {
    process.stdout.write(`\r  ${i + 1}/${lottie.assets.length} frames done`);
  }
}

console.log('\nWriting output...');
writeFileSync(OUTPUT, JSON.stringify(lottie));
console.log('Done! Saved to: assets/images/Klowk Waving Transparent.json');
