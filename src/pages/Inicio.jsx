import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";
import ModalAgregarAlumno from "../components/modals/ModalAgregarAlumno";
import ModalEditarAlumno from "../components/modals/ModalEditarAlumno";

export default function Inicio() {
    const [alumnos, setAlumnos] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [alumnoEditando, setAlumnoEditando] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [filtroSucursal, setFiltroSucursal] = useState("Todas");
    const [filtroRutina, setFiltroRutina] = useState("Todas");

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "alumnos"), (snap) => {
            setAlumnos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, []);

    const eliminarAlumno = async (id) => {
        if (!confirm("¿Eliminar este alumno?")) return;
        await deleteDoc(doc(db, "alumnos", id));
    };

    const alumnosFiltrados = alumnos.filter((a) => {
        const nombreCompleto = `${a.nombre} ${a.apellido}`.toLowerCase();
        const coincideBusqueda = nombreCompleto.includes(busqueda.toLowerCase());
        const coincideSucursal = filtroSucursal === "Todas" || a.sucursal === filtroSucursal;
        const coincideRutina =
            filtroRutina === "Todas" ||
            (filtroRutina === "Con rutina" && a.tieneRutina) ||
            (filtroRutina === "Sin rutina" && !a.tieneRutina);
        return coincideBusqueda && coincideSucursal && coincideRutina;
    });

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <Navbar />

            <main className="flex-1 md:ml-56 p-4 md:p-8 pb-24 md:pb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-6">Panel de control</h2>

                {/* Tarjetas resumen */}
                <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8 md:max-w-lg">
                    <div className="bg-gray-900 rounded-xl p-4 md:p-5 border border-gray-800">
                        <p className="text-gray-400 text-xs md:text-sm mb-1">Total alumnos</p>
                        <p className="text-2xl md:text-3xl font-bold">{alumnos.length}</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 md:p-5 border border-gray-800">
                        <p className="text-gray-400 text-xs md:text-sm mb-1">Con rutina</p>
                        <p className="text-2xl md:text-3xl font-bold">
                            {alumnos.filter((a) => a.tieneRutina).length}
                        </p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o apellido..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 placeholder-gray-600"
                    />
                    <select
                        value={filtroSucursal}
                        onChange={(e) => setFiltroSucursal(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                    >
                        <option value="Todas">Todas las sucursales</option>
                        <option value="Moreno">Moreno</option>
                        <option value="Edison">Edison</option>
                    </select>
                    <select
                        value={filtroRutina}
                        onChange={(e) => setFiltroRutina(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                    >
                        <option value="Todas">Con y sin rutina</option>
                        <option value="Con rutina">Con rutina</option>
                        <option value="Sin rutina">Sin rutina</option>
                    </select>
                </div>

                {/* Cabecera */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-semibold">
                        Alumnos {alumnosFiltrados.length !== alumnos.length && (
                            <span className="text-gray-500 text-sm font-normal">({alumnosFiltrados.length} resultados)</span>
                        )}
                    </h3>
                    <button
                        onClick={() => setModalAbierto(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 md:px-4 py-2 rounded-lg transition-colors"
                    >
                        + Agregar alumno
                    </button>
                </div>

                {/* Lista */}
                {alumnosFiltrados.length === 0 ? (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500 text-sm">
                        {alumnos.length === 0
                            ? "No hay alumnos todavía. ¡Agregá el primero!"
                            : "No se encontraron alumnos con esos filtros."}
                    </div>
                ) : (
                    <>
                        {/* Tabla — solo desktop */}
                        <div className="hidden md:block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        <th className="text-left text-gray-400 font-medium px-4 py-3">Nombre</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3">Edad</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3">Sucursal</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3">Teléfono</th>
                                        <th className="text-center text-gray-400 font-medium px-4 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alumnosFiltrados.map((a) => (
                                        <tr key={a.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium">{a.nombre} {a.apellido}</td>
                                            <td className="px-4 py-3 text-gray-400">{a.edad || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.sucursal === "Moreno"
                                                        ? "bg-blue-900/50 text-blue-300"
                                                        : "bg-purple-900/50 text-purple-300"
                                                    }`}>
                                                    {a.sucursal}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">{a.telefono || "—"}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 justify-center">
                                                    <button className="text-xs px-3 py-1 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors">
                                                        Ver rutina
                                                    </button>
                                                    <button className="text-xs px-3 py-1 rounded-lg border border-green-900 text-green-400 hover:bg-green-900/30 transition-colors">
                                                        Agregar rutina
                                                    </button>
                                                    <button
                                                        onClick={() => setAlumnoEditando(a)}
                                                        className="text-xs px-3 py-1 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors">
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarAlumno(a.id)}
                                                        className="text-xs px-3 py-1 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/30 transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Tarjetas — solo mobile */}
                        <div className="md:hidden flex flex-col gap-3">
                            {alumnosFiltrados.map((a) => (
                                <div key={a.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="font-semibold text-white">{a.nombre} {a.apellido}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.sucursal === "Moreno"
                                                ? "bg-blue-900/50 text-blue-300"
                                                : "bg-purple-900/50 text-purple-300"
                                            }`}>
                                            {a.sucursal}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-400 mb-4">
                                        {a.edad && <span>{a.edad} años</span>}
                                        {a.telefono && <span>{a.telefono}</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="text-xs py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors">
                                            Ver rutina
                                        </button>
                                        <button className="text-xs py-2 rounded-lg border border-green-900 text-green-400 hover:bg-green-900/30 transition-colors">
                                            Agregar rutina
                                        </button>
                                        <button
                                            onClick={() => setAlumnoEditando(a)}
                                            className="text-xs py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors">
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => eliminarAlumno(a.id)}
                                            className="text-xs py-2 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/30 transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>

            {modalAbierto && (
                <ModalAgregarAlumno
                    onClose={() => setModalAbierto(false)}
                    onAlumnoAgregado={() => { }}
                />
            )}

            {alumnoEditando && (
                <ModalEditarAlumno
                    alumno={alumnoEditando}
                    onClose={() => setAlumnoEditando(null)}
                />
            )}
        </div>
    );
}