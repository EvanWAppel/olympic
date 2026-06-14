// Generates the PWA icon set from an inline SVG (white footprint on solid blue).
// Run: node scripts/generate-icons.mjs
import sharp from "sharp"
import { mkdir } from "node:fs/promises"

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb"/>
  <g fill="#ffffff" transform="rotate(8 256 256)">
    <!-- sole + heel -->
    <ellipse cx="256" cy="280" rx="68" ry="86"/>
    <ellipse cx="256" cy="372" rx="46" ry="52"/>
    <!-- toes, big to little -->
    <circle cx="196" cy="158" r="30"/>
    <circle cx="252" cy="138" r="22"/>
    <circle cx="298" cy="146" r="18"/>
    <circle cx="334" cy="166" r="15"/>
    <circle cx="362" cy="194" r="12"/>
  </g>
</svg>
`

const targets = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
]

await mkdir("public/icons", { recursive: true })
for (const { file, size } of targets) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file)
  console.log("wrote", file)
}
