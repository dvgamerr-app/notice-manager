import { deflateSync } from 'node:zlib'

const WIDTH = 96
const HEIGHT = 96

export const avatarDefinitions = [
  { id: 'mint', label: 'Mint helper', color: '#06C755' },
  { id: 'sunset', label: 'Sunset helper', color: '#F97316' },
  { id: 'ocean', label: 'Ocean helper', color: '#0EA5E9' },
]

const palettes = {
  mint: { background: [232, 248, 239], face: [6, 199, 85], accent: [5, 143, 65] },
  sunset: { background: [255, 237, 213], face: [249, 115, 22], accent: [194, 65, 12] },
  ocean: { background: [224, 242, 254], face: [14, 165, 233], accent: [3, 105, 161] },
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

const crc32 = (value) => {
  let crc = 0xFFFFFFFF
  for (const byte of value) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

const pngChunk = (type, data = Buffer.alloc(0)) => {
  const name = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}

const avatarPixel = (id, x, y) => {
  const palette = palettes[id]
  const distance = Math.hypot(x - 48, y - 48)
  let color = palette.background
  if (distance <= 35) color = palette.face
  if (Math.hypot(x - 34, y - 41) <= 4 || Math.hypot(x - 62, y - 41) <= 4) {
    color = [255, 255, 255]
  }
  const smileDistance = Math.hypot(x - 48, y - 48)
  if (y >= 55 && y <= 66 && Math.abs(smileDistance - 18) <= 2.4) {
    color = [255, 255, 255]
  }
  if (Math.hypot(x - 75, y - 20) <= 8) color = palette.accent
  return color
}

const createAvatar = (id) => {
  const stride = WIDTH * 4 + 1
  const pixels = Buffer.alloc(stride * HEIGHT)
  for (let y = 0; y < HEIGHT; y += 1) {
    const row = y * stride
    pixels[row] = 0
    for (let x = 0; x < WIDTH; x += 1) {
      const [red, green, blue] = avatarPixel(id, x, y)
      const offset = row + 1 + x * 4
      pixels[offset] = red
      pixels[offset + 1] = green
      pixels[offset + 2] = blue
      pixels[offset + 3] = 255
    }
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(WIDTH, 0)
  header.writeUInt32BE(HEIGHT, 4)
  header[8] = 8
  header[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels, { level: 9 })),
    pngChunk('IEND'),
  ])
}

const generated = new Map(avatarDefinitions.map(({ id }) => [id, createAvatar(id)]))

export const getAvatarPng = (id) => generated.get(id) || null

export const getAvatarOptions = (publicBaseUrl = '') => avatarDefinitions.map((avatar) => ({
  ...avatar,
  previewUrl: `/app/avatars/${avatar.id}.png`,
  iconUrl: publicBaseUrl ? `${publicBaseUrl}/app/avatars/${avatar.id}.png` : null,
}))
