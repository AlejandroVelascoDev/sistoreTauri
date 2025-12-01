import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="w-full bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow">
      <h1 className="text-lg font-semibold">Mi Aplicación</h1>

      <Link
        to="/dashboard"
        className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition"
      >
        Volver al Dashboard
      </Link>
    </header>
  );
}
