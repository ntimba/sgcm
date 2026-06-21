import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CreationCompte from "./pages/public/CreationCompte";
import "./App.css";

function Accueil() {
    return (
        <div className="max-w-2xl mx-auto p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">SGCM</h1>
            <p className="text-gray-600 mb-8">
                Système de Gestion de Centre Médical
            </p>
            <Link
                to="/inscription"
                className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
                Créer un compte patient
            </Link>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/inscription" element={<CreationCompte />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
