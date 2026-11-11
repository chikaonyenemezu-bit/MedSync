import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusCare — Clinical Intake Platform',
  description: 'AI-assisted clinical intake and interoperability platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
