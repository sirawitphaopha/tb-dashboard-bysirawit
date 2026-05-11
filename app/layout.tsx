import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TB-CARE LINK — รพ.ปรางค์กู่',
  description: 'ระบบบริหารจัดการผู้ป่วยวัณโรค โรงพยาบาลปรางค์กู่',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="bg-slate-100">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-100 overflow-hidden">{children}</body>
    </html>
  );
}
