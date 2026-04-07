import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import logo from "../media/Gemini_Generated_Image_isweopisweopiswe.png";

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="flex flex-col items-center mb-8 gap-3">
                <img src={logo} alt="Logo" className="w-32 h-32 object-contain rounded-full shadow-2xl border-4 border-gray-800 bg-gray-800" />
                <h1 className="text-white text-3xl font-bold text-center tracking-wide">Gonzalo Almiron</h1>
                <p className="text-gray-400 text-sm tracking-widest uppercase">Admin Panel</p>
            </div>
            <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl w-full max-w-sm flex flex-col gap-4 border border-gray-700 shadow-2xl">
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