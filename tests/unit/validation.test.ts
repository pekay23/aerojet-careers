import { describe, it, expect } from 'vitest'
import {
  ApplicationSchema,
  RegistrationSchema,
  ApplicationStep1Schema,
} from '@/lib/validation/schemas'

describe('Application Step 1 Schema', () => {
  it('validates a complete valid application step 1', () => {
    const result = ApplicationStep1Schema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+233241234567',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: '1990-01-01',
      deployment_pref: 'fully_flexible',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = ApplicationStep1Schema.safeParse({
      first_name: '',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['first_name'] })
      )
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['email'] })
      )
    }
  })

  it('rejects under-18 applicants', () => {
    const result = ApplicationStep1Schema.safeParse({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '12345678',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: new Date().getFullYear() - 15 + '-01-01',
      deployment_pref: 'not_available',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid deployment_pref enum', () => {
    const result = ApplicationStep1Schema.safeParse({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '12345678',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: '1990-01-01',
      deployment_pref: 'invalid_option',
    })
    expect(result.success).toBe(false)
  })
})

describe('Application Step 3 Schema (combined validation)', () => {
  it('validates experience data with end date before start date', () => {
    const result = ApplicationSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+233241234567',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: '1990-01-01',
      deployment_pref: 'fully_flexible',
      current_employer: 'Aerojet Aviation',
      total_years_exp: '5-10 years',
      role_start_date: '2023-01-01',
      role_end_date: '2022-01-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['role_end_date'] })
      )
    }
  })
})

describe('Application Step 4 Schema (combined validation)', () => {
  it('rejects target less than minimum', () => {
    const result = ApplicationSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+233241234567',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: '1990-01-01',
      deployment_pref: 'fully_flexible',
      payment_preference: 'monthly',
      expected_min_usd: 50000,
      expected_target_usd: 30000,
    })
    expect(result.success).toBe(false)
  })
})

describe('RegistrationSchema', () => {
  it('validates a complete registration', () => {
    const result = RegistrationSchema.safeParse({
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@example.com',
      nationality: 'Nigerian',
      country: 'Nigeria',
      years_experience: '3-5 years',
      qualification: 'Bachelor\'s Degree',
      departments_interest: ['Engineering', 'IT'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = RegistrationSchema.safeParse({
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'invalid-email',
      nationality: 'Nigerian',
      country: 'Nigeria',
      years_experience: '3-5 years',
      qualification: 'Bachelor\'s Degree',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short names', () => {
    const result = RegistrationSchema.safeParse({
      first_name: 'A',
      last_name: 'B',
      email: 'ab@example.com',
      nationality: 'Nigerian',
      country: 'Nigeria',
      years_experience: '3-5 years',
      qualification: 'Bachelor\'s Degree',
    })
    expect(result.success).toBe(false)
  })

  it('defaults departments_interest to empty array', () => {
    const result = RegistrationSchema.safeParse({
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@example.com',
      nationality: 'Nigerian',
      country: 'Nigeria',
      years_experience: '3-5 years',
      qualification: 'Bachelor\'s Degree',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.departments_interest).toEqual([])
    }
  })
})

describe('ApplicationSchema (full)', () => {
  it('validates a full application with all steps', () => {
    const result = ApplicationSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+233241234567',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: '1990-01-01',
      deployment_pref: 'fully_flexible',
      licence_type: 'EASA Part-FCL CPL ME IR',
      type_ratings: ['Boeing 737', ' Airbus A320'],
      current_employer: 'Aerojet Aviation',
      total_years_exp: '10-15 years',
      payment_preference: 'monthly',
    })
    expect(result.success).toBe(true)
  })

  it('parses combined application body from the frontend', () => {
    const frontendBody = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+233241234567',
      nationality: 'Ghanaian',
      country_of_residence: 'Ghana',
      date_of_birth: '1990-01-01',
      deployment_pref: 'fully_flexible',
      licence_type: 'EASA Part-FCL CPL ME IR',
      licence_number: '1234567',
      type_ratings: ['Boeing 737'],
      current_employer: 'Aerojet Aviation',
      total_years_exp: '10-15 years',
      payment_preference: 'monthly',
      source: 'LinkedIn',
      job_id: null,
      job_title_applied: null,
      location_restrictions: null,
      availability: null,
      has_valid_passport: false,
    }
    const result = ApplicationSchema.safeParse(frontendBody)
    expect(result.success).toBe(true)
  })
})
