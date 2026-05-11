'use client';
import dynamic from 'next/dynamic';

const TBApp = dynamic(() => import('../components/TBApp'), { ssr: false });

export default function Page() {
  return <TBApp />;
}
