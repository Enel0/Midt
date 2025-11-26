// db.js
import mongoose from 'mongoose';

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/NuevoPrueba";
    if (!uri) {
        console.error("MONGODB_URI no está definido");
        process.exit(1);
    }
    try {
        await mongoose.connect(uri);
        console.log("Base de datos conectada");
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        process.exit(1); // Salir si no se puede conectar
    }
};
