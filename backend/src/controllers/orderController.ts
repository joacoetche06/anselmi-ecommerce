import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Order, OrderStatus } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { User } from "../entity/User"; // Importamos User por las dudas

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { items, total, guestName, guestDni } = req.body;
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
