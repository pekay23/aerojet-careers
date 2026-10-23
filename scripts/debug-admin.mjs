import { chromium } from '@playwright/test'

const BASE = 'http://localhost:3000'
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    'C:\\Users\\Pekay\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe',
})
const context = await browser.newContext()
await context.addCookies([
  { name: 'aj_session', value: process.env.ADMIN_COOKIE, url: BASE },
])
const page = await context.newPage()
const res = await page.goto(`${BASE}/admin/jobs`, { waitUntil: 'domcontentloaded' })
console.log('status:', res.status(), 'url:', page.url())
console.log('cookies:', (await context.cookies()).map(c => `${c.name}=${c.value.slice(0, 12)}...`))
console.log('comboboxes:', await page.locator('button[role="combobox"]').count())
await browser.close()
