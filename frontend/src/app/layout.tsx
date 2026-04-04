import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Humanize AI Content Tool',
  description: 'Transform AI-generated text into authentic human-sounding content using Gemini 2.5 Flash',
  keywords: ['AI humanizer', 'AI content detector', 'humanize text', 'AI writing tool'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a0f] text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
