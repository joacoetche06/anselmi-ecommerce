import { Router } from "express";
import {
  getAdminProducts, // <-- Le cambiamos el nombre
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// NUEVA RUTA: Exclusiva para que Maxi vea los precios crudos (listPrice)
router.get("/admin/all", requireAdmin, getAdminProducts);

// (Borramos el router.get("/") para que tu index.ts vuelva a controlar el catálogo)

// Rutas protegidas de edición
router.post("/", requireAdmin, createProduct);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
