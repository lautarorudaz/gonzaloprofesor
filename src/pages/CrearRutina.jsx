import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";

const ETAPAS = ["Movilidad", "Activación", "Zona central"];

function generarEstructura(numSemanas, numDias) {
    return Array.from({ length: numSemanas }, (_, si) => ({
        numero: si + 1,
        dias: Array.from({ length: numDias }, (_, di) => ({
            numero: di + 1,
            bloques: [],
        })),
    }));
}

export default function CrearRutina() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const plantillaId = searchParams.get("plantilla");
    const esEdicion = !!id;

    const [paso, setPaso] = useState(1);
    const [config, setConfig] = useState({ nombre: "", descripcion: "", numSemanas: 1, numDias: 3, esPlantilla: true, alumnoId: "" });
    const [semanas, setSemanas] = useState([]);
    const [semanaActiva, setSemanaActiva] = useState(0);
    const [diaActivo, setDiaActivo] = useState(0);
    const [ejerciciosDB, setEjerciciosDB] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [buscadorEjercicio, setBuscadorEjercicio] = useState("");
    const [filtroEtapaEjercicio, setFiltroEtapaEjercicio] = useState("");

    // Cargar ejercicios y alumnos
    useEffect(() => {
        const cargar = async () => {
            const [ejSnap, alSnap] = await Promise.all([
                getDoc(doc(db, "_meta", "placeholder")).catch(() => null),
                getDoc(doc(db, "_meta", "placeholder")).catch(() => null),
            ]);

            const { getDocs } = await import("firebase/firestore");
            const [ejDocs, alDocs] = await Promise.all([
                getDocs(collection(db, "ejercicios")),
                getDocs(collection(db, "alumnos")),
            ]);
            setEjerciciosDB(ejDocs.docs.map((d) => ({ id: d.id, ...d.data() })));
            setAlumnos(alDocs.docs.map((d) => ({ id: d.id, ...d.data() })));
        };
        cargar();
    }, []);

    // Cargar rutina si es edición o plantilla base
    useEffect(() => {
        const cargarRutina = async () => {
            const docId = esEdicion ? id : plantillaId;
            if (!docId) return;
            const snap = await getDoc(doc(db, "rutinas", docId));
            if (!snap.exists()) return;
            const data = snap.data();
            setConfig({
                nombre: esEdicion ? data.nombre : `${data.nombre} (copia)`,
                descripcion: data.descripcion || "",
                numSemanas: data.semanas?.length || 1,
                numDias: data.semanas?.[0]?.dias?.length || 3,
                esPlantilla: esEdicion ? data.esPlantilla : false,
                alumnoId: data.alumnoId || "",
            });
            setSemanas(data.semanas || []);
            if (!esEdicion) setPaso(2);
        };
        cargarRutina();
    }, [id, plantillaId]);

    const iniciarEstructura = () => {
        if (!config.nombre) return alert("Ingresá un nombre para la rutina");
        if (semanas.length === 0) {
            setSemanas(generarEstructura(config.numSemanas, config.numDias));
        }
        setPaso(2);
    };

    const agregarBloque = (etapa) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            copia[semanaActiva].dias[diaActivo].bloques.push({ etapa, ejercicios: [] });
            return copia;
        });
    };

    const eliminarBloque = (bloqueIdx) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            copia[semanaActiva].dias[diaActivo].bloques.splice(bloqueIdx, 1);
            return copia;
        });
    };

    const agregarEjercicioABloque = (bloqueIdx, ejercicio) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            copia[semanaActiva].dias[diaActivo].bloques[bloqueIdx].ejercicios.push({
                ejercicioId: ejercicio.id,
                nombre: ejercicio.nombre,
                series: "",
                repeticiones: "",
                peso: "",
                observaciones: "",
            });
            return copia;
        });
    };

    const actualizarEjercicio = (bloqueIdx, ejIdx, campo, valor) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            copia[semanaActiva].dias[diaActivo].bloques[bloqueIdx].ejercicios[ejIdx][campo] = valor;
            return copia;
        });
    };

    const eliminarEjercicioDeBloque = (bloqueIdx, ejIdx) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            copia[semanaActiva].dias[diaActivo].bloques[bloqueIdx].ejercicios.splice(ejIdx, 1);
            return copia;
        });
    };

    const guardar = async () => {
        setCargando(true);
        try {
            const data = {
                nombre: config.nombre,
                descripcion: config.descripcion,
                esPlantilla: config.esPlantilla,
                alumnoId: config.esPlantilla ? null : config.alumnoId,
                semanas,
                actualizadoEn: new Date(),
            };
            if (esEdicion) {
                await setDoc(doc(db, "rutinas", id), data);
            } else {
                await addDoc(collection(db, "rutinas"), data);
            }
            navigate("/rutinas");
        } catch (e) {
            alert("Error al guardar");
            setCargando(false);
        }
    };

    const diaActual = semanas[semanaActiva]?.dias[diaActivo];
    const etapasEnDia = diaActual?.bloques.map((b) => b.etapa) || [];
    const etapasDisponibles = ETAPAS.filter((et) => !etapasEnDia.includes(et));

    const ejerciciosFiltrados = ejerciciosDB.filter((e) => {
        const coincideNombre = e.nombre.toLowerCase().includes(buscadorEjercicio.toLowerCase());
        const coincideEtapa = !filtroEtapaEjercicio || (Array.isArray(e.etapas) ? e.etapas.includes(filtroEtapaEjercicio) : e.etapa === filtroEtapaEjercicio);
        return coincideNombre && coincideEtapa;
    });

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <Navbar />
            <main className="flex-1 md:ml-56 p-4 md:p-8 pb-24 md:pb-8">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate("/rutinas")} className="text-gray-500 hover:text-white text-sm transition-colors">← Volver</button>
                    <h2 className="text-xl font-bold">{esEdicion ? "Editar rutina" : "Nueva rutina"}</h2>
                </div>

                {/* PASO 1 — Configuración */}
                {paso === 1 && (
                    <div className="max-w-lg">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Nombre de la rutina *</label>
                                <input
                                    value={config.nombre}
                                    onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                    placeholder="Ej: Rutina fuerza 4 semanas"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Descripción</label>
                                <textarea
                                    value={config.descripcion}
                                    onChange={(e) => setConfig({ ...config, descripcion: e.target.value })}
                                    rows={2}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 resize-none"
                                    placeholder="Descripción opcional..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Cantidad de semanas</label>
                                    <input
                                        type="number" min="1" max="12"
                                        value={config.numSemanas}
                                        onChange={(e) => setConfig({ ...config, numSemanas: Number(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Días por semana</label>
                                    <input
                                        type="number" min="1" max="7"
                                        value={config.numDias}
                                        onChange={(e) => setConfig({ ...config, numDias: Number(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Plantilla o asignada */}
                            <div>
                                <label className="text-gray-400 text-xs mb-2 block">Tipo</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ ...config, esPlantilla: true, alumnoId: "" })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${config.esPlantilla ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-400 hover:bg-gray-800"
                                            }`}
                                    >
                                        Plantilla genérica
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ ...config, esPlantilla: false })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${!config.esPlantilla ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-400 hover:bg-gray-800"
                                            }`}
                                    >
                                        Asignar a alumno
                                    </button>
                                </div>
                            </div>

                            {!config.esPlantilla && (
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Alumno</label>
                                    <select
                                        value={config.alumnoId}
                                        onChange={(e) => setConfig({ ...config, alumnoId: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                    >
                                        <option value="">Seleccioná un alumno...</option>
                                        {alumnos.map((a) => (
                                            <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={iniciarEstructura}
                                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-sm transition-colors mt-2"
                            >
                                Continuar →
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 2 — Armar rutina */}
                {paso === 2 && semanas.length > 0 && (
                    <div className="flex flex-col gap-4">

                        {/* Selector semana */}
                        <div className="flex gap-2 flex-wrap">
                            {semanas.map((s, si) => (
                                <button
                                    key={si}
                                    onClick={() => { setSemanaActiva(si); setDiaActivo(0); }}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${semanaActiva === si ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-400 hover:bg-gray-800"
                                        }`}
                                >
                                    Semana {s.numero}
                                </button>
                            ))}
                        </div>

                        {/* Selector día */}
                        <div className="flex gap-2 flex-wrap">
                            {semanas[semanaActiva]?.dias.map((d, di) => (
                                <button
                                    key={di}
                                    onClick={() => setDiaActivo(di)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${diaActivo === di ? "bg-gray-700 border-gray-600 text-white" : "border-gray-800 text-gray-500 hover:bg-gray-800"
                                        }`}
                                >
                                    Día {d.numero}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4">

                            {/* Panel izquierdo — bloques del día */}
                            <div className="flex-1 flex flex-col gap-3">

                                {/* Agregar bloque */}
                                {etapasDisponibles.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {etapasDisponibles.map((et) => (
                                            <button
                                                key={et}
                                                onClick={() => agregarBloque(et)}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
                                            >
                                                + {et}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {diaActual?.bloques.length === 0 && (
                                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-600 text-sm">
                                        Agregá bloques al día usando los botones de arriba
                                    </div>
                                )}

                                {diaActual?.bloques.map((bloque, bi) => (
                                    <div key={bi} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                        {/* Header bloque */}
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-800/50">
                                            <span className="text-sm font-semibold text-orange-400">{bloque.etapa}</span>
                                            <button onClick={() => eliminarBloque(bi)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
                                                Eliminar bloque
                                            </button>
                                        </div>

                                        {/* Ejercicios del bloque */}
                                        <div className="flex flex-col divide-y divide-gray-800">
                                            {bloque.ejercicios.length === 0 && (
                                                <p className="text-gray-600 text-xs text-center py-4">Buscá ejercicios en el panel derecho y agregálos acá</p>
                                            )}
                                            {bloque.ejercicios.map((ej, ei) => (
                                                <div key={ei} className="p-3 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-white">{ej.nombre}</p>
                                                        <button onClick={() => eliminarEjercicioDeBloque(bi, ei)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">×</button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {["series", "repeticiones", "peso"].map((campo) => (
                                                            <div key={campo}>
                                                                <label className="text-gray-500 text-xs capitalize block mb-0.5">{campo}</label>
                                                                <input
                                                                    value={ej[campo]}
                                                                    onChange={(e) => actualizarEjercicio(bi, ei, campo, e.target.value)}
                                                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-orange-500"
                                                                    placeholder={campo === "peso" ? "kg" : "—"}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <label className="text-gray-500 text-xs block mb-0.5">Observaciones</label>
                                                        <input
                                                            value={ej.observaciones}
                                                            onChange={(e) => actualizarEjercicio(bi, ei, "observaciones", e.target.value)}
                                                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-orange-500"
                                                            placeholder="Notas opcionales..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Panel derecho — buscador de ejercicios */}
                            <div className="lg:w-72 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 h-fit lg:sticky lg:top-4">
                                <p className="text-sm font-semibold text-white">Ejercicios</p>
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={buscadorEjercicio}
                                    onChange={(e) => setBuscadorEjercicio(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-orange-500 placeholder-gray-600"
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {["", ...ETAPAS].map((et) => (
                                        <button
                                            key={et}
                                            onClick={() => setFiltroEtapaEjercicio(et)}
                                            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${filtroEtapaEjercicio === et ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-500 hover:bg-gray-800"
                                                }`}
                                        >
                                            {et || "Todos"}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
                                    {ejerciciosFiltrados.length === 0 && (
                                        <p className="text-gray-600 text-xs text-center py-4">Sin resultados</p>
                                    )}
                                    {ejerciciosFiltrados.map((ej) => (
                                        <div key={ej.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-white truncate">{ej.nombre}</p>
                                                <p className="text-xs text-gray-500 truncate">{Array.isArray(ej.zonas) ? ej.zonas[0] : ej.zona}</p>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                {diaActual?.bloques.map((bloque, bi) => (
                                                    <button
                                                        key={bi}
                                                        onClick={() => agregarEjercicioABloque(bi, ej)}
                                                        className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/40 transition-colors whitespace-nowrap"
                                                        title={`Agregar a ${bloque.etapa}`}
                                                    >
                                                        {bloque.etapa.slice(0, 3)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Botones finales */}
                        <div className="flex gap-3 pt-4 border-t border-gray-800">
                            <button
                                onClick={() => setPaso(1)}
                                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
                            >
                                ← Configuración
                            </button>
                            <button
                                onClick={guardar}
                                disabled={cargando}
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear rutina"}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}