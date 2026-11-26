import "server-only";

const cache = new Map<string, { width: number; height: number }>();

function readU32BE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset);
}

function parsePng(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG")
    return null;
  return {
    width: readU32BE(buffer, 16),
    height: readU32BE(buffer, 20),
  };
}

function parseGif(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 10 || !buffer.toString("ascii", 0, 3).startsWith("GIF")) {
    return null;
  }
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function parseJpeg(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8)
    return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

function parseWebp(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF")
    return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)),
      height: 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)),
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits =
      buffer[21] | (buffer[22] << 8) | (buffer[23] << 16) | (buffer[24] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  return null;
}

function parseImageDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  return (
    parsePng(buffer) ??
    parseJpeg(buffer) ??
    parseWebp(buffer) ??
    parseGif(buffer)
  );
}

export async function probeImageDimensions(
  url: string,
): Promise<{ width: number; height: number } | null> {
  const hit = cache.get(url);
  if (hit) return hit;

  try {
    const response = await fetch(url, {
      headers: { Range: "bytes=0-65535" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const dims = parseImageDimensions(buffer);
    if (dims && dims.width > 0 && dims.height > 0) {
      cache.set(url, dims);
      return dims;
    }
  } catch {}
  return null;
}
