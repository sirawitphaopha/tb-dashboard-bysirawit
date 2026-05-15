import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TB CARE & JOURNEY — รพ.ปรางค์กู่',
  description: 'ระบบบริหารจัดการผู้ป่วยวัณโรค โรงพยาบาลปรางค์กู่',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="m-0 p-0" style={{ fontFamily: 'Sarabun, sans-serif' }}>{children}</body>
    </html>
  );
}
