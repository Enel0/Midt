import express from "express";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import { crearSolicitud, listarMisSolicitudes, listarSolicitudesEmpresa, validarSolicitud, cancelarSolicitud } from "../controllers/solicitudesController.js";

const router = express.Router();

// Crear solicitud de unión
router.post("/", protegerRuta, crearSolicitud);

// Mis solicitudes
router.get("/mias", protegerRuta, listarMisSolicitudes);

// Solicitudes pendientes de una empresa (para validadores)
router.get("/empresa/:empresaRut", protegerRuta, listarSolicitudesEmpresa);

// Validar solicitud
router.patch("/:id/validar", protegerRuta, validarSolicitud);

// Cancelar solicitud (solicitante)
router.delete("/:id", protegerRuta, cancelarSolicitud);

export default router;

