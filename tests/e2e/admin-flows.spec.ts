import { test, expect } from '@playwright/test'

test.describe('Admin authentication', () => {
  test('unauthenticated API access returns 401', async ({ request }) => {
    const res = await request.get('/api/admin/jobs')
    expect(res.status()).toBe(401)
  })

  test('invalid credentials return 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'nobody@aerojet-aviation.com', password: 'wrong' },
    })
    expect(res.status()).toBe(401)
  })

  test('missing fields return 400', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: '', password: '' },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('Admin jobs API', () => {
  test('requires authentication', async ({ request }) => {
    const res = await request.get('/api/admin/jobs')
    expect(res.status()).toBe(401)
  })

  test('POST validates required fields', async ({ request }) => {
    // Without auth, should get 401 before validation
    const res = await request.post('/api/admin/jobs', { data: {} })
    expect(res.status()).toBe(401)
  })
})

test.describe('Application submission', () => {
  test('POST validates email format', async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: {
        first_name: 'Test',
        last_name: 'User',
        email: 'not-an-email',
        phone: '12345678',
        nationality: 'Ghanaian',
        country_of_residence: 'Ghana',
        date_of_birth: '1990-01-01',
        deployment_pref: 'fully_flexible',
      },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('POST rejects missing required fields', async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: { email: 'test@example.com' },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('Registration', () => {
  test('POST validates registration fields', async ({ request }) => {
    const res = await request.post('/api/register', {
      data: {
        first_name: 'A', // too short
        last_name: 'B',  // too short
        email: 'invalid',
        nationality: '',
        country: '',
        years_experience: '',
        qualification: '',
      },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})

test.describe('File upload security', () => {
  test('rejects non-UUID application_id', async ({ request }) => {
    const res = await request.post('/api/upload', {
      multipart: {
        file: { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test') },
        application_id: '../../../etc/passwd',
        document_type: 'cv',
      },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects invalid document_type', async ({ request }) => {
    const res = await request.post('/api/upload', {
      multipart: {
        file: { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test') },
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        document_type: '../../etc',
      },
    })
    expect(res.status()).toBe(400)
  })
})
