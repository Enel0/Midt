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
    // Campos adicionales del formulario mejorado
    tipos: { type: [String], default: [] },
    tipoOtro: { type: String, default: "" },
    fechaOPeriodo: { type: String, default: "" },
    lugarHechos: { type: String, default: "" },
    evidenciaDescripcion: { type: String, default: "" },
    evidencias: {
      type: [
        new Schema({
          filename: String,
          originalname: String,
          mimetype: String,
          size: Number,
          path: String,
        }, { _id: false })
      ],
      default: [],
    },
    testigoNombre: { type: String, default: "" },
    testigoCargoRelacion: { type: String, default: "" },
    testigoContacto: { type: String, default: "" },
    declaraVeracidad: { type: Boolean, default: false },
    autorizaDatosPersonales: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "Usuario", default: null },
    estado: { type: String, enum: ["pendiente", "en_revision", "resuelta"], default: "pendiente" },
  },
  { timestamps: true }
);

DenunciaSchema.index({ empresaRut: 1, createdAt: -1 });

export default mongoose.model("Denuncia", DenunciaSchema);
