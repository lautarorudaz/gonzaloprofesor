import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function ModalEditarAlumno({ alumno, onClose }) {
    const [form, setForm] = useState({
        nombre: alumno.nombre || "",
        apellido: alumno.apellido || "",
        email: alumno.email || "",
        telefono: alumno.telefono || "",
        edad: alumno.edad || "",
        sucursal: alumno.sucursal || "Moreno",
    });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.apellido) {
            setError("Nombre y apellido son obligatorios");
            return;
        }
        setCargando(true);
        try {
            await updateDoc(doc(db, "alumnos", alumno.id), {
                ...form,
                edad: Number(form.edad),
            });
            onClose();
        } catch (err) {
            setError("Error al guardar. Intentá de nuevo.");
            setCargando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-semibold text-lg">Editar alumno</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nombre *</label>
                            <input name="nombre" value={form.nombre} onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Apellido *</label>
                            <input name="apellido" value={form.apellido} onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500" />
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Teléfono</label>
                            <input name="telefono" value={form.telefono} onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Edad</label>
                            <input name="edad" type="number" value={form.edad} onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                min="1" max="99" />
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Sucursal</label>
                        <select name="sucursal" value={form.sucursal} onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500">
                            <option value="Moreno">Moreno</option>
                            <option value="Edison">Edison</option>
                        </select>
                    </div>

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando}
                            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                            {cargando ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}