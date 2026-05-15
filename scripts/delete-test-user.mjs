// Quick script to delete test user account (auth + profile cascade)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('./.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [k, ...rest] = line.split('=')
  if (k && rest.length) acc[k.trim()] = rest.join('=').trim()
  return acc
}, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const emailToDelete = process.argv[2]
if (!emailToDelete) { console.error('usage: node delete-test-user.mjs <email>'); process.exit(1) }

const { data: { users } } = await supabase.auth.admin.listUsers()
const user = users.find(u => u.email === emailToDelete)
if (!user) { console.log(`No user found with email: ${emailToDelete}`); process.exit(0) }

const { error } = await supabase.auth.admin.deleteUser(user.id)
if (error) { console.error('Delete failed:', error.message); process.exit(1) }
console.log(`✅ Deleted user: ${emailToDelete}`)
