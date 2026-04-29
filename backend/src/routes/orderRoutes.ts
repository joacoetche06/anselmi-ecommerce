import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
  confirmPayment,
  mpWebhook, // <-- 1. Importamos la función nueva
} from "../controllers/orderController";
import { optionalAuth, requireAdmin } from "../middleware/authMiddleware";

const router = Router();
router.get("/track", trackOrder);

// Rutas de Maxi (Admin)
router.get("/admin/all", requireAdmin, getAllOrders);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

// --- NUEVA RUTA WEBHOOK (Tiene que ser POST y pública) ---
router.post("/webhook", mpWebhook);

// Rutas de clientes
router.get("/", optionalAuth, getUserOrders);
router.post("/", optionalAuth, createOrder);
router.post("/confirm-payment", confirmPayment);

export default router;
