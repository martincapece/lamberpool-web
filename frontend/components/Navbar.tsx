export default function Navbar() {
  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">⚽ Lamberpool FC</div>
        <ul className="flex space-x-6">
          <li><a href="/" className="hover:text-blue-200">Inicio</a></li>
          <li><a href="/matches" className="hover:text-blue-200">Resultados</a></li>
          <li><a href="/players" className="hover:text-blue-200">Jugadores</a></li>
          <li><a href="/admin" className="hover:text-blue-200">Admin</a></li>
        </ul>
      </div>
    </nav>
  )
}
