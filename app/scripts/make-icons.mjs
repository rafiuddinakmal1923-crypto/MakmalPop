// Renders public/icon.svg to the PNG sizes the web app manifest needs. Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch()
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.screenshot({ path: new URL(`../public/icon-${size}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), omitBackground: false })
  await page.close()
}
await browser.close()
console.log('icons written')
