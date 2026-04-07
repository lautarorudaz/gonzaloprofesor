import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function Rutinas() {
    const [rutinas, setRutinas] = useState([]);
    const [tab, setTab] = useState("plantillas");
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "rutinas"), (snap) => {
            setRutinas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, []);

    const eliminarRutina = async (id) => {
        if (!confirm("¿Eliminar esta rutina?")) return;
        await deleteDoc(doc(db, "rutinas", id));
    };

    const plantillas = rutinas.filter((r) => r.esPlantilla);
    const asignadas = rutinas.filter((r) => !r.esPlantilla);

    const lista = tab === "plantillas" ? plantillas : asignadas;

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <Navbar />
            <main className="flex-1 md:ml-56 p-4 md:p-8 pb-24 md:pb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-bold">Rutinas</h2>
                    <button
                        onClick={() => navigate("/rutinas/nueva")}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        + Nueva rutina
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 mb-6 w-fit">
                    <button
                        onClick={() => setTab("plantillas")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "plantillas" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Plantillas ({plantillas.length})
                    </button>
                    <button
                        onClick={() => setTab("asignadas")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "asignadas" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Asignadas ({asignadas.length})
                    </button>
                </div>

                {/* Lista */}
                {lista.length === 0 ? (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500 text-sm">
                        {tab === "plantillas"
                            ? "No hay plantillas todavía. ¡Creá la primera!"
                            : "No hay rutinas asignadas a alumnos todavía."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lista.map((r) => (
                            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                                <div>
                                    <p className="font-semibold text-white">{r.nombre}</p>
                                    {r.descripcion && <p className="text-xs text-gray-500 mt-1">{r.descripcion}</p>}
                                </div>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <span>{r.semanas?.length || 0} semana{r.semanas?.length !== 1 ? "s" : ""}</span>
                                    <span>·</span>
                                    <span>{r.semanas?.[0]?.dias?.length || 0} días/semana</span>
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <button
                                        onClick={() => navigate(`/rutinas/${r.id}`)}
                                        className="flex-1 text-xs py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
                                    >
                                        Ver / Editar
                                    </button>
                                    {r.esPlantilla && (
                                        <button
                                            onClick={() => navigate(`/rutinas/nueva?plantilla=${r.id}`)}
                                            className="flex-1 text-xs py-1.5 rounded-lg border border-green-900 text-green-400 hover:bg-green-900/30 transition-colors"
                                        >
                                            Usar plantilla
                                        </button>
                                    )}
                                    <button
                                        onClick={() => eliminarRutina(r.id)}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/30 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}