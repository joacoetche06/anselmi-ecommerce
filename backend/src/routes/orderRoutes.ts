import { Router } from "express";
import { createOrder, getUserOrders } from "../controllers/orderController";
import { optionalAuth } from "../middleware/authMiddleware"; // <-- 1. Importamos el middleware

const router = Router();

router.get("/", optionalAuth, getUserOrders);
router.post("/", optionalAuth, createOrder);

export default router;
