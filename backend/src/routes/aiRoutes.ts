// backend/src/routes/aiRoutes.ts
import { Router } from "express";
import { assist, generateDescription } from "../controllers/aiController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Asistente de redacción del panel admin
router.post("/assist", requireAdmin, assist);

// Generar / regenerar descripción de un producto
router.post("/products/:id/description", requireAdmin, generateDescription);

export default router;
