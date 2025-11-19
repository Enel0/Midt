import express from "express";
import Usuario from "../models/Usuario.js";
import { validarRutFormato, validarRutDV } from "../utils/cl-data.js";

const router = express.Router();

// Ruta para obtener todos los usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, "nombre email rut rol empresaAdministra");
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para actualizar el rol de un usuario
router.put("/actualizar-rol/:id", async (req, res) => {
  const { id } = req.params;
  const { rol, empresaAdministra } = req.body || {};

  const ROLES_PERMITIDOS = ["usuario", "admin", "admin_empresa"];
  if (!ROLES_PERMITIDOS.includes(rol)) {
    return res.status(400).json({ message: "Rol invalido" });
  }

  let empresaAsignada = null;
  if (rol === "admin_empresa") {
    if (!empresaAdministra) {
      return res.status(400).json({ message: "Debes indicar el RUT de la empresa a administrar" });
    }
    const rutFormat = empresaAdministra.toString().trim().toUpperCase();
    if (!validarRutFormato(rutFormat) || !validarRutDV(rutFormat)) {
      return res.status(400).json({ message: "RUT de empresa invalido. Usa el formato 12.345.678-5" });
    }
    empresaAsignada = rutFormat;
  }

  try {
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { rol, empresaAdministra: empresaAsignada },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      message: `El rol del usuario ${usuarioActualizado.nombre} se actualizo a ${rol}.`,
      usuario: {
        id: usuarioActualizado._id,
        rol: usuarioActualizado.rol,
        empresaAdministra: usuarioActualizado.empresaAdministra,
      },
    });
  } catch (error) {
    console.error("Error al actualizar el rol:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;

