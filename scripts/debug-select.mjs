import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    'C:\\Users\\Pekay\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('console', m => console.log(`[console.${m.type()}]`, m.text()))

await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

await page.evaluate(() => {
  const el = document.querySelector('#reg-nationality')
  new MutationObserver(muts => {
    for (const m of muts) {
      console.log(`[mutation] ${m.attributeName} -> ${el.getAttribute(m.attributeName)}`)
    }
  }).observe(el, { attributes: true, attributeFilter: ['aria-expanded', 'data-state'] })
  document.addEventListener('pointerdown', e => console.log(`[doc] pointerdown defaultPrevented=${e.defaultPrevented}`), true)
  document.addEventListener('pointerdown', e => console.log(`[doc-bubble] pointerdown defaultPrevented=${e.defaultPrevented}`))
})

const trigger = page.locator('#reg-nationality')
await trigger.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)

console.log('--- locator.click() ---')
await trigger.click()
await page.waitForTimeout(800)
console.log('listboxes =', await page.locator('[role="listbox"]').count())

console.log('--- synthetic .click() ---')
await page.evaluate(() => document.querySelector('#reg-nationality').click())
await page.waitForTimeout(800)
console.log('listboxes =', await page.locator('[role="listbox"]').count())

await browser.close()
