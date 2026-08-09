import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('homepage loads with stats', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Careers at Aerojet Aviation/i)
    await expect(page.getByRole('heading', { name: /Find Your Place at Aerojet/i })).toBeVisible()
  })

  test('jobs page lists open positions', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page).toHaveTitle(/Open Positions/i)
  })

  test('register page loads with form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('button', { name: /Register My Interest/i })).toBeVisible()
  })

  test('login page loads for admin', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('button', { name: /Log In/i })).toBeVisible()
  })

  test('protected admin route redirects to login', async ({ page }) => {
    await page.goto('/admin/jobs')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})

test.describe('Public stats API', () => {
  test('returns activeJobs and departments', async ({ request }) => {
    const res = await request.get('/api/stats')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('activeJobs')
    expect(body.data).toHaveProperty('departments')
    expect(typeof body.data.activeJobs).toBe('number')
    expect(typeof body.data.departments).toBe('number')
  })
})

test.describe('Metadata API', () => {
  test('returns departments, categories, employment_types', async ({ request }) => {
    const res = await request.get('/api/admin/metadata')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveProperty('departments')
    expect(body.data).toHaveProperty('categories')
    expect(body.data).toHaveProperty('employment_types')
    expect(Array.isArray(body.data.departments)).toBe(true)
    expect(body.data.departments.length).toBeGreaterThan(0)
  })
})
