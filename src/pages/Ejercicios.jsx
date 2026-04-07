import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";
import ModalAgregarEjercicio from "../components/modals/ModalAgregarEjercicio";

const ZONAS = ["Todas", "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Piernas", "Glúteos", "Abdomen", "Cardio"];
const ETAPAS = ["Todas", "Movilidad", "Activación", "Zona central"];

export default function Ejercicios() {
    const [ejercicios, setEjercicios] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroZona, setFiltroZona] = useState("Todas");
    const [filtroEtapa, setFiltroEtapa] = useState("Todas");

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "ejercicios"), (snap) => {
            setEjercicios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, []);

    const eliminarEjercicio = async (id) => {
        if (!confirm("¿Eliminar este ejercicio?")) return;
        await deleteDoc(doc(db, "ejercicios", id));
    };

    const ejerciciosFiltrados = ejercicios.filter((e) => {
        const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const coincideZona = filtroZona === "Todas" || e.zona === filtroZona;
        const coincideEtapa = filtroEtapa === "Todas" || e.etapa === filtroEtapa;
        return coincideBusqueda && coincideZona && coincideEtapa;
    });

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <Navbar />
            <main className="flex-1 md:ml-56 p-4 md:p-8 pb-24 md:pb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-6">Ejercicios</h2>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar ejercicio..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 placeholder-gray-600"
                    />
                    <select
                        value={filtroZona}
                        onChange={(e) => setFiltroZona(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                    >
                        {ZONAS.map((z) => <option key={z} value={z}>{z === "Todas" ? "Todas las zonas" : z}</option>)}
                    </select>
                    <select
                        value={filtroEtapa}
                        onChange={(e) => setFiltroEtapa(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                    >
                        {ETAPAS.map((et) => <option key={et} value={et}>{et === "Todas" ? "Todas las etapas" : et}</option>)}
                    </select>
                </div>

                {/* Cabecera */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-semibold">
                        {ejerciciosFiltrados.length !== ejercicios.length && (
                            <span className="text-gray-500 text-sm font-normal">({ejerciciosFiltrados.length} resultados)</span>
                        )}
                    </h3>
                    <button
                        onClick={() => setModalAbierto(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 md:px-4 py-2 rounded-lg transition-colors"
                    >
                        + Agregar ejercicio
                    </button>
                </div>

                {/* Grid de ejercicios */}
                {ejerciciosFiltrados.length === 0 ? (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500 text-sm">
                        {ejercicios.length === 0
                            ? "No hay ejercicios todavía. ¡Agregá el primero!"
                            : "No se encontraron ejercicios con esos filtros."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {ejerciciosFiltrados.map((e) => (
                            <EjercicioCard key={e.id} ejercicio={e} onEliminar={eliminarEjercicio} />
                        ))}
                    </div>
                )}
            </main>

            {modalAbierto && (
                <ModalAgregarEjercicio
                    onClose={() => setModalAbierto(false)}
                />
            )}
        </div>
    );
}

function EjercicioCard({ ejercicio, onEliminar }) {
    const getVideoEmbed = (url) => {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const embedUrl = getVideoEmbed(ejercicio.videoUrl);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            {/* Media */}
            <div className="aspect-video bg-gray-800 relative">
                {embedUrl ? (
                    <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title={ejercicio.nombre}
                    />
                ) : ejercicio.videoArchivo ? (
                    <video src={ejercicio.videoArchivo} controls className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                        Sin video
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-2 flex-1">
                <p className="font-semibold text-white text-sm leading-tight">{ejercicio.nombre}</p>
                <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-300 font-medium">
                        {ejercicio.zona}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                        {ejercicio.etapa}
                    </span>
                </div>
                {ejercicio.descripcion && (
                    <p className="text-xs text-gray-500 line-clamp-2">{ejercicio.descripcion}</p>
                )}
                <button
                    onClick={() => onEliminar(ejercicio.id)}
                    className="mt-auto text-xs py-1.5 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/30 transition-colors"
                >
                    Eliminar
                </button>
            </div>
        </div>
    );
}