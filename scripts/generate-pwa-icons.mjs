import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// 主源图放在 assets/ 下（不参与部署），由它派生出页面与 PWA 使用的小尺寸图标
const source = "assets/logo.png";

const render = (size) =>
  sharp(source)
    .resize(size, size, { fit: "cover" })
    .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 });

// 180 是 apple-touch-icon 的规范尺寸，其余供 favicon 与 PWA manifest 使用
for (const size of [96, 180, 192, 512]) {
  await render(size).toFile(`public/icon-${size}.png`);
}

// favicon.ico 走 app/ 文件约定（浏览器还会直接请求 /favicon.ico），
// 条目按大到小排列：Next 用 image-size 读 ico 时只取首个条目的尺寸。
const icoSizes = [256, 128, 64, 48, 32, 16];
const icoImages = await Promise.all(
  icoSizes.map((size) => render(size).toBuffer()),
);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);

let offset = header.length + icoSizes.length * 16;
const directory = icoSizes.map((size, index) => {
  const entry = Buffer.alloc(16);
  // ICO 用 0 表示 256
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(icoImages[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += icoImages[index].length;
  return entry;
});

await writeFile(
  "app/favicon.ico",
  Buffer.concat([header, ...directory, ...icoImages]),
);

console.log("Site icons generated from assets/logo.png");
