import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import Ejercicios from "./pages/Ejercicios";
import Rutinas from "./pages/Rutinas";

function RutaPrivada({ children }) {
  const { profesor } = useAuth();
  return profesor ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RutaPrivada><Inicio /></RutaPrivada>} />
          <Route path="/ejercicios" element={<RutaPrivada><Ejercicios /></RutaPrivada>} />
          <Route path="/rutinas" element={<RutaPrivada><Rutinas /></RutaPrivada>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
