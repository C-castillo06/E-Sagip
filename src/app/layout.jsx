import './globals.css';
import { Space_Grotesk, Inter } from 'next/font/google';

// next/font: downloads/self-hosts these Google fonts at build time and exposes
// them as CSS custom properties via the `variable` option (no external font requests at runtime).
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Next.js App Router: exporting `metadata` sets the page <title> and meta description.
export const metadata = {
  title: 'E-Sagip | Mobile Emergency App',
  description: 'Unified emergency dispatch console for Fire, Medical, and Rescue responders.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
