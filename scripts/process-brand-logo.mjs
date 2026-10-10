import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "assets", "brand");
const publicDirectory = path.join(root, "public");
const brandDirectory = path.join(publicDirectory, "brand");
const appDirectory = path.join(root, "src", "app");
const backgroundThreshold = 24;
const fullOpacityContrast = 52;

await mkdir(brandDirectory, { recursive: true });
await mkdir(appDirectory, { recursive: true });

function removeConnectedBackground(input, info) {
  const { width, height, channels } = info;
  const background = [0, 0, 0];
  const samplePoints = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
  ];

  for (const [x, y] of samplePoints) {
    const offset = (y * width + x) * channels;
    for (let channel = 0; channel < 3; channel += 1) {
      background[channel] += input[offset + channel] / samplePoints.length;
    }
  }

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * channels;
    const red = input[offset] - background[0];
    const green = input[offset + 1] - background[1];
    const blue = input[offset + 2] - background[2];
    const distance = Math.sqrt(red * red + green * green + blue * blue);
    const alpha = distance <= backgroundThreshold
      ? 0
      : Math.min(1, (distance - backgroundThreshold) / (fullOpacityContrast - backgroundThreshold));
    input[offset + 3] = Math.round(alpha * 255);
    if (alpha === 0) {
      input[offset] = 0;
      input[offset + 1] = 0;
      input[offset + 2] = 0;
    }
  }

  return input;
}

function removeClippedWhiteArtifact(input, info) {
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (index) => {
    if (visited[index]) return;
    const offset = index * channels;
    const red = input[offset];
    const green = input[offset + 1];
    const blue = input[offset + 2];
    const minimum = Math.min(red, green, blue);
    if (minimum < 100 || Math.max(red, green, blue) - minimum > 80) return;
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    input[index * channels + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  return input;
}

async function loadTransparentSource(fileName) {
  const { data, info } = await sharp(path.join(sourceDirectory, fileName))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  removeConnectedBackground(data, info);
  if (fileName.includes("-Mark")) removeClippedWhiteArtifact(data, info);
  return { data, info };
}

function recolorWordmarkForLightMode(data, info) {
  const { width, height, channels } = info;
  const textStart = Math.floor(width * 0.31);
  const textTop = Math.floor(height * 0.28);
  const textBottom = Math.ceil(height * 0.72);

  for (let y = textTop; y < textBottom; y += 1) {
    for (let x = textStart; x < width; x += 1) {
      const offset = (y * width + x) * channels;
      if (
        data[offset + 3] > 96 &&
        data[offset] > 185 &&
        data[offset + 1] > 185 &&
        data[offset + 2] > 185
      ) {
        data[offset] = 15;
        data[offset + 1] = 23;
        data[offset + 2] = 42;
      }
    }
  }
}

async function saveUpscaledWebp(data, info, outputFile, targetWidth) {
  await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .resize({ width: targetWidth, kernel: "lanczos3" })
    .sharpen(0.45)
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(brandDirectory, outputFile));
}

const mark = await loadTransparentSource("ScopeSync-Blue-Gradient-Mark.png");
const full = await loadTransparentSource("ScopeSync-Blue-Gradient-Full.png");
const lightFullData = Buffer.from(full.data);
recolorWordmarkForLightMode(lightFullData, full.info);

await Promise.all([
  saveUpscaledWebp(mark.data, mark.info, "ScopeSync-Blue-Gradient-Mark.webp", mark.info.width * 3),
  saveUpscaledWebp(full.data, full.info, "ScopeSync-Blue-Gradient-Full.webp", full.info.width * 1.5),
  saveUpscaledWebp(lightFullData, full.info, "ScopeSync-Blue-Gradient-Full-Light.webp", full.info.width * 1.5),
]);

// ImageResponse (opengraph-image) cannot decode WebP, so it reads this PNG instead.
await sharp(full.data, { raw: full.info })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
  .resize({ width: 1200, kernel: "lanczos3" })
  .png({ compressionLevel: 9 })
  .toFile(path.join(brandDirectory, "ScopeSync-Blue-Gradient-Full-og.png"));

const darkMark = await sharp(mark.data, { raw: mark.info })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
  .resize({ width: 104, height: 104, fit: "contain", kernel: "lanczos3" })
  .png()
  .toBuffer();

async function appIcon(size, scale = 0.72) {
  const markSize = Math.round(size * scale);
  const inset = Math.round((size - markSize) / 2);
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#05070D"/></svg>`,
  );

  return sharp(background)
    .composite([{ input: darkMark, left: inset, top: inset }])
    .png()
    .toBuffer();
}

const [icon192, icon512, maskable512, appleIcon, iconSvgPng] = await Promise.all([
  appIcon(192),
  appIcon(512),
  appIcon(512, 0.6),
  appIcon(180, 0.76),
  appIcon(128, 0.78),
]);
const faviconPng = await appIcon(256, 0.78);
const faviconHeader = Buffer.alloc(22);
faviconHeader.writeUInt16LE(0, 0);
faviconHeader.writeUInt16LE(1, 2);
faviconHeader.writeUInt16LE(1, 4);
faviconHeader.writeUInt8(0, 6);
faviconHeader.writeUInt8(0, 7);
faviconHeader.writeUInt8(0, 8);
faviconHeader.writeUInt8(0, 9);
faviconHeader.writeUInt16LE(1, 10);
faviconHeader.writeUInt16LE(32, 12);
faviconHeader.writeUInt32LE(faviconPng.length, 14);
faviconHeader.writeUInt32LE(faviconHeader.length, 18);
const favicon = Buffer.concat([faviconHeader, faviconPng]);

await Promise.all([
  writeFile(path.join(publicDirectory, "icon-192.png"), icon192),
  writeFile(path.join(publicDirectory, "icon-512.png"), icon512),
  writeFile(path.join(publicDirectory, "icon-maskable-512.png"), maskable512),
  writeFile(path.join(appDirectory, "apple-icon.png"), appleIcon),
  writeFile(path.join(appDirectory, "favicon.ico"), favicon),
  writeFile(
    path.join(appDirectory, "icon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,${iconSvgPng.toString("base64")}"/></svg>\n`,
  ),
]);

const [fullBuffer, fullInfo, markInfo] = await Promise.all([
  readFile(path.join(brandDirectory, "ScopeSync-Blue-Gradient-Full.webp")),
  sharp(path.join(brandDirectory, "ScopeSync-Blue-Gradient-Full.webp")).metadata(),
  sharp(path.join(brandDirectory, "ScopeSync-Blue-Gradient-Mark.webp")).metadata(),
]);

console.info("Processed transparent ScopeSync WebP logos and refreshed app icons.");
console.info(`Full logo: ${fullInfo.width}x${fullInfo.height}, ${fullBuffer.length} bytes`);
console.info(`Symbol: ${markInfo.width}x${markInfo.height}`);
