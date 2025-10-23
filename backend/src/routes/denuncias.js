import express from "express";
import { crearDenuncia, listarDenuncias, actualizarEstadoDenuncia, obtenerDenuncia, listarMisDenuncias } from "../controllers/denunciasController.js";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import uploadEvidencias from "../middlewares/uploadEvidencias.js";

const router = express.Router();

// Crear una denuncia (soporta archivos adjuntos)
router.post("/", uploadEvidencias.array('evidencias', 10), crearDenuncia);

// Listar denuncias (opcional ?empresaRut=...)
router.get("/", listarDenuncias);

// Mis denuncias (requiere auth) - declarar ANTES de la ruta ":id"
router.get("/mias/list", protegerRuta, listarMisDenuncias);

// Obtener una denuncia
router.get("/:id", obtenerDenuncia);

// Cambiar estado
router.patch("/:id/estado", actualizarEstadoDenuncia);

export default router;
