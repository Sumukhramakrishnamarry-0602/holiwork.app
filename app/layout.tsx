import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'holiwork — your whole life, organized',
  description: 'A calm workspace for your work, studies, money, and life.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
