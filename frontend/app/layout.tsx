import type { Metadata } from 'next'
import Link from 'next/link'
import { Bebas_Neue, Manrope } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AdminLoginModal from '@/components/AdminLoginModal'

const displayFont = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
})

const bodyFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Lamberpool FC - Estadísticas',
  description: 'Plataforma de estadísticas y resultados del equipo Lamberpool FC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${bodyFont.className} bg-white text-gray-900`}>
        <AuthProvider>
          <header className="bg-black text-white shadow-lg border-b-4 border-red-600">
            <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
              <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
                {/* Logo y Título */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
                  <img 
                    src="/logo.jpeg" 
                    alt="Lamberpool FC" 
                    className="h-12 md:h-16 w-auto object-contain"
                  />
                  <div>
                    <h1 className={`${displayFont.className} text-3xl md:text-4xl tracking-wide`}>Lamberpool FC</h1>
                    <p className="text-xs md:text-sm text-gray-400">Estadísticas y Resultados</p>
                  </div>
                </Link>
                <nav className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm font-semibold">
                  <Link className="px-2 md:px-3 py-1 md:py-2 rounded bg-white/10 hover:bg-red-600 transition" href="/">
                    Inicio
                  </Link>
                  <Link className="px-2 md:px-3 py-1 md:py-2 rounded bg-white/10 hover:bg-red-600 transition" href="/matches">
                    Partidos
                  </Link>
                  <Link className="px-2 md:px-3 py-1 md:py-2 rounded bg-white/10 hover:bg-red-600 transition" href="/players">
                    Jugadores
                  </Link>
                  <Link className="px-2 md:px-3 py-1 md:py-2 rounded bg-white/10 hover:bg-red-600 transition" href="/history">
                    Historia
                  </Link>
                  <Link className="px-2 md:px-3 py-1 md:py-2 rounded bg-white/10 hover:bg-red-600 transition" href="/admin">
                    Admin
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
            {children}
          </main>
          <footer className="bg-black text-white mt-16 md:mt-24 border-t-4 border-red-600">
            <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 text-center">
              <p className="text-xs md:text-sm text-gray-400">&copy; 2024 Lamberpool FC. Todos los derechos reservados.</p>
            </div>
          </footer>
          <AdminLoginModal />
        </AuthProvider>
      </body>
    </html>
  )
}
