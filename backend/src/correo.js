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

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error("Faltan las variables de entorno EMAIL_USER o EMAIL_PASS");
    return res.status(500).json({ message: "Configuracion de correo incompleta" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass, // Usa contrasena de aplicacion
    },
  });

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: "Tu codigo de verificacion",
    text: `Tu codigo de verificacion es: ${codigo}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Codigo enviado con exito", codigo });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    res.status(500).json({ message: "Error al enviar el correo" });
  }
});

export default router; // e.g. Exportacion en formato ES Module
