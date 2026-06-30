// backend/src/controllers/aiController.ts
//
// Endpoints HTTP para las features de IA. Todos van protegidos con requireAdmin
// (ver aiRoutes.ts). Nacen protegidos a propósito.

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import {
  generateProductDescription,
  assistWriting,
  WritingAction,
} from "../services/aiService";

const VALID_ACTIONS: WritingAction[] = [
  "generar",
  "mejorar",
  "acortar",
  "corregir",
];

// --- ASISTENTE DE REDACCIÓN: POST /api/ai/assist ---
// Body: { texto: string, accion: "generar" | "mejorar" | "acortar" | "corregir" }
export const assist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { texto, accion } = req.body;

    if (!accion || !VALID_ACTIONS.includes(accion)) {
      res.status(400).json({
        message: `Acción inválida. Usá una de: ${VALID_ACTIONS.join(", ")}.`,
      });
      return;
    }
    if (accion !== "generar" && (!texto || !texto.trim())) {
      res.status(400).json({ message: "Falta el texto a procesar." });
      return;
    }

    const resultado = await assistWriting(accion, texto || "");
    res.json({ resultado });
  } catch (error: any) {
    console.error("Error en asistente de redacción:", error.message);
    res.status(500).json({
      message: "No se pudo generar el texto. Intentá de nuevo.",
    });
  }
};

// --- DESCRIPCIÓN ON-DEMAND: POST /api/ai/products/:id/description ---
// Genera (o regenera) la descripción automática de un producto y la guarda.
export const generateDescription = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productId = parseInt(req.params.id as string, 10);
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOneBy({ id: productId });

    if (!product) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    const descripcion = await generateProductDescription(product);

    // Guardamos como descripción AUTO. La manual (si existe) no se toca.
    product.autoDescription = descripcion;
    product.descriptionGeneratedAt = new Date();
    await productRepo.save(product);

    res.json({
      message: "Descripción generada",
      autoDescription: descripcion,
    });
  } catch (error: any) {
    console.error("Error al generar descripción:", error.message);
    res.status(500).json({
      message: "No se pudo generar la descripción. Intentá de nuevo.",
    });
  }
};
