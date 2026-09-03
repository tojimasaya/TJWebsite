import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'data', 'gallery.json');
const THUMB_DIR = path.join(ROOT, 'assets', 'images', 'gallery', 'thumb');
const THUMB_WIDTH = 900;

function jpegSize(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const isStartOfFrame = [
      0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
      0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
    ].includes(marker);

    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2) break;
    offset += segmentLength + 2;
  }

  return null;
}

function pngSize(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function imageSize(buffer, extension) {
  if (/^\.jpe?g$/i.test(extension)) return jpegSize(buffer);
  if (/^\.png$/i.test(extension)) return pngSize(buffer);
  return null;
}

async function needsBuild(source, destination) {
  try {
    const [sourceStat, destinationStat] = await Promise.all([
      fs.stat(source),
      fs.stat(destination),
    ]);
    return sourceStat.mtimeMs > destinationStat.mtimeMs;
  } catch {
    return true;
  }
}

async function buildThumbnail(source, destination) {
  await execFileAsync('cwebp', [
    '-quiet',
    '-q', '74',
    '-m', '6',
    '-resize', String(THUMB_WIDTH), '0',
    source,
    '-o', destination,
  ]);
}

const originalJson = await fs.readFile(DATA_FILE, 'utf8');
const items = JSON.parse(originalJson);
await fs.mkdir(THUMB_DIR, { recursive: true });

let generated = 0;
for (const item of items) {
  if (!item.image || /^https?:\/\//i.test(item.image)) continue;

  const source = path.join(ROOT, item.image);
  const extension = path.extname(source);
  if (!/^\.(jpe?g|png)$/i.test(extension)) continue;

  const basename = path.basename(source, extension);
  const thumbnail = path.join(THUMB_DIR, `${basename}.webp`);
  const thumbnailPath = path.relative(ROOT, thumbnail).split(path.sep).join('/');
  const buffer = await fs.readFile(source);
  const dimensions = imageSize(buffer, extension);

  item.thumbnail = thumbnailPath;
  if (dimensions) {
    item.width = dimensions.width;
    item.height = dimensions.height;
  }

  if (await needsBuild(source, thumbnail)) {
    await buildThumbnail(source, thumbnail);
    generated += 1;
    console.log(`Generated ${thumbnailPath}`);
  }
}

const nextJson = `${JSON.stringify(items, null, 2)}\n`;
if (nextJson !== originalJson) {
  await fs.writeFile(DATA_FILE, nextJson, 'utf8');
  console.log('Updated data/gallery.json with thumbnail metadata');
}

console.log(`Gallery thumbnails generated: ${generated}`);
