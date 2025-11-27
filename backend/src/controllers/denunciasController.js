// Controlador de denuncias: creación, listado, detalle y cambio de estado
import Denuncia from "../models/Denuncia.js";
import OrganigramaNodo from "../models/OrganigramaNodo.js";
import Usuario from "../models/Usuario.js";

const calcEdad = (fecha) => {
  if (!fecha) return null;
  const birth = new Date(fecha);
  if (Number.isNaN(birth.getTime())) return null;
  const diff = Date.now() - birth.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
};

const rangoEdad = (edad) => {
  if (edad === null) return "Sin datos";
  if (edad < 25) return "Menos de 25";
  if (edad < 35) return "25-34";
  if (edad < 45) return "35-44";
  if (edad < 55) return "45-54";
  return "55 o m\u00E1s";
};

const toSortedArray = (obj, labelKey) =>
  Object.entries(obj || {})
    .sort((a, b) => b[1] - a[1])
    .map(([label, total]) => ({ [labelKey]: label, total }));

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
      regionHechos,
      comunaHechos,
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
      regionHechos: regionHechos || "",
      comunaHechos: comunaHechos || "",
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
    const {
      empresaRut,
      estado,
      q,
      startDate,
      endDate,
      regionHechos,
      comunaHechos,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;
    const filtro = {};
    if (empresaRut) filtro.empresaRut = empresaRut;
    if (estado) filtro.estado = estado;
    if (startDate || endDate) {
      filtro.createdAt = {};
      if (startDate) filtro.createdAt.$gte = new Date(startDate);
      if (endDate) filtro.createdAt.$lte = new Date(endDate);
    }
    if (regionHechos) filtro.regionHechos = regionHechos;
    if (comunaHechos) filtro.comunaHechos = comunaHechos;
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

export const estadisticasDenuncias = async (req, res) => {
  try {
    const { desde, hasta, region, comuna } = req.query;
    const filtro = {};
    if (desde || hasta) {
      filtro.createdAt = {};
      if (desde) filtro.createdAt.$gte = new Date(desde);
      if (hasta) filtro.createdAt.$lte = new Date(hasta);
    }
    if (region) filtro.regionHechos = region;
    if (comuna) filtro.comunaHechos = comuna;
    const denuncias = await Denuncia.find(filtro).lean();
    const total = denuncias.length;
    const uniqueRuts = [...new Set(denuncias.map(d => d.trabajadorRut).filter(Boolean))];
    const uniqueVictimasIds = [
      ...new Set(denuncias.map(d => (d.createdBy ? d.createdBy.toString() : null)).filter(Boolean))
    ];

    const [agresores, victimas] = await Promise.all([
      uniqueRuts.length
        ? Usuario.find({ rut: { $in: uniqueRuts } }, "rut region sexo fechaNacimiento").lean()
        : [],
      uniqueVictimasIds.length
        ? Usuario.find({ _id: { $in: uniqueVictimasIds } }, "sexo region fechaNacimiento").lean()
        : [],
    ]);

    const agresorMap = new Map(agresores.map((a) => [a.rut, a]));
    const victimaMap = new Map(victimas.map((v) => [v._id.toString(), v]));

    const porRegion = {};
    const porComuna = {};
    const sexoAgresores = {};
    const sexoVictimas = {};
    const rangosEdadAgresores = {};
    let sumaEdades = 0;
    let conteoEdades = 0;
    const estados = {};
    const motivos = {};
    const tiposFrecuentes = {};
    const timelineMensual = {};

    for (const denuncia of denuncias) {
      const agresor = denuncia.trabajadorRut ? agresorMap.get(denuncia.trabajadorRut) : null;
      const regionHechosKey = (denuncia.regionHechos || "").trim();
      const region = regionHechosKey || agresor?.region || "Sin datos";
      porRegion[region] = (porRegion[region] || 0) + 1;
      const comunaKey = (denuncia.comunaHechos || "").trim() || "Sin datos";
      porComuna[comunaKey] = (porComuna[comunaKey] || 0) + 1;

      const sexoAgresor = agresor?.sexo || "Sin datos";
      sexoAgresores[sexoAgresor] = (sexoAgresores[sexoAgresor] || 0) + 1;

      const edad = calcEdad(agresor?.fechaNacimiento);
      if (edad !== null) {
        sumaEdades += edad;
        conteoEdades += 1;
      }
      const rango = rangoEdad(edad);
      rangosEdadAgresores[rango] = (rangosEdadAgresores[rango] || 0) + 1;

      const victima = denuncia.createdBy ? victimaMap.get(denuncia.createdBy.toString()) : null;
      const sexoVictima = victima?.sexo || "Sin datos";
      sexoVictimas[sexoVictima] = (sexoVictimas[sexoVictima] || 0) + 1;

      const estadoKey = denuncia.estado || "Sin estado";
      estados[estadoKey] = (estados[estadoKey] || 0) + 1;

      const motivoKey = denuncia.motivo?.trim() || "Sin especificar";
      motivos[motivoKey] = (motivos[motivoKey] || 0) + 1;

      (denuncia.tipos || []).forEach((t) => {
        const key = (t || "Sin clasificar").trim();
        tiposFrecuentes[key] = (tiposFrecuentes[key] || 0) + 1;
      });

      if (denuncia.createdAt) {
        const d = new Date(denuncia.createdAt);
        if (!Number.isNaN(d.getTime())) {
          const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          timelineMensual[periodo] = (timelineMensual[periodo] || 0) + 1;
        }
      }
    }

    const timeline = Object.entries(timelineMensual)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([periodo, totalPeriodo]) => ({ periodo, total: totalPeriodo }));

    res.json({
      total,
      filtros: { desde: desde || null, hasta: hasta || null, region: region || null, comuna: comuna || null },
      porRegion: toSortedArray(porRegion, "region"),
      porComuna: toSortedArray(porComuna, "comuna"),
      sexoAgresores: toSortedArray(sexoAgresores, "sexo"),
      sexoVictimas: toSortedArray(sexoVictimas, "sexo"),
      edadesAgresores: {
        promedio: conteoEdades ? Math.round((sumaEdades / conteoEdades) * 10) / 10 : null,
        rangos: toSortedArray(rangosEdadAgresores, "rango"),
      },
      estados: toSortedArray(estados, "estado"),
      topMotivos: toSortedArray(motivos, "motivo").slice(0, 5),
      tiposFrecuentes: toSortedArray(tiposFrecuentes, "tipo").slice(0, 5),
      timelineMensual: timeline,
    });
  } catch (e) {
    console.error("estadisticasDenuncias error:", e);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
