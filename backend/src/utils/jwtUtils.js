import jwt from "jsonwebtoken";

export const generarToken = (usuario) => {
  const payload = {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    rut: usuario.rut,
  };
  const secret = process.env.JWT_SECRET || "clave_secreta_super_segura";
  // 7 días por defecto
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
