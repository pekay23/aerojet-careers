import { describe, it, expect } from 'vitest'
import { DepartmentSchema, RegistrationSchema } from '@/lib/validation/schemas'

describe('DepartmentSchema', () => {
  it('validates a correct department', () => {
    const result = DepartmentSchema.safeParse({ name: 'Engineering', code: 'ENG' })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = DepartmentSchema.safeParse({ code: 'ENG' })
    expect(result.success).toBe(false)
  })
})

describe('RegistrationSchema', () => {
  it('validates a correct registration', () => {
    const result = RegistrationSchema.safeParse({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '+233123456789',
      nationality: 'Ghanaian',
      country: 'Ghana',
      years_experience: '5 years',
      qualification: 'Bachelor degree',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = RegistrationSchema.safeParse({
      first_name: 'Test',
      last_name: 'User',
      email: 'not-an-email',
      nationality: 'Ghanaian',
      country: 'Ghana',
      years_experience: '5 years',
      qualification: 'Bachelor degree',
    })
    expect(result.success).toBe(false)
  })
})

describe('ApplicationSchema snake_case match', () => {
  it('uses snake_case fields matching the DB', async () => {
    const { ApplicationSchema } = await import('@/lib/validation/schemas')
    const result = ApplicationSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+233123456789',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: '1990-01-01',
      deployment_pref: 'fully_flexible',
      job_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })
})
