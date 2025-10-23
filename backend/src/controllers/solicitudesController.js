import mongoose from "mongoose";
import SolicitudUnion from "../models/SolicitudUnion.js";
import OrganigramaNodo from "../models/OrganigramaNodo.js";
import Usuario from "../models/Usuario.js";
import { validarRutFormato, validarRutDV } from "../utils/cl-data.js";

export const crearSolicitud = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });
    const { empresaRut, cargoPropuesto, parentPropuesto = null } = req.body || {};
    if (!empresaRut || !cargoPropuesto) {
      return res.status(400).json({ message: "empresaRut y cargoPropuesto son obligatorios" });
    }
    if (!validarRutFormato(empresaRut) || !validarRutDV(empresaRut)) {
      return res.status(400).json({ message: "RUT de empresa inválido" });
    }
    let parentId = null;
    if (parentPropuesto) {
      if (!mongoose.Types.ObjectId.isValid(parentPropuesto)) return res.status(400).json({ message: "parentPropuesto inválido" });
      const parentNode = await OrganigramaNodo.findById(parentPropuesto);
      if (!parentNode) return res.status(404).json({ message: "Nodo padre propuesto no encontrado" });
      if (parentNode.empresaRut !== empresaRut) return res.status(400).json({ message: "El padre propuesto es de otra empresa" });
      parentId = parentNode._id;
    }

    const solicitante = await Usuario.findById(userId).lean();
    if (!solicitante) return res.status(404).json({ message: "Usuario no encontrado" });

    // Si ya es miembro, nada que solicitar
    const yaMiembro = await OrganigramaNodo.findOne({ empresaRut, trabajadorRut: solicitante.rut });
    if (yaMiembro) return res.status(409).json({ message: "Ya eres miembro de esta empresa" });

    const miembros = await OrganigramaNodo.countDocuments({ empresaRut });

    // Crear solicitud base
    const solicitud = await SolicitudUnion.create({
      empresaRut,
      solicitanteId: userId,
      solicitanteRut: solicitante.rut,
      solicitanteNombre: [solicitante.nombre, solicitante.apellido].filter(Boolean).join(" ") || solicitante.nombre || "",
      cargoPropuesto,
      parentPropuesto: parentId,
      estado: "pendiente",
      quorum: 1,
    });

    let autoAprobada = false;
    if (miembros === 0) {
      // Auto aprobar primer miembro
      solicitud.estado = "aprobada";
      solicitud.validaciones.push({ validadorId: userId, decision: "aprobado", comentario: "auto-aprobado primer miembro" });
      await solicitud.save();
      await OrganigramaNodo.create({
        empresaRut,
        trabajadorRut: solicitante.rut,
        nombreTrabajador: solicitud.solicitanteNombre,
        cargo: cargoPropuesto,
        parent: parentId,
        activo: true,
      });
      autoAprobada = true;
    }

    res.status(201).json({ message: "Solicitud creada", solicitud, autoAprobada });
  } catch (e) {
    console.error("crearSolicitud error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const listarMisSolicitudes = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });
    const { estado } = req.query;
    const filtro = { solicitanteId: userId };
    if (estado) filtro.estado = estado;
    const items = await SolicitudUnion.find(filtro).sort("-createdAt");
    res.json(items);
  } catch (e) {
    console.error("listarMisSolicitudes error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const listarSolicitudesEmpresa = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { empresaRut } = req.params;
    if (!userId) return res.status(401).json({ message: "No autenticado" });
    // Solo miembros de la empresa pueden ver
    const validador = await Usuario.findById(userId).lean();
    const miembro = await OrganigramaNodo.findOne({ empresaRut, trabajadorRut: validador.rut });
    if (!miembro) return res.status(403).json({ message: "No eres miembro de la empresa" });
    const items = await SolicitudUnion.find({ empresaRut, estado: "pendiente" }).sort("createdAt");
    res.json(items);
  } catch (e) {
    console.error("listarSolicitudesEmpresa error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const validarSolicitud = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { decision = "aprobado", comentario = "" } = req.body || {};
    if (!userId) return res.status(401).json({ message: "No autenticado" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "id inválido" });

    const solicitud = await SolicitudUnion.findById(id);
    if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });
    if (solicitud.estado !== "pendiente") return res.status(400).json({ message: "La solicitud no está pendiente" });
    if (String(solicitud.solicitanteId) === String(userId)) return res.status(400).json({ message: "No puedes validar tu propia solicitud" });

    const validador = await Usuario.findById(userId).lean();
    const miembro = await OrganigramaNodo.findOne({ empresaRut: solicitud.empresaRut, trabajadorRut: validador.rut });
    if (!miembro) return res.status(403).json({ message: "No eres miembro de la empresa" });

    const yaValido = solicitud.validaciones.find(v => String(v.validadorId) === String(userId));
    if (yaValido) return res.status(400).json({ message: "Ya has validado esta solicitud" });

    solicitud.validaciones.push({ validadorId: userId, decision, comentario });

    if (decision === "rechazado") {
      solicitud.estado = "rechazada";
      await solicitud.save();
      return res.json({ message: "Solicitud rechazada", solicitud });
    }

    const aprobaciones = solicitud.validaciones.filter(v => v.decision === "aprobado").length;
    if (aprobaciones >= (solicitud.quorum || 1)) {
      solicitud.estado = "aprobada";
      await solicitud.save();
      // crear nodo si aún no existe
      const existe = await OrganigramaNodo.findOne({ empresaRut: solicitud.empresaRut, trabajadorRut: solicitud.solicitanteRut });
      if (!existe) {
        await OrganigramaNodo.create({
          empresaRut: solicitud.empresaRut,
          trabajadorRut: solicitud.solicitanteRut,
          nombreTrabajador: solicitud.solicitanteNombre,
          cargo: solicitud.cargoPropuesto,
          parent: solicitud.parentPropuesto || null,
          activo: true,
        });
      }
      return res.json({ message: "Solicitud aprobada", solicitud });
    }

    await solicitud.save();
    res.json({ message: "Validación registrada", solicitud });
  } catch (e) {
    console.error("validarSolicitud error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const cancelarSolicitud = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "No autenticado" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "id inválido" });
    const solicitud = await SolicitudUnion.findById(id);
    if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });
    if (String(solicitud.solicitanteId) !== String(userId)) return res.status(403).json({ message: "No puedes cancelar esta solicitud" });
    if (solicitud.estado !== "pendiente") return res.status(400).json({ message: "Solo solicitudes pendientes pueden cancelarse" });
    solicitud.estado = "rechazada";
    solicitud.validaciones.push({ validadorId: userId, decision: "rechazado", comentario: "cancelada por el solicitante" });
    await solicitud.save();
    res.json({ message: "Solicitud cancelada", solicitud });
  } catch (e) {
    console.error("cancelarSolicitud error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

