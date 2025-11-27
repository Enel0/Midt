import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { UserProvider, UserContext } from "./context/UserContext";
import Navbar from "./components/Navbar";
import Home from "./estructura/Home";
import Organigrama from "./estructura/Organigrama";
import LoginForm from "./estructura/LoginForm";
import RegistroForm from "./estructura/RegistroForm";
import AsignarRoles from "./estructura/AsignarRoles";
import Denuncias from "./estructura/Denuncias";
import Denunciar from "./estructura/Denunciar";
import Perfil from "./estructura/Perfil";
import MisDenuncias from "./estructura/MisDenuncias";
import AnaliticaDenuncias from "./estructura/AnaliticaDenuncias";

const AppLayout = () => {
  const { darkMode } = useContext(UserContext);

  const textClass = darkMode ? "text-white" : "text-[#0D0A4F]";
  const overlayClass = darkMode
    ? "bg-gradient-to-b from-[#020617] via-[#050b27]/95 to-[#000103]"
    : "bg-gradient-to-b from-[#e4ebff] via-[#f4f6ff] to-[#fbfbff]";

  return (
    <div className={`relative min-h-screen transition-colors duration-300 ${textClass}`}>
      <div className={`pointer-events-none absolute inset-0 ${overlayClass}`} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/organigrama" element={<Organigrama />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/registro" element={<RegistroForm />} />
            <Route path="/asignarRoles" element={<AsignarRoles />} />
            <Route path="/denuncias" element={<Denuncias />} />
            <Route path="/denunciar" element={<Denunciar />} />
            <Route path="/denuncias/analitica" element={<AnaliticaDenuncias />} />
            <Route path="/mis-denuncias" element={<MisDenuncias />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
