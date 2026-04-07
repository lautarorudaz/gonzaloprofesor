import Navbar from "../components/Navbar";

export default function Rutinas() {
    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <Navbar />
            <main className="ml-56 flex-1 p-8">
                <h2 className="text-2xl font-bold">Rutinas</h2>
            </main>
        </div>
    );
}