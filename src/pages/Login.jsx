import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (err) {
            setError("Email o contraseña incorrectos");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl w-96 flex flex-col gap-4">
                <h1 className="text-white text-2xl font-bold text-center">Antigravity</h1>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-3 rounded-lg bg-gray-700 text-white outline-none"
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-3 rounded-lg bg-gray-700 text-white outline-none"
                />
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg">
                    Ingresar
                </button>
            </form>
        </div>
    );
}