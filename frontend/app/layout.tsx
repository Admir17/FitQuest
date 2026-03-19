'use client'

import { Provider } from 'jotai'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}