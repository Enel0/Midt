// src/correo.js
import express from "express";
import sgMail from "@sendgrid/mail";

const router = express.Router();
let codigoVerificacionGuardado = "";

router.post("/enviar-codigo", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Correo no proporcionado" });
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigoVerificacionGuardado = codigo;

  const emailFrom = process.env.EMAIL_FROM;
  const appName = process.env.APP_NAME || "Mi DT";
  const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const replyTo = process.env.EMAIL_REPLY_TO || emailFrom;

  if (!sendgridApiKey) {
    console.error("Falta la variable de entorno SENDGRID_API_KEY");
    return res.status(500).json({ message: "Configuracion de correo incompleta" });
  }

  if (!emailFrom) {
    console.error("Falta EMAIL_FROM para definir remitente en SendGrid");
    return res.status(500).json({ message: "Configuracion de remitente incompleta" });
  }

  sgMail.setApiKey(sendgridApiKey);

  const verificationUrl = frontendUrl ? `${frontendUrl}/login` : "";
  const buttonSection = verificationUrl
    ? `<tr>
          <td style="text-align:center;">
            <a href="${verificationUrl}" style="display:inline-block;background:#ff540c;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">
              Abrir la aplicación
            </a>
          </td>
        </tr>`
    : "";

  const deploymentOrigin = process.env.RENDER_EXTERNAL_URL || frontendUrl || "tu servidor";

  const mailOptions = {
    from: {
      email: emailFrom,
      name: appName,
    },
    replyTo,
    to: email,
    subject: `${appName} - Tu codigo de verificacion`,
    text: `Tu codigo de verificacion es: ${codigo}`,
    html: `<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${appName} - Código de verificación</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:32px 0;background:#f5f5f5;">
          <tr>
            <td>
              <table width="600" cellpadding="0" cellspacing="0" role="presentation" align="center" style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
                <tr>
                  <td style="font-size:24px;font-weight:600;color:#0d0a4f;">${appName}</td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-size:15px;color:#333;line-height:1.5;">
                    Hola, recibimos una solicitud para validar tu correo. Usa el siguiente código para continuar:
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 0;text-align:center;">
                    <div style="display:inline-block;padding:14px 24px;font-size:28px;font-weight:700;color:#0d0a4f;border:2px dashed #ff540c;border-radius:12px;letter-spacing:6px;">
                      ${codigo}
                    </div>
                  </td>
                </tr>
                ${buttonSection}
                <tr>
                  <td style="padding-top:24px;font-size:13px;color:#777;line-height:1.5;">
                    Si no solicitaste este código puedes ignorar este mensaje. El código expirará en unos minutos.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-size:12px;color:#a0a0a0;">
                    Enviado desde ${deploymentOrigin}.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`,
  };

  try {
    await sgMail.send(mailOptions);
    res.json({ message: "Codigo enviado con exito", codigo });
  } catch (error) {
    console.error("Error al enviar el correo:", error.response?.body || error);
    res.status(500).json({ message: "Error al enviar el correo" });
  }
});

export default router; // e.g. Exportacion en formato ES Module
