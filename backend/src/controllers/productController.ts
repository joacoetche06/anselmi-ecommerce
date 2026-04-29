import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";

// --- OBTENER TODOS LOS PRODUCTOS PARA ADMIN (Crudos) ---
export const getAdminProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({
      order: { id: "ASC" },
    });
    res.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error interno al cargar el catálogo" });
  }
};
// (El resto del archivo dejalo igual)

// --- CREAR UN NUEVO PRODUCTO ---
export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const newProduct = productRepo.create(req.body); // Toma los datos directo
    const savedProduct = await productRepo.save(newProduct);
    res
      .status(201)
      .json({ message: "Producto creado con éxito", product: savedProduct });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ message: "Error interno al crear el producto" });
  }
};

// --- EDITAR UN PRODUCTO EXISTENTE ---
export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const productId = parseInt(req.params.id as string, 10);

    const product = await productRepo.findOneBy({ id: productId });
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    productRepo.merge(product, req.body); // Pisa directo con los datos nuevos
    const updatedProduct = await productRepo.save(product);
    res.json({ message: "Producto actualizado", product: updatedProduct });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res
      .status(500)
      .json({ message: "Error interno al actualizar el producto" });
  }
};
// --- BORRAR UN PRODUCTO ---
export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    // Le agregamos 'as string' acá también
    const productId = parseInt(req.params.id as string, 10);

    const product = await productRepo.findOneBy({ id: productId });
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    await productRepo.remove(product);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      message:
        "Error interno al eliminar el producto. Revisá que no esté asociado a una orden.",
    });
  }
};
