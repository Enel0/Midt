import express from "express";
import Usuario from "../models/Usuario.js";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import { validarRutFormato, validarRutDV } from "../utils/cl-data.js";

const router = express.Router();

// Ruta para obtener todos los usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, "nombre email rol"); // Selecciona solo los campos necesarios
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para actualizar el rol de un usuario
router.put("/actualizar-rol/:id", async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!["usuario", "admin"].includes(rol)) {
    return res.status(400).json({ message: "Rol inválido" });
  }

  try {
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { rol },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      message: `El rol del usuario ${usuarioActualizado.nombre} se actualizó a ${rol}.`,
    });
  } catch (error) {
    console.error("Error al actualizar el rol:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Empresas favoritas del usuario autenticado
router.get("/me/empresas-favoritas", protegerRuta, async (req, res) => {
  try {
    const me = await Usuario.findById(req.user.id).select("empresasFavoritas");
    if (!me) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ empresas: me.empresasFavoritas || [] });
  } catch (e) {
    console.error("get favoritas error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

router.post("/me/empresas-favoritas", protegerRuta, async (req, res) => {
  try {
    const { empresaRut } = req.body;
    if (!empresaRut || !validarRutFormato(empresaRut) || !validarRutDV(empresaRut)) {
      return res.status(400).json({ message: "RUT inválido" });
    }
    const updated = await Usuario.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { empresasFavoritas: empresaRut } },
      { new: true, select: "empresasFavoritas" }
    );
    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ empresas: updated.empresasFavoritas || [] });
  } catch (e) {
    console.error("post favoritas error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

router.delete("/me/empresas-favoritas", protegerRuta, async (req, res) => {
  try {
    const { empresaRut } = req.body;
    if (!empresaRut) return res.status(400).json({ message: "empresaRut requerido" });
    const updated = await Usuario.findByIdAndUpdate(
      req.user.id,
      { $pull: { empresasFavoritas: empresaRut } },
      { new: true, select: "empresasFavoritas" }
    );
    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ empresas: updated.empresasFavoritas || [] });
  } catch (e) {
    console.error("delete favoritas error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
