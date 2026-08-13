export type ApplicationStatus =
  | 'new' | 'under_review' | 'shortlisted' | 'interview'
  | 'offer' | 'hired' | 'rejected' | 'transferred_to_hr' | 'withdrawn'

export type JobStatus   = 'draft' | 'live'
export type JobCategory = 'experienced_professional' | 'graduate_program' | 'skilled_training' | 'general_application'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'trainee' | 'internship'
export type AdminRole = 'super_admin' | 'admin' | 'hr_manager' | 'recruiter' | 'employee' | 'read_only'
export type HRPlatform = 'bamboohr' | 'workday' | 'sap' | 'zoho' | 'csv' | 'custom'
export type EmploymentStatus = 'active' | 'on_leave' | 'terminated'

export interface Job {
  id: string
  ref_code: string | null
  title: string
  slug: string
  department: string
  category: JobCategory
  employment_type: EmploymentType
  location: string
  status: JobStatus
  target_count: number | null
  summary: string | null
  responsibilities: string | null
  requirements: string | null
  what_we_offer: string | null
  salary_range_min: number | null
  salary_range_max: number | null
  tags: string[]
  closes_at: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  application_count?: number
  indefinite_deadline?: boolean
  open_positions?: boolean
}

export interface Application {
  id: string
  ref_code: string
  job_id: string | null
  job_title: string | null
  first_name: string
  last_name: string
  email: string
  phone: string
  nationality: string
  country_of_residence: string
  date_of_birth: string | null
  has_valid_passport: boolean | null
  deployment_pref: string
  location_restrictions: string | null
  availability: string | null
  status: ApplicationStatus
  priority: number | null
  source: string | null
  assigned_to: string | null
  recruiter_notes: RecruiterNote[] | null
  rejection_reason: string | null
  hr_transferred: boolean
  hr_transferred_at: string | null
  hr_employee_id: string | null
  submitted_at: string
  reviewed_at: string | null
  shortlisted_at: string | null
  hired_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  qualifications?: ApplicationQualifications | null
  experience?: ApplicationExperience | null
  compensation?: ApplicationCompensation | null
  documents?: ApplicationDocument[]
}

export interface ApplicationQualifications {
  id: string
  application_id: string
  licence_type: string | null
  licence_number: string | null
  issuing_authority: string | null
  licence_expiry: string | null
  type_ratings: string[]
  other_type_ratings: string | null
  certifications: string[]
  highest_qualification: string | null
}

export interface ApplicationExperience {
  id: string
  application_id: string
  current_employer: string
  job_title: string | null
  role_start_date: string | null
  role_end_date: string | null
  total_years_exp: string | null
  work_types: string[]
  outstation_exp: string | null
  stations_worked: string | null
  notice_period: string | null
  motivation: string | null
}

export interface ApplicationCompensation {
  id: string
  application_id: string
  current_salary: number | null
  current_salary_currency: string
  current_benefits: string[]
  total_package_approx: number | null
  expected_min_usd: number | null
  expected_target_usd: number | null
  payment_preference: string | null
  accommodation_important: string | null
  deployment_arrangement: string | null
  earliest_start_date: string | null
  additional_notes: string | null
}

export interface ApplicationDocument {
  id: string
  application_id: string
  document_type: 'cv' | 'licence_scan' | 'passport_scan' | 'other'
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  storage_bucket: string
  uploaded_at: string
}

export interface PipelineEvent {
  id: string
  application_id: string
  admin_user_id: string | null
  event_type: string
  from_status: string | null
  to_status: string | null
  note: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface RecruiterNote {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface AdminUser {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  role: AdminRole
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface StaffProfile {
  id: string
  auth_user_id: string | null
  application_id: string | null
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  phone: string | null
  nationality: string | null
  date_of_birth: string | null
  employee_id: string | null
  job_title: string
  department: string
  reporting_manager_id: string | null
  employment_status: EmploymentStatus
  employment_type: EmploymentType
  joined_at: string
  bio: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  activeJobs: number
  totalJobs: number
  totalCandidates: number
  talentPoolCount: number
  newApplications: number
  hiredCount: number
}

export interface ApplicationFormData {
  // Step 1
  first_name: string
  last_name: string
  email: string
  phone: string
  nationality: string
  country_of_residence: string
  date_of_birth: string
  has_valid_passport: boolean
  deployment_pref: string
  location_restrictions?: string
  availability: string
  // Step 2
  licence_type: string
  licence_number?: string
  issuing_authority?: string
  licence_expiry?: string
  type_ratings: string[]
  other_type_ratings?: string
  certifications: string[]
  highest_qualification?: string
  highest_qualification_other?: string
  // Step 3
  current_employer: string
  job_title?: string
  role_start_date?: string
  role_end_date?: string
  total_years_exp: string
  work_types: string[]
  work_types_other?: string
  outstation_exp?: string
  stations_worked?: string
  notice_period?: string
  motivation?: string
  // Step 4
  current_salary?: number
  current_salary_currency?: string
  current_benefits?: string[]
  total_package_approx?: number
  expected_min_usd?: number
  expected_target_usd?: number
  payment_preference?: string
  accommodation_important?: string
  deployment_arrangement?: string
  deployment_arrangement_other?: string
  earliest_start_date?: string
  additional_notes?: string
  // Meta
  source?: string
  source_other?: string
  job_id?: string
  job_title_applied?: string
}

export interface StaffDocument {
  id: string
  staff_id: string
  folder_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface DocumentFolder {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}
