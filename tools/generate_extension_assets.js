const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT_DIR = path.resolve(__dirname, "..");
const ICON_DIR = path.join(ROOT_DIR, "extension", "icons");
const SIZES = [16, 32, 48, 128];

fs.mkdirSync(ICON_DIR, { recursive: true });

for (const size of SIZES) {
  const png = renderIcon(size);
  const outputPath = path.join(ICON_DIR, `icon${size}.png`);
  writeIfChanged(outputPath, png);
}

function writeIfChanged(outputPath, png) {
  if (fs.existsSync(outputPath) && fs.readFileSync(outputPath).equals(png)) {
    console.log(`Unchanged ${path.relative(ROOT_DIR, outputPath)}`);
    return;
  }

  fs.writeFileSync(outputPath, png);
  console.log(`Wrote ${path.relative(ROOT_DIR, outputPath)}`);
}

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = Math.max(3, Math.round(size * 0.18));
  const padding = Math.max(2, Math.round(size * 0.12));
  const tileGap = Math.max(1, Math.round(size * 0.035));
  const tileSize = Math.floor((size - padding * 2 - tileGap * 2) / 3);
  const origin = Math.floor((size - tileSize * 3 - tileGap * 2) / 2);
  const colors = [
    [255, 255, 255, 255],
    [45, 212, 191, 255],
    [250, 204, 21, 255],
    [96, 165, 250, 255]
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const inside = insideRoundedRect(x, y, size, size, radius);
      setPixel(pixels, size, x, y, inside ? [10, 10, 10, 255] : [0, 0, 0, 0]);
    }
  }

  const pattern = [
    [1, 0, 2],
    [0, 3, 0],
    [2, 0, 1]
  ];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const colorIndex = pattern[row][col];
      const x = origin + col * (tileSize + tileGap);
      const y = origin + row * (tileSize + tileGap);
      drawTile(pixels, size, x, y, tileSize, Math.max(1, Math.round(tileSize * 0.18)), colors[colorIndex]);
    }
  }

  return encodePng(size, size, pixels);
}

function drawTile(pixels, canvasSize, left, top, size, radius, color) {
  for (let y = top; y < top + size; y += 1) {
    for (let x = left; x < left + size; x += 1) {
      if (insideRoundedRect(x - left, y - top, size, size, radius)) {
        setPixel(pixels, canvasSize, x, y, color);
      }
    }
  }
}

function insideRoundedRect(x, y, width, height, radius) {
  const maxX = width - 1;
  const maxY = height - 1;
  const cx = x < radius ? radius : x > maxX - radius ? maxX - radius : x;
  const cy = y < radius ? radius : y > maxY - radius ? maxY - radius : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function setPixel(pixels, canvasSize, x, y, color) {
  const offset = (y * canvasSize + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function encodePng(width, height, rgba) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0;
    rgba.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0])
    ])),
    pngChunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const crcInput = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([
    uint32(data.length),
    typeBuffer,
    data,
    uint32(crc32(crcInput))
  ]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
