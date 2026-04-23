import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Order, OrderStatus } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { User } from "../entity/User"; // Importamos User por las dudas

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { items, total, guestName, guestDni, guestEmail } = req.body;
  // DEBUG: Vamos a ver qué llega en req.user
  console.log("--- PROCESANDO NUEVA ORDEN ---");
  console.log("Usuario en request:", (req as any).user);

  const userData = (req as any).user;
  const userId = userData ? userData.id : null;

  console.log("ID de usuario extraído:", userId);

  if (!items || items.length === 0) {
    res.status(400).json({ message: "El carrito está vacío" });
    return;
  }

  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);

    const newOrder = new Order();
    newOrder.totalAmount = total;
    newOrder.status = OrderStatus.PENDING;

    if (userId) {
      const userRepo = AppDataSource.getRepository(User);
      const userEntity = await userRepo.findOneBy({ id: userId });
      if (userEntity) newOrder.user = userEntity;
    } else {
      // Si NO hay usuario (Invitado B2C), guardamos sus datos en la orden
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

    console.log("Orden guardada con ID:", savedOrder.id);
    console.log("------------------------------");

    res.status(201).json({
      message: "¡Pedido guardado con éxito!",
      orderId: savedOrder.id,
    });
  } catch (error) {
    console.error("ERROR AL GUARDAR ORDEN:", error);
    res.status(500).json({ message: "Error interno al procesar el pedido" });
  }
};

// Al final de src/controllers/orderController.ts

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
  const { status } = req.body;

  try {
    const orderRepository = AppDataSource.getRepository(Order);

    // Obtener id seguro desde params (req.params.id puede ser string o string[])
    const rawId = req.params.id as string | string[] | undefined;
    const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
    const orderId = idStr ? parseInt(idStr, 10) : NaN;

    if (isNaN(orderId)) {
      res.status(400).json({ message: "ID de orden inválido" });
      return;
    }

    // Buscamos la orden por su ID
    const order = await orderRepository.findOneBy({ id: orderId });

    if (!order) {
      res.status(404).json({ message: "Orden no encontrada" });
      return;
    }

    // Actualizamos el estado (TypeORM se encarga de validar contra el Enum)
    order.status = status as any;
    await orderRepository.save(order);

    res.json({ message: `Orden #${orderId} actualizada a ${status}`, order });
  } catch (error) {
    console.error("Error al actualizar el estado de la orden:", error);
    res.status(500).json({ message: "Error interno al modificar la orden" });
  }
};

export const trackOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id, email } = req.query; // Lo recibimos por URL query string

  try {
    const orderRepository = AppDataSource.getRepository(Order);

    // Buscamos una orden que coincida con el ID Y con el email del invitado
    const order = await orderRepository.findOne({
      where: {
        id: parseInt(id as string),
        guestEmail: email as string,
      },
    });

    if (!order) {
      res
        .status(404)
        .json({ message: "No encontramos ninguna orden con esos datos." });
      return;
    }

    res.json({
      id: order.id,
      status: order.status,
      total: order.totalAmount,
      date: order.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al consultar la orden" });
  }
};
