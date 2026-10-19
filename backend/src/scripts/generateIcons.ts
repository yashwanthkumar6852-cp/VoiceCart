import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createVoiceCartPng(size: number): Buffer {
  const width = size;
  const height = size;

  // Uncompressed raw RGBA bitmap data (with filter byte 0 at start of each scanline)
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;
  const innerRadius = width * 0.35;

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    rawData[rowStart] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient or circle
      if (dist <= radius) {
        // VoiceCart Indigo/Purple Theme: #4f46e5 to #7c3aed
        const factor = (x + y) / (width * 2);
        const r = Math.round(79 + (124 - 79) * factor);
        const g = Math.round(70 + (58 - 70) * factor);
        const b = Math.round(229 + (237 - 229) * factor);

        // Draw inner microphone / shopping bag highlight in center
        if (Math.abs(dx) < width * 0.08 && dy >= -height * 0.15 && dy <= height * 0.1) {
          // Mic body (White)
          rawData[px] = 255;
          rawData[px + 1] = 255;
          rawData[px + 2] = 255;
          rawData[px + 3] = 255;
        } else if (dist < width * 0.12 && dy < -height * 0.08) {
          // Mic cap (White)
          rawData[px] = 255;
          rawData[px + 1] = 255;
          rawData[px + 2] = 255;
          rawData[px + 3] = 255;
        } else if (dist > width * 0.14 && dist < width * 0.18 && dy > -height * 0.05 && dy < height * 0.15) {
          // Mic stand arc (White)
          rawData[px] = 255;
          rawData[px + 1] = 255;
          rawData[px + 2] = 255;
          rawData[px + 3] = 255;
        } else if (Math.abs(dx) < width * 0.03 && dy >= height * 0.15 && dy <= height * 0.22) {
          // Mic base stand (White)
          rawData[px] = 255;
          rawData[px + 1] = 255;
          rawData[px + 2] = 255;
          rawData[px + 3] = 255;
        } else if (Math.abs(dx) < width * 0.1 && dy >= height * 0.22 && dy <= height * 0.25) {
          // Mic base plate (White)
          rawData[px] = 255;
          rawData[px + 1] = 255;
          rawData[px + 2] = 255;
          rawData[px + 3] = 255;
        } else {
          rawData[px] = r;
          rawData[px + 1] = g;
          rawData[px + 2] = b;
          rawData[px + 3] = 255;
        }
      } else {
        // Transparent outside rounded circle
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type 6
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = data.length;
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const chunkCrc = crc32(typeAndData);

  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  chunk.writeUInt32BE(chunkCrc, 8 + len);

  return chunk;
}

const publicDir = path.resolve('c:/Users/Yashwanth Kumar/Desktop/V3/frontend/public');
const icon192 = createVoiceCartPng(192);
const icon512 = createVoiceCartPng(512);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

console.log('✅ Created valid 192x192 and 512x512 PNG app icons in frontend/public');
