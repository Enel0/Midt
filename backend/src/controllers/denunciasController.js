// Controlador de denuncias: creación, listado, detalle y cambio de estado
import Denuncia from "../models/Denuncia.js";
import OrganigramaNodo from "../models/OrganigramaNodo.js";

// Crea una denuncia. Acepta multipart/form-data con posibles archivos "evidencias".
export const crearDenuncia = async (req, res) => {
  try {
    const {
      empresaRut,
      nodoId,
      trabajadorRut,
      nombreTrabajador,
      cargo,
      motivo,
      detalle,
      tipos,
      tipoOtro,
      fechaOPeriodo,
      lugarHechos,
      evidenciaDescripcion,
      testigoNombre,
      testigoCargoRelacion,
      testigoContacto,
      declaraVeracidad,
      autorizaDatosPersonales,
    } = req.body;
    // Validación: motivo es obligatorio (usado para clasificar la denuncia)
    if (!motivo) return res.status(400).json({ message: "motivo es obligatorio" });

    // Normalizar "tipos": puede venir como array o como string JSON
    let tiposArr = [];
    if (Array.isArray(tipos)) tiposArr = tipos;
    else if (typeof tipos === 'string' && tipos.trim()) {
      try { tiposArr = JSON.parse(tipos); } catch { tiposArr = []; }
    }

    // Armar payload base; se complementa con datos del nodo si corresponde
    let payload = {
      empresaRut: empresaRut || null,
      nodoId: nodoId || null,
      trabajadorRut: trabajadorRut || null,
      nombreTrabajador: nombreTrabajador || null,
      cargo: cargo || null,
      motivo,
      detalle: detalle || "",
      tipos: tiposArr,
      tipoOtro: tipoOtro || "",
      fechaOPeriodo: fechaOPeriodo || "",
      lugarHechos: lugarHechos || "",
      evidenciaDescripcion: evidenciaDescripcion || "",
      testigoNombre: testigoNombre || "",
      testigoCargoRelacion: testigoCargoRelacion || "",
      testigoContacto: testigoContacto || "",
      declaraVeracidad: String(declaraVeracidad) === 'true' || declaraVeracidad === true,
      autorizaDatosPersonales: String(autorizaDatosPersonales) === 'true' || autorizaDatosPersonales === true,
    };

    // Enriquecer desde el nodo del organigrama si falta info del trabajador
    if (nodoId && (!payload.trabajadorRut || !payload.nombreTrabajador || !payload.cargo || !payload.empresaRut)) {
      const nodo = await OrganigramaNodo.findById(nodoId);
      if (nodo) {
        payload.trabajadorRut = payload.trabajadorRut || nodo.trabajadorRut;
        payload.nombreTrabajador = payload.nombreTrabajador || nodo.nombreTrabajador;
        payload.cargo = payload.cargo || nodo.cargo;
        payload.empresaRut = payload.empresaRut || nodo.empresaRut;
      }
    }

    if (!payload.empresaRut) return res.status(400).json({ message: "empresaRut es obligatorio" });

    // Adjuntar evidencias si existen (multer rellena req.files)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      payload.evidencias = req.files.map(f => ({
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
      }));
    }

    // Si hay auth y user adjunto en req, asócialo
    if (req.user?.id) payload.createdBy = req.user.id;

    const doc = await Denuncia.create(payload);
    res.status(201).json(doc);
  } catch (e) {
    console.error("crearDenuncia error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const listarDenuncias = async (req, res) => {
  try {
    const { empresaRut, estado, q, startDate, endDate, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filtro = {};
    if (empresaRut) filtro.empresaRut = empresaRut;
    if (estado) filtro.estado = estado;
    if (startDate || endDate) {
      filtro.createdAt = {};
      if (startDate) filtro.createdAt.$gte = new Date(startDate);
      if (endDate) filtro.createdAt.$lte = new Date(endDate);
    }
    if (q) {
      const rx = new RegExp(q, 'i');
      filtro.$or = [
        { trabajadorRut: rx },
        { nombreTrabajador: rx },
        { cargo: rx },
        { motivo: rx },
        { detalle: rx },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Denuncia.find(filtro).sort(sort).skip(skip).limit(limitNum),
      Denuncia.countDocuments(filtro),
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (e) {
    console.error("listarDenuncias error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const obtenerDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Denuncia.findById(id);
    if (!doc) return res.status(404).json({ message: 'Denuncia no encontrada' });
    res.json(doc);
  } catch (e) {
    console.error('obtenerDenuncia error:', e);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const listarMisDenuncias = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const { estado, page = 1, limit = 20 } = req.query;
    const filtro = { createdBy: userId };
    if (estado) filtro.estado = estado;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      Denuncia.find(filtro).sort('-createdAt').skip(skip).limit(limitNum),
      Denuncia.countDocuments(filtro),
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (e) {
    console.error('listarMisDenuncias error:', e);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const actualizarEstadoDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const allowed = ["pendiente", "en_revision", "resuelta"];
    if (!allowed.includes(estado)) return res.status(400).json({ message: "estado inválido" });
    const doc = await Denuncia.findByIdAndUpdate(id, { estado }, { new: true });
    if (!doc) return res.status(404).json({ message: "Denuncia no encontrada" });
    res.json(doc);
  } catch (e) {
    console.error("actualizarEstadoDenuncia error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
