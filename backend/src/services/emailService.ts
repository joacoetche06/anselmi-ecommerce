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

    // Armamos el cuerpo del correo
    const mailOptions = {
      from: '"Anselmi Sanitarios" <ventas@anselmi.com.ar>', // Remitente ficticio
      to: recipientEmail,
      subject: `¡Confirmación de Pedido #${order.id}!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #0056b3;">¡Gracias por tu compra en Anselmi!</h2>
            <p>Hola, queríamos avisarte que tu pedido <strong>#${order.id}</strong> fue confirmado exitosamente y ya lo estamos preparando.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <h3>Resumen de tu compra:</h3>
            <ul>${itemsHtml}</ul>
            <h3 style="color: #333; background: #f4f4f4; padding: 10px; border-radius: 4px;">Total abonado: $${order.totalAmount}</h3>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 0.9rem;">Ante cualquier consulta, podés responder a este correo o contactarnos por WhatsApp.</p>
        </div>
      `,
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
