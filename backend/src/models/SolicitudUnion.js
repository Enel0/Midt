import mongoose from "mongoose";
import { validarRutFormato, validarRutDV } from "../utils/cl-data.js";

const { Schema } = mongoose;

const ValidacionSchema = new Schema(
  {
    validadorId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    decision: { type: String, enum: ["aprobado", "rechazado"], required: true },
    comentario: { type: String, default: "" },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SolicitudUnionSchema = new Schema(
  {
    empresaRut: {
      type: String,
      required: true,
      validate: [
        {
          validator: (v) => validarRutFormato(v) && validarRutDV(v),
          message: "RUT de empresa inválido",
        },
      ],
      index: true,
    },
    solicitanteId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
    solicitanteRut: { type: String, required: true },
    solicitanteNombre: { type: String, default: null },
    cargoPropuesto: { type: String, required: true },
    parentPropuesto: { type: Schema.Types.ObjectId, ref: "OrganigramaNodo", default: null },
    estado: { type: String, enum: ["pendiente", "aprobada", "rechazada", "expirada"], default: "pendiente", index: true },
    validaciones: { type: [ValidacionSchema], default: [] },
    quorum: { type: Number, default: 1 },
  },
  { timestamps: true }
);

SolicitudUnionSchema.index({ empresaRut: 1, solicitanteId: 1, estado: 1 });

export default mongoose.model("SolicitudUnion", SolicitudUnionSchema);

