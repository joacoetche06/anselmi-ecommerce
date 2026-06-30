import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Order, OrderStatus } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { User } from "../entity/User"; // Importamos User por las dudas
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { sendOrderConfirmationEmail } from "../services/emailService";
import { sendOrderStatusUpdateEmail } from "../services/emailService";
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { items, total, guestName, guestDni, guestEmail } = req.body;
  const userData = (req as any).user;
  const userId = userData ? userData.id : null;

  if (!items || items.length === 0) {
    res.status(400).json({ message: "El carrito está vacío" });
    return;
  }

  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const userRepo = AppDataSource.getRepository(User);

    const newOrder = new Order();
    newOrder.totalAmount = total;
    newOrder.status = OrderStatus.PENDING;

    // Declaramos userEntity AFUERA del if para no perder sus datos más abajo
    let userEntity = null;

    if (userId) {
      userEntity = await userRepo.findOneBy({ id: userId });
      if (userEntity) newOrder.user = userEntity;
    } else {
      newOrder.guestName = guestName;
      newOrder.guestDni = guestDni;
      newOrder.guestEmail = guestEmail;
    }

    const savedOrder = await orderRepository.save(newOrder);

    for (const item of items) {
      const newOrderItem = new OrderItem();
      newOrderItem.order = savedOrder;
      newOrderItem.product = { id: item.productId } as any;
      newOrderItem.quantity = item.quantity;
      newOrderItem.unitPriceAtPurchase = item.price;
      await orderItemRepository.save(newOrderItem);
    }

    // === LÓGICA DE RUTEO CORREGIDA ===
    const isWholesaler = userEntity?.role === "b2b";

    if (!userId || !isWholesaler) {
      // --- FLUJO B2C (Invitados y Minoristas) -> Mercado Pago ---
      const mpItems = items.map((item: any) => ({
        id: item.productId.toString(),
        title: item.productName || "Producto Anselmi",
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        currency_id: "ARS",
      }));

      // Extraemos el mail de forma segura
      const payerEmail =
        userEntity?.email || guestEmail || "test_user_123@test.com";

      const prefResponse = await new Preference(client).create({
        body: {
          items: mpItems,
          payer: { email: payerEmail },
          external_reference: savedOrder.id.toString(),

          // ⚠️ IMPORTANTE: Mercado Pago ahora BLOQUEA el uso de "http://" y "localhost".
          // Comentalo mientras estés en tu PC local para evitar el error 400.
          // Al subirlo a producción, descomentalo y usá tu dominio HTTPS.
          /*
          back_urls: {
            success: `${process.env.FRONTEND_URL || "http://localhost:4200"}/order-success?id=${savedOrder.id}`,
            failure: `${process.env.FRONTEND_URL || "http://localhost:4200"}/cart`,
            pending: `${process.env.FRONTEND_URL || "http://localhost:4200"}/order-success?id=${savedOrder.id}`,
          },
          auto_return: "approved",
          */

          notification_url: `${process.env.BACKEND_PUBLIC_URL || "http://localhost:3001"}/api/orders/webhook`,
        },
      });

      res.status(201).json({
        message: "Redirigiendo a Mercado Pago...",
        orderId: savedOrder.id,
        init_point: prefResponse.init_point,
      });
    } else {
      // --- FLUJO B2B (Mayoristas) -> Confirmación Directa ---
      await sendOrderConfirmationEmail(savedOrder.id);
      res.status(201).json({
        message: "¡Pedido guardado con éxito!",
        orderId: savedOrder.id,
      });
    }
  } catch (error) {
    console.error("ERROR AL GUARDAR ORDEN:", error);
    res.status(500).json({ message: "Error interno al procesar el pedido" });
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = (req as any).user?.id;
  console.log("Solicitando pedidos para el usuario ID:", userId);

  if (!userId) {
    console.log("No se encontró ID de usuario en el token.");
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  try {
    const orderRepository = AppDataSource.getRepository(Order);

    const orders = await orderRepository.find({
      where: { user: { id: userId } },
      relations: ["items", "items.product"],
      order: { createdAt: "DESC" },
    });

    console.log(`Se encontraron ${orders.length} pedidos para este usuario.`);
    res.json(orders);
  } catch (error) {
    console.error("Error detallado al obtener órdenes:", error);
    res.status(500).json({ message: "Error al recuperar el historial" });
  }
};

// --- FUNCIÓN PARA EL PANEL DE ADMINISTRACIÓN ---
export const getAllOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Acá en el futuro podemos agregar un IF para que solo pase si req.user.role === 'admin'
  // Por ahora lo dejamos pasar para construir la pantalla visual

  try {
    const orderRepository = AppDataSource.getRepository(Order);

    // Buscamos TODAS las órdenes de la base de datos
    const orders = await orderRepository.find({
      relations: ["user", "items", "items.product"], // Traemos los datos del usuario logueado (si lo hay) y los productos
      order: { createdAt: "DESC" }, // Las más nuevas arriba
    });

    res.json(orders);
  } catch (error) {
    console.error("Error al obtener todas las órdenes:", error);
    res.status(500).json({ message: "Error al recuperar el panel de órdenes" });
  }
};

// --- FUNCIÓN PARA CAMBIAR EL ESTADO DE UNA ORDEN (SOLO ADMIN) ---
export const updateOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orderRepository = AppDataSource.getRepository(Order);

    // IMPORTANTE: Agregamos relations: ["user"] para poder acceder al email del cliente logueado
    const order = await orderRepository.findOne({
      where: { id: parseInt(id as string, 10) },
      relations: ["user"],
    });

    if (!order) {
      res.status(404).json({ message: "Pedido no encontrado" });
      return;
    }

    // Actualizamos el estado en la base de datos
    order.status = status;
    await orderRepository.save(order);

    // --- NUEVA LÓGICA DE EMAILS ---
    // Chequeamos si el pedido lo hizo un usuario registrado o un invitado.
    // Si en tu entidad Order le pusiste otro nombre al email de invitado (ej: guestEmail), cambialo acá.
    const clientEmail = order.user?.email || order.guestEmail;

    if (clientEmail) {
      // Disparamos el correo asíncronamente (sin el await para no trabar la respuesta HTTP del admin)
      sendOrderStatusUpdateEmail(clientEmail, order.id, status);
    }
    // ------------------------------

    res.json({ message: "Estado actualizado exitosamente", order });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// --- FUNCIÓN PÚBLICA PARA SEGUIMIENTO DE INVITADOS ---
export const trackOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id, email } = req.query;

  if (!id || !email) {
    res.status(400).json({ message: "Se requiere ID de pedido y Email." });
    return;
  }

  try {
    const orderRepository = AppDataSource.getRepository(Order);

    // Buscamos la orden que coincida con ambos datos
    const order = await orderRepository.findOne({
      where: {
        id: parseInt(id as string),
        guestEmail: email as string,
      },
      relations: ["items", "items.product"], // Traemos los productos por si quiere ver qué compró
    });

    if (!order) {
      res.status(404).json({
        message:
          "No encontramos ningún pedido con esos datos. Verificá la información.",
      });
      return;
    }

    // Devolvemos solo lo necesario para el rastreo (seguridad)
    res.json({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    console.error("Error en rastreo:", error);
    res.status(500).json({ message: "Error interno al consultar el pedido." });
  }
};

// --- CONFIRMACIÓN DE PAGO DESDE EL FRONTEND ---
export const confirmPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { external_reference, status } = req.body;

  if (status === "approved" && external_reference) {
    try {
      const orderRepository = AppDataSource.getRepository(Order);
      const orderId = parseInt(external_reference);

      const order = await orderRepository.findOneBy({ id: orderId });

      if (order && order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED; // ¡Pago recibido!
        await orderRepository.save(order);
        console.log(`✅ Orden #${order.id} pagada y confirmada.`);
      }

      res.json({ message: "Estado de orden actualizado a confirmado" });
    } catch (error) {
      console.error("Error confirmando pago:", error);
      res.status(500).json({ message: "Error interno al confirmar pago" });
    }
  } else {
    res.status(400).json({ message: "Pago no aprobado o faltan datos" });
  }
};

// --- WEBHOOK DE MERCADO PAGO ---
export const mpWebhook = async (req: Request, res: Response): Promise<void> => {
  // 1. REGLA DE ORO: MP exige que le respondamos un 200 OK inmediatamente (si no, nos bloquea reintentando infinitamente)
  res.status(200).send("OK");

  try {
    // MP manda el ID del pago en req.query.id (para webhooks estándar) o en data.id
    const paymentId = req.query.id || req.body?.data?.id;
    const type = req.query.topic || req.query.type || req.body?.type;

    if ((type === "payment" || type === "payment.created") && paymentId) {
      console.log(
        `[WEBHOOK] 🔔 Notificación de pago recibida. ID: ${paymentId}`,
      );

      // 2. Le preguntamos a MP el estado real de este pago (para evitar que alguien nos mande un webhook falso)
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId as string });

      // 3. Si está aprobado, buscamos nuestra orden usando el external_reference
      if (paymentInfo.status === "approved" && paymentInfo.external_reference) {
        const orderRepository = AppDataSource.getRepository(Order);
        const orderId = parseInt(paymentInfo.external_reference);

        const order = await orderRepository.findOneBy({ id: orderId });

        if (order && order.status === OrderStatus.PENDING) {
          order.status = OrderStatus.CONFIRMED;
          await orderRepository.save(order);
          console.log(
            `[WEBHOOK] ✅ ÉXITO: Orden #${order.id} pagada y confirmada en segundo plano.`,
          );
          // DISPARAMOS EL CORREO AUTOMÁTICO ACÁ:
          await sendOrderConfirmationEmail(order.id);
        } else {
          console.log(
            `[WEBHOOK] ℹ️ La orden #${orderId} ya estaba confirmada previamente o no existe.`,
          );
        }
      }
    }
  } catch (error) {
    console.error("[WEBHOOK] ❌ Error procesando la notificación:", error);
  }
};
