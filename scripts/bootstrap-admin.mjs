// Promote a user to admin + approved (bootstrap for first admin)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('./.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [k, ...rest] = line.split('=')
  if (k && rest.length) acc[k.trim()] = rest.join('=').trim()
  return acc
}, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const email = process.argv[2]
if (!email) { console.error('usage: node bootstrap-admin.mjs <email>'); process.exit(1) }

const { data, error } = await supabase
  .from('profiles')
  .update({ role: 'admin', status: 'approved', approved_at: new Date().toISOString() })
  .eq('email', email)
  .select('username, first_name, last_name, role, status')
  .single()

if (error) { console.error('Failed:', error.message); process.exit(1) }
if (!data) { console.error(`No profile found for: ${email}`); process.exit(1) }
console.log(`✅ Promoted to admin:`)
console.log(`   ${data.first_name} ${data.last_name} (@${data.username})`)
console.log(`   role: ${data.role} · status: ${data.status}`)
