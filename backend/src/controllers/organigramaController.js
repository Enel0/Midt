import mongoose from "mongoose";
import OrganigramaNodo from "../models/OrganigramaNodo.js";
import Usuario from "../models/Usuario.js";
import Usuario from "../models/Usuario.js";

export const crearNodo = async (req, res) => {
  try {
    const { empresaRut, trabajadorRut, cargo, orden = 0, parent = null, activo = true } = req.body;

    if (!empresaRut || !trabajadorRut || !cargo) {
      return res.status(400).json({ message: "empresaRut, trabajadorRut y cargo son obligatorios" });
    }

    let parentId = null;
    if (parent) {
      if (!mongoose.Types.ObjectId.isValid(parent)) return res.status(400).json({ message: "parent inválido" });
      const parentNode = await OrganigramaNodo.findById(parent);
      if (!parentNode) return res.status(404).json({ message: "Nodo padre no encontrado" });
      if (parentNode.empresaRut !== empresaRut) return res.status(400).json({ message: "El padre pertenece a otra empresa" });
      parentId = parentNode._id;
    }

    let nombreTrabajador = null;
    try {
      const u = await Usuario.findOne({ rut: trabajadorRut }).lean();
      if (u) nombreTrabajador = [u.nombre, u.apellido].filter(Boolean).join(' ');
    } catch {}

    const nodo = await OrganigramaNodo.create({ empresaRut, trabajadorRut, nombreTrabajador, cargo, orden, parent: parentId, activo });
    res.status(201).json(nodo);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Ya existe un nodo para este trabajador en la empresa", dup: error.keyValue });
    }
    console.error("crearNodo error:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const actualizarNodo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ["trabajadorRut", "cargo", "orden", "parent", "activo", "empresaRut"]; // empresaRut opcional (migraciones)
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

    if ("parent" in updates && updates.parent) {
      if (!mongoose.Types.ObjectId.isValid(updates.parent)) return res.status(400).json({ message: "parent inválido" });
      const parentNode = await OrganigramaNodo.findById(updates.parent);
      if (!parentNode) return res.status(404).json({ message: "Nodo padre no encontrado" });
      // Evitar ciclos: no se puede asignar como padre a sí mismo ni a un descendiente
      if (updates.parent.toString() === id.toString()) {
        return res.status(400).json({ message: "Un nodo no puede ser padre de sí mismo" });
      }
      // recorrer cadena de padres del nuevo padre para evitar que incluya al propio id
      let cursor = parentNode;
      const maxDepthGuard = 1000; // evita loops infinitos por datos corruptos
      let depth = 0;
      while (cursor && cursor.parent) {
        if (cursor.parent.toString() === id.toString()) {
          return res.status(400).json({ message: "No se puede reparentar a un descendiente" });
        }
        if (depth++ > maxDepthGuard) break;
        cursor = await OrganigramaNodo.findById(cursor.parent).select("parent");
      }
    }
    if (updates.parent === null) updates.parent = null;

    // si cambia el RUT, refrescar nombreTrabajador desde Usuario
    if (Object.prototype.hasOwnProperty.call(updates, 'trabajadorRut')) {
      try {
        const u = await Usuario.findOne({ rut: updates.trabajadorRut }).lean();
        updates.nombreTrabajador = u ? [u.nombre, u.apellido].filter(Boolean).join(' ') : null;
      } catch {}
    }

    const nodo = await OrganigramaNodo.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!nodo) return res.status(404).json({ message: "Nodo no encontrado" });
    res.json(nodo);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Conflicto de duplicado", dup: error.keyValue });
    }
    console.error("actualizarNodo error:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const eliminarNodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { cascade } = req.query;

    const nodo = await OrganigramaNodo.findById(id);
    if (!nodo) return res.status(404).json({ message: "Nodo no encontrado" });

    const hijos = await OrganigramaNodo.find({ parent: id }).select("_id");
    if (hijos.length > 0 && cascade !== "true") {
      return res.status(400).json({ message: "El nodo tiene hijos. Use ?cascade=true para eliminarlos también." });
    }

    if (hijos.length > 0 && cascade === "true") {
      // eliminar recursivo
      const toDelete = [id];
      const queue = [...hijos.map(h => h._id.toString())];
      while (queue.length) {
        const pid = queue.shift();
        toDelete.push(pid);
        const ch = await OrganigramaNodo.find({ parent: pid }).select("_id");
        queue.push(...ch.map(x => x._id.toString()));
      }
      await OrganigramaNodo.deleteMany({ _id: { $in: toDelete } });
      return res.json({ message: "Nodo y descendientes eliminados", count: toDelete.length });
    }

    await OrganigramaNodo.deleteOne({ _id: id });
    res.json({ message: "Nodo eliminado" });
  } catch (error) {
    console.error("eliminarNodo error:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const listarNodos = async (req, res) => {
  try {
    const { empresaRut } = req.params;
    const { parent = null } = req.query;

    const filtro = { empresaRut };
    if (parent === null || parent === "null") filtro.parent = null;
    else filtro.parent = parent;

    const nodos = await OrganigramaNodo.find(filtro).sort({ orden: 1, cargo: 1 });
    res.json(nodos);
  } catch (error) {
    console.error("listarNodos error:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const listarRoots = async (req, res) => {
  try {
    const { empresaRut } = req.params;
    const roots = await OrganigramaNodo.find({ empresaRut, parent: null, activo: true }).sort({ orden: 1 });
    res.json(roots);
  } catch (error) {
    console.error("listarRoots error:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const obtenerArbol = async (req, res) => {
  try {
    const { empresaRut } = req.params;
    const nodos = await OrganigramaNodo.find({ empresaRut, activo: true }).lean();

    const byId = new Map();
    const roots = [];

    // preparar nodos con children
    for (const n of nodos) {
      byId.set(n._id.toString(), { ...n, children: [] });
    }

    // armar jerarquía
    for (const n of nodos) {
      const cur = byId.get(n._id.toString());
      if (n.parent && byId.has(n.parent.toString())) {
        byId.get(n.parent.toString()).children.push(cur);
      } else {
        roots.push(cur);
      }
    }

    // ordenar por orden
    const sortRec = (arr) => {
      arr.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      for (const c of arr) sortRec(c.children);
    };
    sortRec(roots);

    // adaptar al formato esperado por el frontend (Tree react-d3-tree)
    const mapNode = (n) => ({
      id: n._id.toString(),
      name: n.cargo,
      trabajadorRut: n.trabajadorRut,
      nombreTrabajador: n.nombreTrabajador || null,
      attributes: { title: n.nombreTrabajador || n.trabajadorRut },
      children: n.children.map(mapNode),
    });

    const tree = roots.map(mapNode);
    res.json(tree);
  } catch (error) {
    console.error("obtenerArbol error:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const listarEmpresasDelUsuario = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const usuario = await Usuario.findById(userId).lean();
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    const ruts = await OrganigramaNodo.distinct('empresaRut', { trabajadorRut: usuario.rut, activo: true });
    res.json({ empresas: ruts });
  } catch (e) {
    console.error('listarEmpresasDelUsuario error:', e);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
