import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { Sun, Moon } from "lucide-react";

function Navbar() {
  const { user, logout, darkMode, setDarkMode } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isOrganigrama = location.pathname.startsWith("/organigrama");
  const hideThemeToggle = ["/", "/login", "/registro"].includes(location.pathname);

  const handleOrganigramaMenu = () => {
    window.dispatchEvent(new CustomEvent("toggleOrganigramaMenu"));
  };

  const getNombreCorto = () => {
    if (!user?.nombre) return "";
    const segmentos = user.nombre.trim().split(/\s+/);
    if (segmentos.length === 1) return segmentos[0];
    return `${segmentos[0]} ${segmentos[segmentos.length - 1]}`;
  };

  return (
    <nav className="bg-[#0D0A4F] text-white py-4 px-6 flex justify-between items-center shadow-md">
      {/* Logo de la aplicación */}
      <h1
        className="text-2xl font-bold cursor-pointer text-[#FF7A3D]"
        onClick={() => navigate("/")}
      >
        Mi DT
      </h1>

      <div className="flex items-center space-x-4">
        {/* Botón modo oscuro/claro */}
        {!hideThemeToggle && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-1 text-sm font-medium 
                       bg-[#0D0A4F] hover:bg-[#1a1668] text-white 
                       px-3 py-1 rounded-full border border-white"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? "Claro" : "Oscuro"}
          </button>
        )}

        {user ? (
          <>
            <span className="font-medium">
              Hola, {getNombreCorto()} ({user.rol})
            </span>

            {user.rol === "admin" && (
              <>
                <button onClick={() => navigate("/asignarRoles")} className="hover:underline">Asignar Roles</button>
                <button onClick={() => navigate("/denuncias")} className="hover:underline">Denuncias</button>
                <button onClick={() => navigate("/denuncias/analitica")} className="hover:underline">Analítica de Denuncias</button>
              </>
            )}

            

            {/* client-specific sushi links removed */}

            {!isOrganigrama && (
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="bg-[#FF540C] hover:bg-[#FF6A00] text-white font-bold py-2 px-4 rounded"
              >
                Cerrar Sesión
              </button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => navigate("/login")} className="bg-[#FF540C] hover:bg-[#FF6A00] text-white font-bold py-2 px-4 rounded">Iniciar Sesión</button>
          <button onClick={() => navigate("/registro")} className="bg-[#FF540C] hover:bg-[#FF6A00] text-white font-bold py-2 px-4 rounded">Registrarse</button>
        </>
        )}
        {isOrganigrama && (
          <button
            onClick={handleOrganigramaMenu}
            className="ml-2 flex items-center justify-center w-10 h-10 rounded-full border border-white/50 hover:bg-white/10 transition"
            title="Menu del organigrama"
            aria-label="Menu del organigrama"
          >
            ☰
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
