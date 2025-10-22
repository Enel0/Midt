import mongoose from "mongoose";

const { Schema } = mongoose;

const OrganigramaNodoSchema = new Schema(
  {
    empresaRut: { type: String, required: true, index: true },
    trabajadorRut: { type: String, required: true },
    nombreTrabajador: { type: String, default: null },
    cargo: { type: String, required: true },
    // Orden relativo para hermanos (para renderizar en un orden predecible)
    orden: { type: Number, default: 0 },
    // Relación jerárquica (auto-referencia al nodo padre)
    parent: { type: Schema.Types.ObjectId, ref: "OrganigramaNodo", default: null },
    // Estado del nodo (por si se quiere desactivar sin borrar)
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Evita nodos duplicados para el mismo trabajador dentro de una empresa
OrganigramaNodoSchema.index({ empresaRut: 1, trabajadorRut: 1 }, { unique: true });

// Optimiza consultas por hermanos y su orden de presentación
OrganigramaNodoSchema.index({ empresaRut: 1, parent: 1, orden: 1 });

export default mongoose.model("OrganigramaNodo", OrganigramaNodoSchema);
