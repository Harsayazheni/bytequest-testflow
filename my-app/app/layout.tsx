import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Testflow',
  description: 'A simple platform for teachers and students to manage tests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      <title>Testflow</title>
      <meta name="description" content="A simple platform for teachers and students to manage tests" />
      <link rel="icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        <nav className="p-4">
          <div> 
            <a href="/" className="text-xl font-bold">Back</a>
          </div>
          <div>
            <img src="/logo.png" height="50"></img>
          </div>
        </nav>
        <main className="container mx-auto mt-8 px-4">
          {children}
        </main>
      </body>
    </html>
  )
}

