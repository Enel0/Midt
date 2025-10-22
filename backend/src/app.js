import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import autRutas from "./routes/autRutas.js";
import loginRutas from "./routes/loginRutas.js";
import usuariosRoutes from "./routes/usuarios.js";
import correoRoutes from "./correo.js";
import organigramasRoutes from "./routes/organigramas.js";
import denunciasRoutes from "./routes/denuncias.js";


const app = express();
const __dirname = path.resolve();



// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use("/imagenes", express.static(path.join(__dirname, "imagenes")));

// Rutas
app.use("/api/auth", autRutas); // Para registro
app.use("/api/auth/login", loginRutas);
app.use("/api", usuariosRoutes); // Registrar las rutas de usuarios
app.use("/api/organigramas", organigramasRoutes);
app.use("/api/denuncias", denunciasRoutes);


//  Correo
app.use("/api", correoRoutes); // esto permite POST /api/enviar-codigo


// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Error en el servidor" });
});

export default app;
