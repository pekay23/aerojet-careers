import { z } from 'zod'

const isAdult = (d: string) => {
  if (!d) return true
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return new Date(d) <= cutoff
}

export const ApplicationStep1Schema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  country_of_residence: z.string().min(1, 'Country of residence is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required').refine(isAdult, 'Must be at least 18 years old'),
  deployment_pref: z.enum(['fully_flexible', 'ghana_only', 'not_available']),
})

export const ApplicationStep2Schema = z.object({
  licence_type: z.string().min(1, 'Licence type is required'),
  licence_number: z.string().optional(),
  issuing_authority: z.string().optional(),
  licence_expiry: z.string().optional(),
  type_ratings: z.array(z.string()).min(1, 'Select at least one type rating'),
  other_type_ratings: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  highest_qualification: z.string().optional(),
})

export const ApplicationStep3Schema = z.object({
  current_employer: z.string().min(2, 'Current employer is required'),
  job_title: z.string().optional(),
  role_start_date: z.string().optional(),
  role_end_date: z.string().optional(),
  total_years_exp: z.string().min(1, 'Years of experience is required'),
  work_types: z.array(z.string()).optional(),
  outstation_exp: z.string().optional(),
  stations_worked: z.string().optional(),
  notice_period: z.string().optional(),
  motivation: z.string().optional(),
})

export const ApplicationStep4Schema = z.object({
  current_salary: z.union([z.number(), z.nan()]).optional(),
  current_salary_currency: z.string().default('USD'),
  current_benefits: z.array(z.string()).optional(),
  total_package_approx: z.union([z.number(), z.nan()]).optional(),
  expected_min_usd: z.union([z.number(), z.nan()]).optional(),
  expected_target_usd: z.union([z.number(), z.nan()]).optional(),
  payment_preference: z.string().min(1, 'Payment preference is required'),
  accommodation_important: z.string().optional(),
  deployment_arrangement: z.string().optional(),
  earliest_start_date: z.string().optional(),
  additional_notes: z.string().optional(),
})

export const DepartmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().optional(),
  manager_id: z.string().uuid().nullish(),
  current_budget: z.number().nonnegative().optional(),
})

export const ApplicationSchema = ApplicationStep1Schema
  .merge(ApplicationStep2Schema.partial())
  .merge(ApplicationStep3Schema.partial())
  .merge(ApplicationStep4Schema.partial())
  .extend({
    job_id: z.string().uuid().nullable().optional(),
    job_title_applied: z.string().nullable().optional(),
    location_restrictions: z.string().nullable().optional(),
    availability: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    has_valid_passport: z.boolean().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role_start_date && data.role_end_date && data.role_end_date < data.role_start_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be after start date', path: ['role_end_date'] })
    }
    if (data.expected_min_usd && data.expected_target_usd && Number(data.expected_target_usd) < Number(data.expected_min_usd)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Target must be at least the minimum', path: ['expected_target_usd'] })
    }
  })

export const RegistrationSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  nationality: z.string().min(1, 'Nationality is required'),
  country: z.string().min(1, 'Country of residence is required'),
  years_experience: z.string().min(1, 'Years of experience is required'),
  qualification: z.string().min(1, 'Highest qualification is required'),
  source: z.string().optional(),
  statement: z.string().nullable().optional(),
  departments_interest: z.array(z.string()).default([]),
})
