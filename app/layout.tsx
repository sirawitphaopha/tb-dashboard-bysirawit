import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TB-CARE LINK — รพ.ปรางค์กู่',
  description: 'ระบบบริหารจัดการผู้ป่วยวัณโรค โรงพยาบาลปรางค์กู่',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <body className="h-full m-0 p-0 overflow-hidden">{children}</body>
    </html>
  );
}
