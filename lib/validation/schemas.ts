import { z } from 'zod'

const isAdult = (d: string) => {
  if (!d) return true
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return new Date(d) <= cutoff
}

export const ApplicationStep1Schema = z.object({
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  deployment_pref: z.enum(['fully_flexible', 'ghana_only', 'not_available']),
})

export const ApplicationStep2Schema = z.object({
  licence_type: z.string().min(1, 'Select your licence type'),
  licence_number: z.string().optional(),
  issuing_authority: z.string().optional(),
  licence_expiry: z.string().optional(),
  type_ratings: z.array(z.string()).min(1, 'Select at least one type rating'),
  other_type_ratings: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  highest_qualification: z.string().optional(),
})

export const ApplicationStep3Schema = z.object({
  current_employer: z.string().min(2, 'Enter your current employer'),
  job_title: z.string().optional(),
  role_start_date: z.string().optional(),
  role_end_date: z.string().optional(),
  total_years_exp: z.string().min(1, 'Select your total years of experience'),
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
  payment_preference: z.string().min(1, 'Select your payment preference'),
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
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  nationality: z.string().min(1, 'Select your nationality'),
  country: z.string().min(1, 'Select your country of residence'),
  years_experience: z.string().min(1, 'Select your years of experience'),
  qualification: z.string().min(1, 'Select your highest qualification'),
  source: z.string().optional(),
  statement: z.string().nullable().optional(),
  departments_interest: z.array(z.string()).default([]),
})

// ── Wizard step schemas (used by ApplicationForm.tsx) ───────────────────────
// These are simplified per-step validations for the multi-step form.
export const WizardStep1Schema = z.object({
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  deployment_pref: z.enum(['fully_flexible', 'ghana_only', 'not_available']),
})

export const WizardStep2Schema = z.object({
  licence_type: z.string().min(1, 'Select your licence type'),
  type_ratings: z.array(z.string()).min(1, 'Select at least one type rating'),
})

export const WizardStep3Schema = z
  .object({
    current_employer: z.string().min(2, 'Enter your current employer'),
    total_years_exp: z.string().min(1, 'Select your total years of experience'),
    role_start_date: z.string().optional(),
    role_end_date: z.string().optional(),
  })
  .refine(
    (d) => !d.role_start_date || !d.role_end_date || d.role_end_date >= d.role_start_date,
    { message: 'End date must be after start date', path: ['role_end_date'] }
  )

export const WizardStep4Schema = z
  .object({
    payment_preference: z.string().min(1, 'Select your payment preference'),
    expected_min_usd: z.union([z.number(), z.nan()]).optional(),
    expected_target_usd: z.union([z.number(), z.nan()]).optional(),
  })
  .refine(
    (d) =>
      !d.expected_min_usd ||
      !d.expected_target_usd ||
      Number(d.expected_target_usd) >= Number(d.expected_min_usd),
    { message: 'Target must be at least the minimum', path: ['expected_target_usd'] }
  )

// ── Skilled Training Track Schemas ─────────────────────────────────────────────
// Streamlined forms for trainee programmes — only essential fields for admin/recruiter review

export const EngineeringTrackSchema = z.object({
  // Personal
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  has_valid_passport: z.boolean(),

  // Education — specific to Engineering track entry requirements
  waec_maths_grade: z.enum(['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']).optional(),
  waec_physics_grade: z.enum(['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']).optional(),
  waec_not_applicable: z.boolean().optional(), // for non-West African applicants
  highest_qualification: z.enum(['WAEC/WASSCE', 'OND', 'HND', "Bachelor's Degree", "Master's Degree", 'Other']),
  qualification_details: z.string().optional(), // institution, field, year

  // Track-specific
  preferred_engineering_role: z.enum([
    'Trainee Aircraft Mechanics',
    'Engine Technicians (Trainee)',
    'Electrical Technicians (Trainee)',
    'Skins, Repairs & Composites (Trainee)',
  ]),
  deployment_pref: z.enum(['fully_flexible', 'ghana_only', 'not_available']),
  shift_availability_confirmed: z.boolean(),
  medical_fitness_confirmed: z.boolean(),
  accra_based_confirmed: z.boolean(),

  // Documents & motivation
  cv_file: z.instanceof(File).optional(), // handled separately in multipart
  motivation: z.string().min(50, 'Please provide at least 50 characters explaining your interest'),
  source: z.string().optional(),
})

export const RampTrackSchema = z.object({
  // Personal
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  has_valid_passport: z.boolean(),

  // Education — specific to Ramp track entry requirements
  waec_english_grade: z.enum(['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']).optional(),
  waec_not_applicable: z.boolean().optional(), // for non-West African applicants
  highest_qualification: z.enum(['WAEC/WASSCE', 'OND', 'HND', "Bachelor's Degree", "Master's Degree", 'Other']),
  qualification_details: z.string().optional(),

  // Driving licence (required for Ramp track)
  driving_licence_type: z.enum(['Light Vehicle (B)', 'Heavy Goods Vehicle (C)', 'Public Service Vehicle (D)', 'Other', 'None']),
  driving_licence_expiry: z.string().optional(),

  // Track-specific
  preferred_ramp_role: z.enum([
    'Ground Handling Operatives (Trainee)',
    'Aircraft Marshalling Technicians',
    'Aircraft Fuelling Technicians',
    'Cargo & Baggage Handling',
  ]),
  shift_availability_confirmed: z.boolean(),
  night_weekend_holiday_shifts_confirmed: z.boolean(),
  physical_fitness_confirmed: z.boolean(),
  airside_security_clearance_eligible: z.boolean(),

  // Documents & motivation
  cv_file: z.instanceof(File).optional(),
  motivation: z.string().min(50, 'Please provide at least 50 characters explaining your interest'),
  source: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.shift_availability_confirmed) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'You must confirm shift availability', path: ['shift_availability_confirmed'] })
  }
  if (!data.night_weekend_holiday_shifts_confirmed) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'You must confirm night/weekend/holiday shift availability', path: ['night_weekend_holiday_shifts_confirmed'] })
  }
  if (!data.physical_fitness_confirmed) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'You must confirm physical fitness for ramp environment', path: ['physical_fitness_confirmed'] })
  }
  if (!data.airside_security_clearance_eligible) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'You must confirm airside security clearance eligibility', path: ['airside_security_clearance_eligible'] })
  }
})

export const GraduateProgramSchema = z.object({
  // Personal
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  has_valid_passport: z.boolean(),

  // Education
  degree: z.string().min(2, 'Enter your degree title (e.g., BSc Mechanical Engineering)'),
  university: z.string().min(2, 'Enter your university name'),
  graduation_year: z.coerce.number().int().min(2015).max(new Date().getFullYear()),
  grade_gpa: z.string().optional(), // e.g., "First Class", "3.8/4.0", "Distinction"

  // Programme preferences
  preferred_areas: z.array(z.enum([
    'Engineering',
    'Information Technology',
    'Operations',
    'Human Resources',
    'Customer Support',
    'Sales',
    'Logistics',
    'Quality',
  ])).min(1, 'Select at least one programme area'),

  // Experience
  internships_attachments: z.string().optional(), // describe relevant internships/projects

  // Documents & motivation
  cv_file: z.instanceof(File).optional(),
  motivation: z.string().min(50, 'Please provide at least 50 characters explaining your interest in the Aerojet Graduate Program'),
  source: z.string().optional(),
})

// ── Client-side step schemas (no refinements, for .pick() compatibility) ───────

export const EngineeringTrackStep1Schema = z.object({
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  has_valid_passport: z.boolean(),
})

export const EngineeringTrackStep2Schema = z.object({
  waec_maths_grade: z.enum(['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']).optional(),
  waec_physics_grade: z.enum(['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']).optional(),
  waec_not_applicable: z.boolean().optional(),
  highest_qualification: z.enum(['WAEC/WASSCE', 'OND', 'HND', "Bachelor's Degree", "Master's Degree", 'Other']),
  qualification_details: z.string().optional(),
})

export const EngineeringTrackStep3Schema = z.object({
  preferred_engineering_role: z.enum([
    'Trainee Aircraft Mechanics',
    'Engine Technicians (Trainee)',
    'Electrical Technicians (Trainee)',
    'Skins, Repairs & Composites (Trainee)',
  ]),
  deployment_pref: z.enum(['fully_flexible', 'ghana_only', 'not_available']),
  shift_availability_confirmed: z.boolean(),
  medical_fitness_confirmed: z.boolean(),
  accra_based_confirmed: z.boolean(),
}).refine(
  (d) => d.shift_availability_confirmed === true,
  { message: 'You must confirm shift availability', path: ['shift_availability_confirmed'] }
).refine(
  (d) => d.medical_fitness_confirmed === true,
  { message: 'You must confirm medical fitness', path: ['medical_fitness_confirmed'] }
).refine(
  (d) => d.accra_based_confirmed === true,
  { message: 'You must confirm Accra-based availability', path: ['accra_based_confirmed'] }
)

export const RampTrackStep1Schema = z.object({
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  has_valid_passport: z.boolean(),
})

export const RampTrackStep2Schema = z.object({
  waec_english_grade: z.enum(['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']).optional(),
  waec_not_applicable: z.boolean().optional(),
  highest_qualification: z.enum(['WAEC/WASSCE', 'OND', 'HND', "Bachelor's Degree", "Master's Degree", 'Other']),
  qualification_details: z.string().optional(),
  driving_licence_type: z.enum(['Light Vehicle (B)', 'Heavy Goods Vehicle (C)', 'Public Service Vehicle (D)', 'Other', 'None']),
  driving_licence_expiry: z.string().optional(),
})

export const RampTrackStep3Schema = z.object({
  preferred_ramp_role: z.enum([
    'Ground Handling Operatives (Trainee)',
    'Aircraft Marshalling Technicians',
    'Aircraft Fuelling Technicians',
    'Cargo & Baggage Handling',
  ]),
  shift_availability_confirmed: z.boolean(),
  night_weekend_holiday_shifts_confirmed: z.boolean(),
  physical_fitness_confirmed: z.boolean(),
  airside_security_clearance_eligible: z.boolean(),
}).refine(
  (d) => d.shift_availability_confirmed === true,
  { message: 'You must confirm shift availability', path: ['shift_availability_confirmed'] }
).refine(
  (d) => d.night_weekend_holiday_shifts_confirmed === true,
  { message: 'You must confirm night/weekend/holiday shift availability', path: ['night_weekend_holiday_shifts_confirmed'] }
).refine(
  (d) => d.physical_fitness_confirmed === true,
  { message: 'You must confirm physical fitness', path: ['physical_fitness_confirmed'] }
).refine(
  (d) => d.airside_security_clearance_eligible === true,
  { message: 'You must confirm airside security clearance eligibility', path: ['airside_security_clearance_eligible'] }
)

export const GraduateProgramStep1Schema = z.object({
  first_name: z.string().min(2, 'Input your first name'),
  last_name: z.string().min(2, 'Input your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  nationality: z.string().min(1, 'Select your nationality'),
  country_of_residence: z.string().min(1, 'Select your country of residence'),
  date_of_birth: z.string().min(1, 'Enter your date of birth').refine(isAdult, 'You must be at least 18 years old'),
  has_valid_passport: z.boolean(),
})

export const GraduateProgramStep2Schema = z.object({
  degree: z.string().min(2, 'Enter your degree title (e.g., BSc Mechanical Engineering)'),
  university: z.string().min(2, 'Enter your university name'),
  graduation_year: z.coerce.number().int().min(2015).max(new Date().getFullYear()),
  grade_gpa: z.string().optional(),
})

export const GraduateProgramStep3Schema = z.object({
  preferred_areas: z.array(z.enum([
    'Engineering',
    'Information Technology',
    'Operations',
    'Human Resources',
    'Customer Support',
    'Sales',
    'Logistics',
    'Quality',
  ])).min(1, 'Select at least one programme area'),
  internships_attachments: z.string().optional(),
})