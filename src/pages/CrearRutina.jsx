import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc, setDoc, addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";

const ETAPAS = ["Movilidad", "Activación", "Zona central"];

function generarEstructura(numSemanas, numDias) {
    return Array.from({ length: numSemanas }, (_, si) => ({
        numero: si + 1,
        dias: Array.from({ length: numDias }, (_, di) => ({
            numero: di + 1,
            bloques: ETAPAS.map((etapa) => ({ etapa, ejercicios: [] })),
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
    const [config, setConfig] = useState({
        nombre: "", descripcion: "", numSemanas: 1, numDias: 3,
        esPlantilla: true, alumnoId: "",
    });
    const [semanas, setSemanas] = useState([]);
    const [semanaActiva, setSemanaActiva] = useState(0);
    const [diaActivo, setDiaActivo] = useState(0);
    const [ejerciciosDB, setEjerciciosDB] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);

    useEffect(() => {
        const cargar = async () => {
            const [ejDocs, alDocs] = await Promise.all([
                getDocs(collection(db, "ejercicios")),
                getDocs(collection(db, "alumnos")),
            ]);
            setEjerciciosDB(ejDocs.docs.map((d) => ({ id: d.id, ...d.data() })));
            setAlumnos(alDocs.docs.map((d) => ({ id: d.id, ...d.data() })));
        };
        cargar();
    }, []);

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

    const getBloque = (etapa) =>
        semanas[semanaActiva]?.dias[diaActivo]?.bloques.find((b) => b.etapa === etapa);

    const agregarEjercicio = (etapa, ejercicio) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            const bloque = copia[semanaActiva].dias[diaActivo].bloques.find((b) => b.etapa === etapa);
            if (!bloque) return prev;
            if (bloque.ejercicios.some((e) => e.ejercicioId === ejercicio.id)) return prev;
            bloque.ejercicios.push({
                ejercicioId: ejercicio.id,
                nombre: ejercicio.nombre,
                series: "", repeticiones: "", peso: "", observaciones: "",
            });
            return copia;
        });
    };

    const actualizarEjercicio = (etapa, ejIdx, campo, valor) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            const bloque = copia[semanaActiva].dias[diaActivo].bloques.find((b) => b.etapa === etapa);
            if (bloque) bloque.ejercicios[ejIdx][campo] = valor;
            return copia;
        });
    };

    const eliminarEjercicio = (etapa, ejIdx) => {
        setSemanas((prev) => {
            const copia = JSON.parse(JSON.stringify(prev));
            const bloque = copia[semanaActiva].dias[diaActivo].bloques.find((b) => b.etapa === etapa);
            if (bloque) bloque.ejercicios.splice(ejIdx, 1);
            return copia;
        });
    };

    const guardar = async () => {
        setCargando(true);
        try {
            const data = {
                nombre: config.nombre, descripcion: config.descripcion,
                esPlantilla: config.esPlantilla,
                alumnoId: config.esPlantilla ? null : config.alumnoId,
                semanas, actualizadoEn: new Date(),
            };
            if (esEdicion) await setDoc(doc(db, "rutinas", id), data);
            else await addDoc(collection(db, "rutinas"), data);
            navigate("/rutinas");
        } catch {
            alert("Error al guardar");
            setCargando(false);
        }
    };

    const diaActual = semanas[semanaActiva]?.dias[diaActivo];
    const totalEjercicios = diaActual?.bloques.reduce((acc, b) => acc + b.ejercicios.length, 0) || 0;

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <Navbar />
            <main className="flex-1 md:ml-56 p-4 md:p-8 pb-24 md:pb-8">

                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate("/rutinas")} className="text-gray-500 hover:text-white text-sm transition-colors">← Volver</button>
                    <h2 className="text-xl font-bold">{esEdicion ? "Editar rutina" : "Nueva rutina"}</h2>
                </div>

                {/* PASO 1 */}
                {paso === 1 && (
                    <div className="max-w-lg">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Nombre *</label>
                                <input value={config.nombre} onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                    placeholder="Ej: Rutina fuerza 4 semanas" />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Descripción</label>
                                <textarea value={config.descripcion} onChange={(e) => setConfig({ ...config, descripcion: e.target.value })}
                                    rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 resize-none"
                                    placeholder="Descripción opcional..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Semanas</label>
                                    <input type="number" min="1" max="12" value={config.numSemanas}
                                        onChange={(e) => setConfig({ ...config, numSemanas: Number(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500" />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Días por semana</label>
                                    <input type="number" min="1" max="7" value={config.numDias}
                                        onChange={(e) => setConfig({ ...config, numDias: Number(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-2 block">Tipo</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setConfig({ ...config, esPlantilla: true, alumnoId: "" })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${config.esPlantilla ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                                        Plantilla genérica
                                    </button>
                                    <button type="button" onClick={() => setConfig({ ...config, esPlantilla: false })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${!config.esPlantilla ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                                        Asignar a alumno
                                    </button>
                                </div>
                            </div>
                            {!config.esPlantilla && (
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Alumno</label>
                                    <select value={config.alumnoId} onChange={(e) => setConfig({ ...config, alumnoId: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500">
                                        <option value="">Seleccioná un alumno...</option>
                                        {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
                                    </select>
                                </div>
                            )}
                            <button onClick={iniciarEstructura}
                                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-sm transition-colors mt-2">
                                Continuar →
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 2 */}
                {paso === 2 && semanas.length > 0 && (
                    <div className="flex flex-col gap-4">

                        {/* Semanas */}
                        <div className="flex gap-2 flex-wrap">
                            {semanas.map((s, si) => (
                                <button key={si} onClick={() => { setSemanaActiva(si); setDiaActivo(0); }}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${semanaActiva === si ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                                    Semana {s.numero}
                                </button>
                            ))}
                        </div>

                        {/* Días */}
                        <div className="flex gap-2 flex-wrap">
                            {semanas[semanaActiva]?.dias.map((d, di) => (
                                <button key={di} onClick={() => setDiaActivo(di)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${diaActivo === di ? "bg-gray-700 border-gray-600 text-white" : "border-gray-800 text-gray-500 hover:bg-gray-800"}`}>
                                    Día {d.numero}
                                </button>
                            ))}
                        </div>

                        {/* Vista del día */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                                <p className="text-sm text-gray-400">
                                    {totalEjercicios === 0 ? "Sin ejercicios" : `${totalEjercicios} ejercicio${totalEjercicios !== 1 ? "s" : ""}`}
                                </p>
                                <button onClick={() => setModalAbierto(true)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                                    + Agregar ejercicios
                                </button>
                            </div>

                            {ETAPAS.map((etapa) => {
                                const bloque = getBloque(etapa);
                                const ejercicios = bloque?.ejercicios || [];
                                const colorTitle = {
                                    "Movilidad": "text-blue-400",
                                    "Activación": "text-green-400",
                                    "Zona central": "text-orange-400",
                                }[etapa];

                                if (ejercicios.length === 0) return null;

                                return (
                                    <div key={etapa} className="border-b-4 border-gray-950 last:border-0">
                                        <div className="px-5 py-3 bg-gray-800/40">
                                            <p className={`text-sm font-bold ${colorTitle}`}>{etapa}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">{ejercicios.length} ejercicio{ejercicios.length !== 1 ? "s" : ""}</p>
                                        </div>

                                        {/* Header columnas desktop */}
                                        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_2fr_auto] gap-3 px-5 py-2 border-b border-gray-800/50">
                                            <p className="text-xs text-gray-600 font-medium">Ejercicio</p>
                                            <p className="text-xs text-gray-600 font-medium">Series</p>
                                            <p className="text-xs text-gray-600 font-medium">Reps</p>
                                            <p className="text-xs text-gray-600 font-medium">Peso</p>
                                            <p className="text-xs text-gray-600 font-medium">Observaciones</p>
                                            <p></p>
                                        </div>

                                        {ejercicios.map((ej, ei) => (
                                            <div key={ei} className="px-5 py-4 border-b border-gray-800/30 last:border-0">

                                                {/* Desktop */}
                                                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_2fr_auto] gap-3 items-center">
                                                    <p className="text-sm text-white font-medium truncate">{ej.nombre}</p>
                                                    {["series", "repeticiones", "peso"].map((campo) => (
                                                        <input key={campo} value={ej[campo]}
                                                            onChange={(e) => actualizarEjercicio(etapa, ei, campo, e.target.value)}
                                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-orange-500 w-full"
                                                            placeholder={campo === "peso" ? "kg" : "—"} />
                                                    ))}
                                                    <input value={ej.observaciones}
                                                        onChange={(e) => actualizarEjercicio(etapa, ei, "observaciones", e.target.value)}
                                                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-orange-500 w-full"
                                                        placeholder="Notas..." />
                                                    <button onClick={() => eliminarEjercicio(etapa, ei)}
                                                        className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors px-1">×</button>
                                                </div>

                                                {/* Mobile */}
                                                <div className="md:hidden flex flex-col gap-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-white font-medium">{ej.nombre}</p>
                                                        <button onClick={() => eliminarEjercicio(etapa, ei)}
                                                            className="text-gray-600 hover:text-red-400 text-xl leading-none transition-colors ml-2">×</button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {["series", "repeticiones", "peso"].map((campo) => (
                                                            <div key={campo}>
                                                                <label className="text-gray-500 text-xs capitalize block mb-1">{campo}</label>
                                                                <input value={ej[campo]}
                                                                    onChange={(e) => actualizarEjercicio(etapa, ei, campo, e.target.value)}
                                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                                                    placeholder={campo === "peso" ? "kg" : "—"} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <label className="text-gray-500 text-xs block mb-1">Observaciones</label>
                                                        <input value={ej.observaciones}
                                                            onChange={(e) => actualizarEjercicio(etapa, ei, "observaciones", e.target.value)}
                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                                            placeholder="Notas opcionales..." />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}

                            {totalEjercicios === 0 && (
                                <div className="px-5 py-10 text-center text-gray-600 text-sm">
                                    Tocá "+ Agregar ejercicios" para armar este día
                                </div>
                            )}
                        </div>

                        {/* Botones finales */}
                        <div className="flex gap-3 pt-4 border-t border-gray-800">
                            <button onClick={() => setPaso(1)}
                                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                                ← Configuración
                            </button>
                            <button onClick={guardar} disabled={cargando}
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                                {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear rutina"}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {modalAbierto && (
                <ModalAgregarEjercicios
                    ejerciciosDB={ejerciciosDB}
                    bloques={diaActual?.bloques || []}
                    onAgregar={agregarEjercicio}
                    onClose={() => setModalAbierto(false)}
                />
            )}
        </div>
    );
}

function ModalAgregarEjercicios({ ejerciciosDB, bloques, onAgregar, onClose }) {
    const [busqueda, setBusqueda] = useState("");
    const [filtroZona, setFiltroZona] = useState("");
    const [filtroEtapa, setFiltroEtapa] = useState("");
    const [etapaSeleccionada, setEtapaSeleccionada] = useState("Movilidad");

    const ZONAS = [...new Set(ejerciciosDB.flatMap((e) =>
        Array.isArray(e.zonas) ? e.zonas : (e.zona ? [e.zona] : [])
    ))].sort();

    const idsAgregadosPorEtapa = {};
    ETAPAS.forEach((et) => {
        const bloque = bloques.find((b) => b.etapa === et);
        idsAgregadosPorEtapa[et] = new Set(bloque?.ejercicios.map((e) => e.ejercicioId) || []);
    });

    const ejerciciosFiltrados = ejerciciosDB.filter((e) => {
        const coincideNombre = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const zonasEj = Array.isArray(e.zonas) ? e.zonas : (e.zona ? [e.zona] : []);
        const etapasEj = Array.isArray(e.etapas) ? e.etapas : (e.etapa ? [e.etapa] : []);
        const coincideZona = !filtroZona || zonasEj.includes(filtroZona);
        const coincideEtapa = !filtroEtapa || etapasEj.includes(filtroEtapa);
        return coincideNombre && coincideZona && coincideEtapa;
    });

    const colorEtapa = {
        "Movilidad": "text-blue-400 border-blue-800 bg-blue-900/30",
        "Activación": "text-green-400 border-green-800 bg-green-900/30",
        "Zona central": "text-orange-400 border-orange-800 bg-orange-900/30",
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full md:max-w-2xl max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
                    <h3 className="font-bold text-white">Agregar ejercicios</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
                </div>

                {/* Selector etapa destino */}
                <div className="flex gap-2 px-5 py-3 border-b border-gray-800 flex-shrink-0 flex-wrap">
                    <p className="text-xs text-gray-500 self-center mr-1">Agregar a:</p>
                    {ETAPAS.map((et) => (
                        <button key={et} onClick={() => setEtapaSeleccionada(et)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${etapaSeleccionada === et ? colorEtapa[et] : "border-gray-700 text-gray-500 hover:bg-gray-800"}`}>
                            {et}
                        </button>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-2 px-5 py-3 border-b border-gray-800 flex-shrink-0">
                    <input type="text" placeholder="Buscar ejercicio..." value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 placeholder-gray-600" />
                    <div className="flex gap-1 flex-wrap items-center">
                        <p className="text-xs text-gray-600 mr-1">Etapa:</p>
                        {["", ...ETAPAS].map((et) => (
                            <button key={et} onClick={() => setFiltroEtapa(et)}
                                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${filtroEtapa === et ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-500 hover:bg-gray-800"}`}>
                                {et || "Todas"}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 flex-wrap items-center">
                        <p className="text-xs text-gray-600 mr-1">Zona:</p>
                        <button onClick={() => setFiltroZona("")}
                            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${!filtroZona ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-500 hover:bg-gray-800"}`}>
                            Todas
                        </button>
                        {ZONAS.map((z) => (
                            <button key={z} onClick={() => setFiltroZona(z === filtroZona ? "" : z)}
                                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${filtroZona === z ? "bg-orange-500 border-orange-500 text-white" : "border-gray-700 text-gray-500 hover:bg-gray-800"}`}>
                                {z}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista ejercicios */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
                    {ejerciciosFiltrados.length === 0 && (
                        <p className="text-gray-600 text-sm text-center py-8">Sin resultados</p>
                    )}
                    {ejerciciosFiltrados.map((ej) => {
                        const yaAgregado = idsAgregadosPorEtapa[etapaSeleccionada]?.has(ej.id);
                        return (
                            <div key={ej.id} className="flex items-center justify-between px-5 py-3 gap-3 hover:bg-gray-800/40">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{ej.nombre}</p>
                                    <p className="text-xs text-gray-500">
                                        {Array.isArray(ej.zonas) ? ej.zonas.join(", ") : ej.zona}
                                    </p>
                                </div>
                                <button
                                    onClick={() => !yaAgregado && onAgregar(etapaSeleccionada, ej)}
                                    disabled={yaAgregado}
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${yaAgregado ? "bg-gray-800 text-gray-600 cursor-default" : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/40"
                                        }`}>
                                    {yaAgregado ? "✓" : "+"}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="px-5 py-3 border-t border-gray-800 flex-shrink-0">
                    <button onClick={onClose}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
} 