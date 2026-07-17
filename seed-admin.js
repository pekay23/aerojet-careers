const { createClient } = require('@supabase/supabase-js')

require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE URL or SERVICE ROLE KEY in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  const email = 'admin@aerojet-aviation.com'
  const password = 'Admin@2026'

  // 1. Create User in Auth
  console.log('Creating auth user...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  let userId;

  if (authError) {
    if (authError.message.includes('already exists') || authError.status === 422) {
       console.log('User already exists in auth.users, proceeding to check admin_users table.')
       const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
       if (usersError) {
           console.error('Error fetching users:', usersError)
           process.exit(1)
       }
       const existingUser = usersData.users.find(u => u.email === email)
       if (!existingUser) {
           console.error('User not found despite "already exists" error.')
           process.exit(1)
       }
       userId = existingUser.id;
       // Update the password just in case they want it reset
       console.log('Updating password to Admin@2026...')
       await supabase.auth.admin.updateUserById(userId, { password })
    } else {
       console.error('Error creating user:', authError.message)
       process.exit(1)
    }
  } else {
    userId = authData.user.id;
    console.log('User created with ID:', userId)
  }

  // 2. Insert into admin_users
  console.log('Inserting into admin_users...')
  const { error: dbError } = await supabase
    .from('admin_users')
    .insert([
      {
        auth_user_id: userId,
        email: email,
        full_name: 'Admin User',
        role: 'admin'
      }
    ])

  if (dbError) {
    if (dbError.code === '23505') { // unique violation
      console.log('User is already in the admin_users table. Operation successful.')
    } else {
       console.error('Error inserting into admin_users:', dbError.message)
    }
  } else {
    console.log('Admin user successfully seeded into admin_users!')
  }
}

createAdmin()
