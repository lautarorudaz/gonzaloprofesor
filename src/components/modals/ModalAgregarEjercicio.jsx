import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

const ZONAS = ["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Piernas", "Glúteos", "Abdomen", "Cardio"];
const ETAPAS = ["Movilidad", "Activación", "Zona central"];

export default function ModalAgregarEjercicio({ onClose }) {
    const [form, setForm] = useState({
        nombre: "",
        zona: "Pecho",
        etapa: "Movilidad",
        descripcion: "",
        videoUrl: "",
    });
    const [tipoVideo, setTipoVideo] = useState("youtube"); // "youtube" | "archivo"
    const [archivoVideo, setArchivoVideo] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre) {
            setError("El nombre es obligatorio");
            return;
        }
        setCargando(true);
        try {
            let videoArchivo = null;

            if (tipoVideo === "archivo" && archivoVideo) {
                videoArchivo = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(archivoVideo);
                });
            }

            await addDoc(collection(db, "ejercicios"), {
                nombre: form.nombre,
                zona: form.zona,
                etapa: form.etapa,
                descripcion: form.descripcion,
                videoUrl: tipoVideo === "youtube" ? form.videoUrl : "",
                videoArchivo: videoArchivo || "",
                creadoEn: serverTimestamp(),
            });
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
                    <h2 className="text-white font-semibold text-lg">Agregar ejercicio</h2>
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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Zona muscular</label>
                            <select name="zona" value={form.zona} onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500">
                                {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Etapa</label>
                            <select name="etapa" value={form.etapa} onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500">
                                {ETAPAS.map((et) => <option key={et} value={et}>{et}</option>)}
                            </select>
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

                    {/* Video */}
                    <div>
                        <label className="text-gray-400 text-xs mb-2 block">Video</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setTipoVideo("youtube")}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${tipoVideo === "youtube"
                                        ? "bg-orange-500 border-orange-500 text-white"
                                        : "border-gray-700 text-gray-400 hover:bg-gray-800"
                                    }`}
                            >
                                YouTube
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipoVideo("archivo")}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${tipoVideo === "archivo"
                                        ? "bg-orange-500 border-orange-500 text-white"
                                        : "border-gray-700 text-gray-400 hover:bg-gray-800"
                                    }`}
                            >
                                Archivo
                            </button>
                        </div>

                        {tipoVideo === "youtube" ? (
                            <input
                                name="videoUrl" value={form.videoUrl} onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        ) : (
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setArchivoVideo(e.target.files[0])}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-gray-300"
                            />
                        )}
                    </div>

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando}
                            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                            {cargando ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}