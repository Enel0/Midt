import express from "express";
import { crearDenuncia, listarDenuncias, actualizarEstadoDenuncia } from "../controllers/denunciasController.js";

const router = express.Router();

// Crear una denuncia
router.post("/", crearDenuncia);

// Listar denuncias (opcional ?empresaRut=...)
router.get("/", listarDenuncias);

// Cambiar estado
router.patch("/:id/estado", actualizarEstadoDenuncia);

export default router;

