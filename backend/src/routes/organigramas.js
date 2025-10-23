import express from "express";
import {
  crearNodo,
  actualizarNodo,
  eliminarNodo,
  listarNodos,
  listarRoots,
  obtenerArbol,
  listarEmpresasDelUsuario,
} from "../controllers/organigramaController.js";
import { protegerRuta } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Árbol completo para una empresa (formato para react-d3-tree)
router.get("/:empresaRut/tree", obtenerArbol);

// Nodos raíz para una empresa
router.get("/:empresaRut/roots", listarRoots);

// Listar nodos por parent (o roots con parent=null)
router.get("/:empresaRut/nodos", listarNodos);

// Crear nodo
router.post("/nodos", crearNodo);

// Actualizar nodo
router.patch("/nodos/:id", actualizarNodo);

// Eliminar nodo (opcional ?cascade=true)
router.delete("/nodos/:id", eliminarNodo);

// Empresas donde participa el usuario (por RUT)
router.get("/mis-empresas", protegerRuta, listarEmpresasDelUsuario);

export default router;
