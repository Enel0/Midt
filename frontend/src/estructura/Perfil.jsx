import React, { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import { formatearRut } from "../utils/cl-regiones-comunas";
import { buildApiUrl } from "../utils/api";

const API_BASE = buildApiUrl();

const Perfil = () => {
  const { user, darkMode } = useContext(UserContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("idle"); // idle | codeSent | verified
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const email = user?.email || "";

  const enviarCodigo = async () => {
    setError("");
    if (!email) {
      setError("No hay email asociado");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/enviar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.codigo) throw new Error(data.message || "Error enviando código");
      setCodigoGenerado(data.codigo);
      setStep("codeSent");
      alert("Código enviado a tu correo");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = () => {
    setError("");
    if (codigoIngresado && codigoIngresado === codigoGenerado) {
      setStep("verified");
    } else {
      setError("El código ingresado no es válido");
    }
  };

  const cambiarPassword = async () => {
    setError("");
    if (!newPassword) {
      setError("Ingresa una nueva contraseña");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nuevaPassword: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cambiar la contraseña");
      alert("Contraseña cambiada correctamente");
      setStep("idle");
      setCodigoGenerado("");
      setCodigoIngresado("");
      setNewPassword("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const containerClasses = darkMode
    ? "min-h-screen bg-[#050b1b] text-white transition-colors p-6"
    : "min-h-screen bg-gray-50 text-[#0D0A4F] transition-colors p-6";
  const cardClasses = darkMode
    ? "max-w-3xl mx-auto bg-[#0f172a] text-white rounded shadow-lg shadow-black/30 p-6 border border-white/10"
    : "max-w-3xl mx-auto bg-white text-gray-800 rounded shadow p-6";
  const mutedText = darkMode ? "text-white/70" : "text-gray-600";
  const inputBase = darkMode
    ? "w-full border border-white/20 rounded p-2 bg-white/10 text-white placeholder-white/50"
    : "w-full border rounded p-2 bg-gray-100 text-gray-800";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div><span className="font-semibold">Nombre: </span>{user.nombre || "-"}</div>
            <div><span className="font-semibold">Apellido: </span>{user.apellido || "-"}</div>
            <div><span className="font-semibold">RUT: </span>{user.rut || "-"}</div>
            <div><span className="font-semibold">Email: </span>{user.email || "-"}</div>
            <div><span className="font-semibold">Fecha Nacimiento: </span>{user.fechaNacimiento ? new Date(user.fechaNacimiento).toLocaleDateString() : "-"}</div>
            <div><span className="font-semibold">Teléfono: </span>{user.telefono || "-"}</div>
            <div><span className="font-semibold">Dirección: </span>{user.direccion || "-"}</div>
            <div><span className="font-semibold">Región: </span>{user.region || "-"}</div>
            <div><span className="font-semibold">Comuna: </span>{user.comuna || "-"}</div>
            <div><span className="font-semibold">Sexo: </span>{user.sexo || "-"}</div>
            <div><span className="font-semibold">Rol: </span>{user.rol || "-"}</div>
            {user.rol === "admin_empresa" && (
              <div><span className="font-semibold">Empresa asignada: </span>{user.empresaAdministra ? formatearRut(user.empresaAdministra) : "-"}</div>
            )}
          </div>
        ) : (
          <div className="mb-8">No has iniciado sesión.</div>
        )}

        <h2 className="text-xl font-semibold mb-2">Cambiar contraseña</h2>
        <p className={`text-sm mb-4 ${mutedText}`}>
          Usaremos el mismo sistema de "¿Olvidé mi contraseña?": te enviaremos un código a tu correo y, al validarlo, podrás establecer una nueva contraseña.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <input type="email" value={email} disabled className={inputBase} />
          </div>
          {step === "idle" && (
            <button
              className="bg-[#FF540C] hover:bg-[#FF6A00] text-white px-4 py-2 rounded shadow"
              onClick={enviarCodigo}
              disabled={loading || !email}
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          )}
          {step === "codeSent" && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Código"
                value={codigoIngresado}
                onChange={(e) => setCodigoIngresado(e.target.value)}
                className={inputBase}
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={verificarCodigo}
                disabled={loading || !codigoIngresado}
              >
                Verificar
              </button>
            </div>
          )}
          {step === "verified" && (
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputBase}
              />
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                onClick={cambiarPassword}
                disabled={loading || !newPassword}
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </div>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
