import express from "express";
import { crearDenuncia, listarDenuncias, actualizarEstadoDenuncia, obtenerDenuncia, listarMisDenuncias } from "../controllers/denunciasController.js";
import { protegerRuta } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Crear una denuncia
router.post("/", crearDenuncia);

// Listar denuncias (opcional ?empresaRut=...)
router.get("/", listarDenuncias);

// Obtener una denuncia
router.get("/:id", obtenerDenuncia);

// Mis denuncias (requiere auth)
router.get("/mias/list", protegerRuta, listarMisDenuncias);

// Cambiar estado
router.patch("/:id/estado", actualizarEstadoDenuncia);

export default router;
