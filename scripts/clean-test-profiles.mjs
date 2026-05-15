// ลบ profiles ทุกอันที่ไม่มี auth user คู่กัน (orphan profiles)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('./.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [k, ...rest] = line.split('=')
  if (k && rest.length) acc[k.trim()] = rest.join('=').trim()
  return acc
}, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: profiles } = await supabase.from('profiles').select('id, username, email')
console.log(`Found ${profiles.length} profiles:`)
profiles.forEach(p => console.log(`  - ${p.username} (${p.email})`))

if (profiles.length === 0) { console.log('Nothing to clean'); process.exit(0) }

console.log('\nDeleting all profiles + auth users...')
for (const p of profiles) {
  await supabase.auth.admin.deleteUser(p.id).catch(()=>{})
  await supabase.from('profiles').delete().eq('id', p.id)
  console.log(`  ✅ deleted ${p.username}`)
}
console.log('\n✨ Clean!')
