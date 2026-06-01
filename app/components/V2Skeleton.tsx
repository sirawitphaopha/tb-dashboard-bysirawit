'use client'

/**
 * V2Skeleton — โครงโหลด pulse teal (sidebar + header + KPI + chart + list)
 *
 * ใช้ร่วมระหว่าง:
 *   1. app/v2/TbAppMount.tsx — ระหว่าง dynamic import โหลด tb-monolith
 *   2. app/login/page.tsx — ระหว่าง redirect หลัง login สำเร็จ
 *
 * เป้าหมาย: continuity ระหว่าง login → dashboard (เห็นโครงเดียวกันต่อเนื่อง)
 *           user ไม่รู้สึกว่าเปลี่ยนหน้า (perceived speed)
 */

const PULSE = '#ccfbf1'      // teal-100
const PULSE_SOFT = '#e6faf6' // light teal
const BORDER = '#d1faf3'     // teal-tinted border

function Bar({
  w, h = 12, r = 6, soft = false, delay = 0, style,
}: {
  w: number | string; h?: number; r?: number; soft?: boolean; delay?: number; style?: React.CSSProperties
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: w, height: h, borderRadius: r,
        background: soft ? PULSE_SOFT : PULSE,
        animationDelay: `${delay}ms`,
        ...style,
      }}
    />
  )
}

export default function V2Skeleton({ label = 'กำลังโหลด TB JOURNEY & CARE...' }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 flex pointer-events-none"
      style={{ background: '#f0fdfa', zIndex: 9999, fontFamily: 'Sarabun, sans-serif' }}
      aria-hidden="true"
    >
      {/* ════════ SIDEBAR (white, 260px) ════════ */}
      <aside
        style={{
          width: 260, height: '100%', background: '#fff',
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}
      >
        {/* Logo bar */}
        <div style={{ height: 64, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${BORDER}` }}>
          <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: 12, background: PULSE }} />
          <Bar w={140} h={16} r={6} delay={80} />
        </div>

        {/* Nav items skeleton */}
        <div style={{ flex: 1, padding: '12px 10px', overflow: 'hidden' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const widths = [110, 150, 140, 160, 130, 145, 115, 135, 90, 145, 130, 145]
            const isDivider = i === 6
            return (
              <div key={i}>
                {isDivider && <div style={{ margin: '8px 6px', borderTop: `1px solid ${BORDER}` }} />}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 8px', borderRadius: 8, marginBottom: 2,
                    background: i === 0 ? PULSE_SOFT : 'transparent',
                  }}
                >
                  <Bar w={18} h={18} r={4} delay={i * 40} />
                  <Bar w={widths[i]} h={10} r={5} soft={i !== 0} delay={i * 40 + 30} />
                </div>
              </div>
            )
          })}
        </div>

        {/* User profile bottom */}
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
            <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: '50%', background: PULSE }} />
            <div style={{ flex: 1 }}>
              <Bar w={130} h={10} r={5} delay={50} />
              <div style={{ height: 6 }} />
              <Bar w={70} h={8} r={4} soft delay={100} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
            <Bar w={18} h={18} r={4} delay={150} />
            <Bar w={100} h={9} r={5} soft delay={200} />
          </div>
        </div>
      </aside>

      {/* ════════ MAIN AREA ════════ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header bar */}
        <header style={{ height: 64, background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0 }}>
          <Bar w={20} h={20} r={5} />
          <Bar w={120} h={16} r={6} delay={50} />
          <div style={{ flex: 1 }} />
          <Bar w={22} h={22} r={6} soft delay={100} />
          <Bar w={22} h={22} r={6} soft delay={150} />
          <Bar w={22} h={22} r={6} delay={200} />
        </header>

        {/* Content area */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
          {/* 4 KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                <div style={{ height: 3, background: PULSE }} className="animate-pulse" />
                <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="animate-pulse" style={{ width: 56, height: 56, borderRadius: 16, background: PULSE, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Bar w={120} h={10} r={5} soft delay={i * 70 + 100} />
                    <div style={{ height: 10 }} />
                    <Bar w={70} h={20} r={6} delay={i * 70 + 150} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2" style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BORDER}`, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <Bar w={140} h={12} r={6} />
                  <div style={{ height: 6 }} />
                  <Bar w={180} h={8} r={4} soft delay={50} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Bar w={70} h={28} r={10} soft delay={100} />
                  <Bar w={100} h={28} r={10} delay={150} />
                </div>
              </div>
              <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                {[35, 60, 45, 80, 50, 90, 65, 40, 95, 55, 70, 85].map((h, idx) => (
                  <div key={idx} className="animate-pulse" style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0', background: PULSE, animationDelay: `${idx * 50}ms` }} />
                ))}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BORDER}`, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ alignSelf: 'stretch', marginBottom: 14 }}>
                <Bar w={120} h={12} r={6} />
                <div style={{ height: 6 }} />
                <Bar w={150} h={8} r={4} soft delay={50} />
              </div>
              <div style={{ position: 'relative', width: 150, height: 150 }}>
                <div className="animate-pulse" style={{ width: '100%', height: '100%', borderRadius: '50%', background: PULSE }} />
                <div style={{ position: 'absolute', inset: 28, background: '#fff', borderRadius: '50%' }} />
              </div>
              <div style={{ alignSelf: 'stretch', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Bar w="80%" h={8} r={4} soft delay={120} />
                <Bar w="60%" h={8} r={4} soft delay={180} />
              </div>
            </div>
          </div>

          {/* Patient list row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2" style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BORDER}`, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Bar w={32} h={32} r={10} />
                  <div>
                    <Bar w={160} h={12} r={6} delay={50} />
                    <div style={{ height: 6 }} />
                    <Bar w={200} h={8} r={4} soft delay={100} />
                  </div>
                </div>
                <Bar w={56} h={22} r={11} soft delay={150} />
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
                  <div className="animate-pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: PULSE, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Bar w={180} h={10} r={5} delay={i * 80 + 200} />
                    <div style={{ height: 6 }} />
                    <Bar w={130} h={8} r={4} soft delay={i * 80 + 250} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Bar w={130} h={10} r={5} soft delay={i * 80 + 300} style={{ marginLeft: 'auto' }} />
                    <div style={{ height: 6 }} />
                    <Bar w={90} h={8} r={4} soft delay={i * 80 + 350} style={{ marginLeft: 'auto' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BORDER}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Bar w={100} h={12} r={6} />
              <Bar w={120} h={12} r={6} delay={50} />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <Bar w={90} h={48} r={10} delay={150} />
                <Bar w={50} h={10} r={5} soft delay={200} style={{ marginBottom: 6 }} />
              </div>
              <Bar w="100%" h={8} r={4} soft delay={250} />
            </div>
          </div>
        </div>

        {/* Loading badge bottom-right */}
        <div
          style={{
            position: 'absolute', bottom: 16, right: 24,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: '#0f766e', fontWeight: 600,
            background: '#fff', padding: '8px 14px', borderRadius: 999,
            border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(13,148,136,0.08)',
          }}
        >
          <span
            style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: '#14b8a6', animation: 'tbSkelDot 1.2s ease-in-out infinite',
            }}
          />
          <span>{label}</span>
        </div>
      </main>

      <style>{`
        @keyframes tbSkelDot {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
