import jwt from 'jsonwebtoken';

// Middleware de autenticación opcional
// - Si hay header Authorization válido, decodifica y adjunta req.user
// - Si no hay header o es inválido, continúa sin bloquear la solicitud
export default function optionalAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return next();
  try {
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_super_segura');
    req.user = decoded;
  } catch (_) {
    // Ignorar errores de verificación para no bloquear denuncias anónimas
  }
  next();
}

