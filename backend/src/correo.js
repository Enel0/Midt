// src/correo.js
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();
let codigoVerificacionGuardado = "";

router.post("/enviar-codigo", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Correo no proporcionado" });
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigoVerificacionGuardado = codigo;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mati.xoda@gmail.com",
      pass: "tsui uerd sshm qgtb", // Usa contraseña de aplicación
    },
  });

  const mailOptions = {
    from: "Mi DT  <MiDTverificador@gmail.com>",
    to: email,
    subject: "Tu código de verificación",
    text: `Tu código de verificación es: ${codigo}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Código enviado con éxito", codigo });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    res.status(500).json({ message: "Error al enviar el correo" });
  }
});

export default router; // ✅ Exportación en formato ES Module
