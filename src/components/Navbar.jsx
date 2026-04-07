import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
    const { pathname } = useLocation();

    const links = [
        { to: "/", label: "Inicio", icon: "⊞" },
        { to: "/ejercicios", label: "Ejercicios", icon: "◈" },
        { to: "/rutinas", label: "Rutinas", icon: "≡" },
    ];

    return (
        <>
            {/* Botón cerrar sesión mobile — esquina superior derecha */}
            <button
                onClick={() => signOut(auth)}
                className="md:hidden fixed top-4 right-4 z-50 bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 text-xs px-3 py-2 rounded-lg transition-colors"
            >
                Salir
            </button>

            {/* Sidebar en desktop */}
            <nav className="hidden md:flex fixed top-0 left-0 h-screen w-56 bg-gray-900 border-r border-gray-800 flex-col py-8 px-4 z-50">
                <h1 className="text-orange-500 font-bold text-xl mb-10 px-2">Antigravity</h1>
                <div className="flex flex-col gap-1 flex-1">
                    {links.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === l.to
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                                }`}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>
                <button
                    onClick={() => signOut(auth)}
                    className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-gray-800 text-left transition-colors"
                >
                    Cerrar sesión
                </button>
            </nav>

            {/* Barra inferior en mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 flex">
                {links.map((l) => (
                    <Link
                        key={l.to}
                        to={l.to}
                        className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${pathname === l.to ? "text-orange-500" : "text-gray-500"
                            }`}
                    >
                        <span className="text-lg leading-none mb-1">{l.icon}</span>
                        {l.label}
                    </Link>
                ))}
            </nav>
        </>
    );
}