import nodemailer from "nodemailer";
import { AppDataSource } from "../data-source";
import { Order } from "../entity/Order";

// Configuración de Ethereal (Reemplazá con tus datos)
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "cruz.watsica@ethereal.email", // <-- REEMPLAZAR
    pass: "VSEBVeA5kYBrHTXGTN", // <-- REEMPLAZAR
  },
});

export const sendOrderConfirmationEmail = async (orderId: number) => {
  try {
    const orderRepo = AppDataSource.getRepository(Order);

    // Buscamos la orden con todos sus datos (usuario y productos)
    const order = await orderRepo.findOne({
      where: { id: orderId },
      relations: ["items", "items.product", "user"],
    });

    if (!order) return;

    // Detectamos a quién mandarle el mail: si es B2B usamos el del User, si es Invitado usamos el guestEmail
    const recipientEmail = order.user ? order.user.email : order.guestEmail;

    if (!recipientEmail) {
      console.log(
        `[EMAIL] ⚠️ No hay email de destino para la orden #${orderId}`,
      );
      return;
    }

    // Armamos la lista de productos en HTML
    const itemsHtml = order.items
      .map(
        (item) =>
          `<li>${item.quantity}x ${item.product.name} - $${item.unitPriceAtPurchase}</li>`,
      )
      .join("");

    const mailOptions = {
      from: '"Anselmi Sanitarios" <ventas@anselmi.com.ar>',
      to: recipientEmail,
      subject: `¡Confirmación de Pedido #${order.id}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <!-- Cabecera Azul Anselmi -->
          <div style="background-color: #0056b3; padding: 30px 20px; text-align: center;">
              
              <!-- ACÁ INSERTAMOS EL LOGO REFERENCIANDO EL CID -->
              <img src="cid:logo_anselmi" alt="Anselmi Logo" style="max-width: 200px; height: auto; margin-bottom: 15px; border-radius: 4px;">
              
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">ANSELMI</h1>
              <p style="color: #e9ecef; margin: 5px 0 0 0; font-size: 14px;">Desarrollos Comerciales S.R.L.</p>
          </div>
          <!-- Cuerpo del mensaje -->
          <div style="padding: 40px 30px;">
              <h2 style="color: #333333; font-size: 20px; margin-top: 0;">¡Gracias por tu compra!</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.5;">Hola, queríamos avisarte que tu pedido <strong>#${order.id}</strong> fue confirmado exitosamente y ya lo estamos procesando en nuestro sistema.</p>
              
              <div style="margin: 30px 0; border-top: 2px solid #f8f9fa; border-bottom: 2px solid #f8f9fa; padding: 20px 0;">
                  <h3 style="color: #0056b3; font-size: 16px; margin-top: 0;">Resumen de tu pedido:</h3>
                  <ul style="list-style-type: none; padding: 0; margin: 0; color: #555555;">
                      ${itemsHtml}
                  </ul>
              </div>

              <div style="background-color: #f8f9fa; padding: 15px 20px; border-radius: 6px; text-align: right;">
                  <span style="color: #666666; font-size: 14px; text-transform: uppercase;">Total abonado</span>
                  <br>
                  <strong style="color: #0056b3; font-size: 24px;">$${order.totalAmount}</strong>
              </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0;">Ante cualquier consulta, podés responder a este correo o contactarnos por nuestro WhatsApp oficial.</p>
          </div>
      </div>
                `,
      // ACÁ ADJUNTAMOS LA IMAGEN FÍSICA PARA QUE EL CORREO LA LEA, cuando esté publicado
      attachments: [
        {
          filename: "logo.jpeg",
          path: "../frontend/public/logo.jpeg", // Ruta exacta desde la carpeta backend hacia el frontend
          cid: "logo_anselmi", // Este ID debe coincidir con el src="cid:..." del HTML
        },
      ],
    };

    // Enviamos el correo
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EMAIL] ✉️ Correo de confirmación enviado a ${recipientEmail}`,
    );
    console.log(
      `[EMAIL] 👀 VER RECIBO (Solo entorno de prueba): ${nodemailer.getTestMessageUrl(info)}`,
    );
  } catch (error) {
    console.error(
      "[EMAIL] ❌ Error enviando el correo de confirmación:",
      error,
    );
  }
};
