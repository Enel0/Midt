import React, { useEffect, useState } from "react";
import { formatearRut, validarRutFormato, validarRutDV } from "../utils/cl-regiones-comunas";

function AsignarRoles() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  // Cargar lista de usuarios
  useEffect(() => {
    fetch("http://localhost:5000/api/usuarios")
      .then((res) => res.json())
      .then((data) => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error al cargar usuarios");
        setLoading(false);
      });
  }, []);

  const actualizarRol = (id, nuevoRol, empresaAsignada = null) => {
    fetch(`http://localhost:5000/api/actualizar-rol/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: nuevoRol, empresaAdministra: empresaAsignada }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Error al actualizar el rol");
          });
        }
        return res.json();
      })
      .then((data) => {
        alert(data.message);
        setUsuarios((prev) =>
          prev.map((usuario) =>
            usuario._id === id
              ? { ...usuario, rol: nuevoRol, empresaAdministra: empresaAsignada }
              : usuario
          )
        );
      })
      .catch((err) => {
        console.error(err);
        alert(err.message);
      });
  };

  const solicitarRutEmpresa = (valorInicial = "") => {
    const entrada = window.prompt(
      "Ingresa el RUT de la empresa (formato 12.345.678-5)",
      valorInicial || ""
    );
    if (!entrada) return null;
    const formateado = formatearRut(entrada.trim());
    if (!validarRutFormato(formateado) || !validarRutDV(formateado)) {
      alert("RUT de empresa invalido. Usa el formato 12.345.678-5");
      return null;
    }
    return formateado;
  };

  const handleCambioRol = (usuario, nuevoRol) => {
    if (nuevoRol === "admin_empresa") {
      const rut = solicitarRutEmpresa(usuario.empresaAdministra || "");
      if (!rut) return;
      actualizarRol(usuario._id, nuevoRol, rut);
    } else {
      actualizarRol(usuario._id, nuevoRol, null);
    }
  };

  const handleActualizarEmpresa = (usuario) => {
    const rut = solicitarRutEmpresa(usuario.empresaAdministra || "");
    if (!rut) return;
    actualizarRol(usuario._id, "admin_empresa", rut);
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const nombreCoincide = usuario.nombre
      .toLowerCase()
      .includes(busquedaNombre.toLowerCase());
    const rolCoincide = filtroRol === "todos" || usuario.rol === filtroRol;
    return nombreCoincide && rolCoincide;
  });

  if (loading) {
    return (
      <p className="text-center mt-8 text-blue-500">Cargando usuarios...</p>
    );
  }

  if (error) {
    return <p className="text-center mt-8 text-red-500">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-[#0D0A4F] text-white p-6">
      <div className="max-w-5xl mx-auto bg-white text-black rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-center mb-6 text-[#0D0A4F]">
          Asignar Roles
        </h2>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 w-full">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busquedaNombre}
            onChange={(e) => setBusquedaNombre(e.target.value)}
            className="p-2 rounded w-full sm:w-2/3 border border-gray-300"
          />
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="p-2 rounded w-full sm:w-1/3 border border-gray-300"
          >
            <option value="todos">Todos los roles</option>
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
            <option value="admin_empresa">Admin organigrama</option>
          </select>
        </div>

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Correo</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Rol Actual</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Empresa asignada</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario._id} className="hover:bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">{usuario.nombre}</td>
                <td className="border border-gray-300 px-4 py-2">{usuario.email}</td>
                <td className="border border-gray-300 px-4 py-2">{usuario.rol}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {usuario.empresaAdministra ? formatearRut(usuario.empresaAdministra) : "—"}
                  {usuario.rol === "admin_empresa" && (
                    <button
                      onClick={() => handleActualizarEmpresa(usuario)}
                      className="ml-2 text-sm text-blue-600 hover:underline"
                    >
                      {usuario.empresaAdministra ? "Cambiar" : "Asignar"}
                    </button>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <select
                    value={usuario.rol}
                    onChange={(e) => handleCambioRol(usuario, e.target.value)}
                    className="border border-gray-300 p-1 rounded w-36"
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                    <option value="admin_empresa">Admin organigrama</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AsignarRoles;
