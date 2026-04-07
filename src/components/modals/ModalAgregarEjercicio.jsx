import { useState } from "react";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

const ZONAS = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
    "Piernas", "Glúteos", "Abdomen", "Cardio",
    "Abductores", "Aductores", "Gemelos", "Lumbares", "Trapecio", "Antebrazos"
];
const ETAPAS = ["Movilidad", "Activación", "Zona central"];

export default function ModalAgregarEjercicio({ onClose, ejercicio }) {
    const esEdicion = !!ejercicio;

    const [form, setForm] = useState({
        nombre: ejercicio?.nombre ?? "",
        zonas: Array.isArray(ejercicio?.zonas)
            ? ejercicio.zonas
            : ejercicio?.zona ? [ejercicio.zona] : [],
        etapas: Array.isArray(ejercicio?.etapas)
            ? ejercicio.etapas
            : ejercicio?.etapa ? [ejercicio.etapa] : [],
        descripcion: ejercicio?.descripcion ?? "",
        videoUrl: ejercicio?.videoUrl ?? "",
    });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleCheck = (field, value) => {
        setForm((prev) => {
            const arr = prev[field];
            return {
                ...prev,
                [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre) { setError("El nombre es obligatorio"); return; }
        if (form.zonas.length === 0) { setError("Seleccioná al menos una zona muscular"); return; }
        if (form.etapas.length === 0) { setError("Seleccioná al menos una etapa"); return; }

        setCargando(true);
        try {
            const datos = {
                nombre: form.nombre,
                zonas: form.zonas,
                etapas: form.etapas,
                descripcion: form.descripcion,
                videoUrl: form.videoUrl,
            };

            if (esEdicion) {
                await updateDoc(doc(db, "ejercicios", ejercicio.id), datos);
            } else {
                await addDoc(collection(db, "ejercicios"), {
                    ...datos,
                    creadoEn: serverTimestamp(),
                });
            }
            onClose();
        } catch (err) {
            setError("Error al guardar. Intentá de nuevo.");
            setCargando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-semibold text-lg">
                        {esEdicion ? "Editar ejercicio" : "Agregar ejercicio"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Nombre *</label>
                        <input
                            name="nombre" value={form.nombre} onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                            placeholder="Ej: Press de banca"
                        />
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs mb-2 block">Zona muscular</label>
                        <div className="flex flex-wrap gap-2">
                            {ZONAS.map((z) => (
                                <label key={z} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    form.zonas.includes(z)
                                        ? "bg-orange-500/20 border-orange-500 text-orange-300"
                                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                                }`}>
                                    <input type="checkbox" className="hidden"
                                        checked={form.zonas.includes(z)}
                                        onChange={() => toggleCheck("zonas", z)}
                                    />
                                    {z}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs mb-2 block">Etapa</label>
                        <div className="flex flex-wrap gap-2">
                            {ETAPAS.map((et) => (
                                <label key={et} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    form.etapas.includes(et)
                                        ? "bg-orange-500/20 border-orange-500 text-orange-300"
                                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                                }`}>
                                    <input type="checkbox" className="hidden"
                                        checked={form.etapas.includes(et)}
                                        onChange={() => toggleCheck("etapas", et)}
                                    />
                                    {et}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Descripción</label>
                        <textarea
                            name="descripcion" value={form.descripcion} onChange={handleChange}
                            rows={3}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 resize-none"
                            placeholder="Descripción opcional del ejercicio..."
                        />
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Video de YouTube</label>
                        <input
                            name="videoUrl" value={form.videoUrl} onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando}
                            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                            {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}