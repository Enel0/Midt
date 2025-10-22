import mongoose from "mongoose";

const { Schema } = mongoose;

const DenunciaSchema = new Schema(
  {
    empresaRut: { type: String, required: true, index: true },
    nodoId: { type: Schema.Types.ObjectId, ref: "OrganigramaNodo", default: null },
    trabajadorRut: { type: String, default: null },
    nombreTrabajador: { type: String, default: null },
    cargo: { type: String, default: null },
    motivo: { type: String, required: true },
    detalle: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Usuario", default: null },
    estado: { type: String, enum: ["pendiente", "en_revision", "resuelta"], default: "pendiente" },
  },
  { timestamps: true }
);

DenunciaSchema.index({ empresaRut: 1, createdAt: -1 });

export default mongoose.model("Denuncia", DenunciaSchema);

