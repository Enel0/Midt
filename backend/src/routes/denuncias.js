import express from "express";
import { crearDenuncia, listarDenuncias, actualizarEstadoDenuncia, obtenerDenuncia } from "../controllers/denunciasController.js";

const router = express.Router();

// Crear una denuncia
router.post("/", crearDenuncia);

// Listar denuncias (opcional ?empresaRut=...)
router.get("/", listarDenuncias);

// Obtener una denuncia
router.get("/:id", obtenerDenuncia);

// Cambiar estado
router.patch("/:id/estado", actualizarEstadoDenuncia);

export default router;
