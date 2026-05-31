'use client'

/**
 * HomeShell — v0.7.16.1 Phase 3 Step 2 (Teal-tinted Skeleton)
 *
 * บทเรียน: ทำ shell ที่เหมือนเว็บจริงเกินไป → user คิดว่าเว็บค้าง (รอข้อมูลแล้วไม่มา)
 * แก้: กลับไป skeleton แบบกล่อง pulse แต่ใช้ teal อ่อน (เข้ากับแบรนด์) ไม่ใช่เทากลาง
 * → user รู้ทันทีว่า "กำลังโหลด" ไม่ใช่ค้าง + ดูสบายตา + เข้าธีม TB JOURNEY & CARE
 *
 * Flow:
 *   1. Next.js SSR ส่ง shell pulse → paint ทันที (~50ms)
 *   2. iframe โหลด /app.html ใน background (opacity:0)
 *   3. tb-app.jsx App.useEffect → postMessage({type:'tb-app-ready'})
 *   4. parent ฟัง → fade skeleton ออก + iframe opacity:1 (0.35s)
 *   5. Safety: timeout 15s
 */

import { useEffect, useState } from 'react'

export default function HomeShell() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e?.data as { type?: string } | undefined
      if (data?.type === 'tb-app-ready') setReady(true)
    }
    window.addEventListener('message', onMessage)
    const timer = window.setTimeout(() => setReady(true), 15000)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#f0fdfa' }}>
      <iframe
        src="/app.html"
        title="TB JOURNEY & CARE"
        className="absolute inset-0 w-full h-full border-0"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.35s ease' }}
      />
      {!ready && <Skeleton />}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────
 * Skeleton — กล่อง pulse โทน teal อ่อน
 * Palette:
 *   bg outer:   #f0fdfa (teal-50)   — match กับ iframe bg
 *   panel bg:   #ffffff             — sidebar/card ขาว
 *   pulse fill: #ccfbf1 (teal-100)  — แถบ pulse
 *   pulse soft: #e0f7f3 (custom)    — pulse จาง
 *   border:     #d1faf3 (custom)    — เส้นกรอบ teal อ่อน
 * ─────────────────────────────────────────────────────────── */

const PULSE = '#ccfbf1'
const PULSE_SOFT = '#e6faf6'
const BORDER = '#d1faf3'

function Bar({
  w,
  h = 12,
  r = 6,
  soft = false,
  delay = 0,
  style,
}: {
  w: number | string
  h?: number
  r?: number
  soft?: boolean
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: soft ? PULSE_SOFT : PULSE,
        animationDelay: `${delay}ms`,
        ...style,
      }}
    />
  )
}

function Skeleton() {
  return (
    <div
      className="absolute inset-0 flex pointer-events-none"
      style={{ background: '#f0fdfa', animation: 'tbShellFade 0.2s ease' }}
      aria-hidden="true"
    >
      {/* ════════ SIDEBAR (white, 260px) ════════ */}
      <aside
        style={{
          width: 260,
          height: '100%',
          background: '#fff',
          borderRight: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo bar */}
        <div
          style={{
            height: 64,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div
            className="animate-pulse"
            style={{ width: 40, height: 40, borderRadius: 12, background: PULSE }}
          />
          <Bar w={140} h={16} r={6} delay={80} />
        </div>

        {/* Nav items skeleton — 12 รายการเท่าจริง */}
        <div style={{ flex: 1, padding: '12px 10px', overflow: 'hidden' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const widths = [110, 150, 140, 160, 130, 145, 115, 135, 90, 145, 130, 145]
            const isDivider = i === 6 || i === 11
            return (
              <div key={i}>
                {(isDivider && i !== 11) && (
                  <div style={{ margin: '8px 6px', borderTop: `1px solid ${BORDER}` }} />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 8px',
                    borderRadius: 8,
                    marginBottom: 2,
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
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 8 }}>
            <Bar w={160} h={6} r={3} soft delay={250} />
            <div style={{ height: 4 }} />
            <Bar w={110} h={6} r={3} soft delay={280} />
          </div>
        </div>
      </aside>

      {/* ════════ MAIN AREA ════════ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header bar */}
        <header
          style={{
            height: 64,
            background: '#fff',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <Bar w={20} h={20} r={5} />
          <Bar w={120} h={16} r={6} delay={50} />
          <div style={{ flex: 1 }} />
          <Bar w={22} h={22} r={6} soft delay={100} />
          <Bar w={22} h={22} r={6} soft delay={150} />
          <Bar w={22} h={22} r={6} delay={200} />
        </header>

        {/* Content area */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
          {/* ── 4 KPI cards (2x2 / 4-col lg) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: `1px solid ${BORDER}`,
                  overflow: 'hidden',
                  animation: `tbShellFade 0.3s ease ${i * 70}ms backwards`,
                }}
              >
                {/* Top stripe */}
                <div style={{ height: 3, background: PULSE }} className="animate-pulse" />
                <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    className="animate-pulse"
                    style={{ width: 56, height: 56, borderRadius: 16, background: PULSE, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <Bar w={120} h={10} r={5} soft delay={i * 70 + 100} />
                    <div style={{ height: 10 }} />
                    <Bar w={70} h={20} r={6} delay={i * 70 + 150} />
                  </div>
                  <Bar w={10} h={10} r={5} soft delay={i * 70 + 200} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts row: bar (2/3) + donut (1/3) ── */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="col-span-2"
              style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BORDER}`, padding: 20 }}
            >
              {/* Title row */}
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
              {/* Fake bars */}
              <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                {[35, 60, 45, 80, 50, 90, 65, 40, 95, 55, 70, 85].map((h, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse"
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: '6px 6px 0 0',
                      background: PULSE,
                      animationDelay: `${idx * 50}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Donut card */}
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: `1px solid ${BORDER}`,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ alignSelf: 'stretch', marginBottom: 14 }}>
                <Bar w={120} h={12} r={6} />
                <div style={{ height: 6 }} />
                <Bar w={150} h={8} r={4} soft delay={50} />
              </div>
              <div style={{ position: 'relative', width: 150, height: 150 }}>
                <div
                  className="animate-pulse"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: PULSE,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 28,
                    background: '#fff',
                    borderRadius: '50%',
                  }}
                />
              </div>
              <div style={{ alignSelf: 'stretch', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Bar w="80%" h={8} r={4} soft delay={120} />
                <Bar w="60%" h={8} r={4} soft delay={180} />
              </div>
            </div>
          </div>

          {/* ── Row 3: list (2/3) + side card (1/3) ── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Patient list-like card */}
            <div
              className="col-span-2"
              style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BORDER}`, padding: 20 }}
            >
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
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderTop: i > 0 ? `1px solid ${BORDER}` : 'none',
                    animation: `tbShellFade 0.3s ease ${i * 80 + 150}ms backwards`,
                  }}
                >
                  <div
                    className="animate-pulse"
                    style={{ width: 10, height: 10, borderRadius: '50%', background: PULSE, flexShrink: 0 }}
                  />
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

            {/* Side metric card */}
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: `1px solid ${BORDER}`,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Bar w={100} h={12} r={6} />
                  <div style={{ height: 6 }} />
                  <Bar w={120} h={12} r={6} delay={50} />
                </div>
                <Bar w={60} h={20} r={10} soft delay={100} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <Bar w={90} h={48} r={10} delay={150} />
                <Bar w={50} h={10} r={5} soft delay={200} style={{ marginBottom: 6 }} />
              </div>
              <Bar w="100%" h={8} r={4} soft delay={250} />
              <Bar w="100%" h={36} r={12} soft delay={300} />
            </div>
          </div>
        </div>

        {/* Loading badge bottom-right — บอกชัดว่ากำลังโหลด */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#0f766e',
            fontWeight: 600,
            background: '#fff',
            padding: '8px 14px',
            borderRadius: 999,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 2px 8px rgba(13,148,136,0.08)',
            fontFamily: 'Sarabun, sans-serif',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#14b8a6',
              animation: 'tbShellDot 1.2s ease-in-out infinite',
            }}
          />
          <span>กำลังโหลด TB JOURNEY &amp; CARE...</span>
        </div>
      </main>

      <style>{`
        @keyframes tbShellFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tbShellDot {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
