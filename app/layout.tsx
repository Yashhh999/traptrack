import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrapTrack',
  description: 'TrapTrack',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        {children}
        <footer className="mt-8 py-4 text-center text-sm text-gray-500">
          <a 
            href="https://github.com/Yashhh999/traptrack" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-700 underline"
          >
           Made By Yash
          </a>
        </footer>
      </body>
    </html>
  )
}
