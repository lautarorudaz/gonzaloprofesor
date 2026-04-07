import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [profesor, setProfesor] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setProfesor(user);
            setCargando(false);
        });
        return unsub;
    }, []);

    return (
        <AuthContext.Provider value={{ profesor, cargando }}>
            {!cargando && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}