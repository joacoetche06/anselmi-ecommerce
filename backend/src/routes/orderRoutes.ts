import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
  confirmPayment,
} from "../controllers/orderController";
import { optionalAuth, requireAdmin } from "../middleware/authMiddleware"; // <-- 1. Importamos el middleware

const router = Router();
router.get("/track", trackOrder);
// Rutas de Maxi (Admin)
router.get("/admin/all", requireAdmin, getAllOrders);
router.patch("/:id/status", requireAdmin, updateOrderStatus); // <-- NUEVA RUTA PROTEGIDA

// Rutas de clientes
router.get("/", optionalAuth, getUserOrders);
router.post("/", optionalAuth, createOrder);
router.post("/confirm-payment", confirmPayment);
export default router;
