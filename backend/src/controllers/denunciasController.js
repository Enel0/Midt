import Denuncia from "../models/Denuncia.js";
import OrganigramaNodo from "../models/OrganigramaNodo.js";

export const crearDenuncia = async (req, res) => {
  try {
    const { empresaRut, nodoId, trabajadorRut, nombreTrabajador, cargo, motivo, detalle } = req.body;
    if (!motivo) return res.status(400).json({ message: "motivo es obligatorio" });

    let payload = { empresaRut: empresaRut || null, nodoId: nodoId || null, trabajadorRut: trabajadorRut || null, nombreTrabajador: nombreTrabajador || null, cargo: cargo || null, motivo, detalle: detalle || "" };

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
    const { empresaRut } = req.query;
    const filtro = {};
    if (empresaRut) filtro.empresaRut = empresaRut;
    const denuncias = await Denuncia.find(filtro).sort({ createdAt: -1 });
    res.json(denuncias);
  } catch (e) {
    console.error("listarDenuncias error:", e);
    res.status(500).json({ message: "Error en el servidor" });
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

