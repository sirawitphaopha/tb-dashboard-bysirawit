'use client'

interface Props {
  show: boolean
  onClick: () => void
}

export default function PasswordEye({ show, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#0d9488', padding: '4px', lineHeight: 0, display: 'flex', alignItems: 'center',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* เส้นโค้งล่าง — อยู่เสมอ */}
        <path d="M2 12 C7 18 17 18 22 12" />

        {/* เส้นโค้งบน (เปลือกตาบน) — พับลงเมื่อหลับตา */}
        <path
          d="M2 12 C7 6 17 6 22 12"
          style={{
            transformBox: 'fill-box',
            transformOrigin: '50% 100%',
            transform: show ? 'scaleY(1)' : 'scaleY(0)',
            transition: 'transform 0.12s ease',
          }}
        />

        {/* ลูกตา — หดหายเมื่อหลับตา */}
        <circle
          cx="12" cy="12" r="3"
          fill="currentColor" stroke="none"
          style={{
            transformBox: 'fill-box',
            transformOrigin: '50% 50%',
            transform: show ? 'scale(1)' : 'scale(0)',
            transition: 'transform 0.12s ease',
          }}
        />
      </svg>
    </button>
  )
}
