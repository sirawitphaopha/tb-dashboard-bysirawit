'use client'

/**
 * LoginSpinner — Simple teal spinner สำหรับโชว์ระหว่าง login redirect (แวบเดียว)
 *
 * Flow 3 ขั้น:
 *   1. กดเข้าสู่ระบบ → LoginSpinner (วงกลมหมุน + ข้อความ) ~0.5-1 วิ
 *   2. router.push('/') → V2Skeleton (โครงเทล sidebar+KPI pulse) ~1-2 วิ
 *   3. data fetched → ของจริง
 *
 * UX rationale: ขั้น 1 = บอกว่ากำลัง "เข้าสู่ระบบ", ขั้น 2 = บอกว่ากำลัง "เตรียมหน้า"
 *               psychological — รู้สึกระบบทำงานต่อเนื่อง ไม่กระโดด
 */

export default function LoginSpinner({ label = 'กำลังโหลด TB JOURNEY & CARE...' }: { label?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#f0fdfa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'Sarabun, sans-serif',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          border: '4px solid #ccfbf1',
          borderTopColor: '#0d9488',
          borderRadius: '50%',
          animation: 'tbSpin 0.8s linear infinite',
        }}
      />
      <div style={{ fontSize: 14, color: '#0f766e', fontWeight: 600 }}>{label}</div>
      <style>{`
        @keyframes tbSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
