import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import { ILike } from "typeorm";

// --- OBTENER TODOS LOS PRODUCTOS PARA ADMIN (Crudos y sin filtros) ---
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
    console.error("Error al obtener productos de admin:", error);
    res.status(500).json({ message: "Error al cargar catálogo" });
  }
};

// --- OBTENER PRODUCTOS PARA EL CATÁLOGO (Con filtros y búsqueda) ---
export const getPublicProducts = async (req: Request): Promise<Product[]> => {
  const productRepo = AppDataSource.getRepository(Product);

  const { search, orderBy, ...filters } = req.query;

  // Condición base obligatoria: Activo y NO oculto
  let baseCondition: any = { isActive: true, hidden: false };

  // Agregamos filtros dinámicos (linea, color) a la condición base
  Object.keys(filters).forEach((key) => {
    if (filters[key]) {
      baseCondition[key] = filters[key];
    }
  });

  let whereConditions: any;

  if (search) {
    // Si hay búsqueda, es: (baseCondition AND nombre coincide) OR (baseCondition AND sku coincide)
    whereConditions = [
      { ...baseCondition, name: ILike(`%${search}%`) },
      { ...baseCondition, sku: ILike(`%${search}%`) },
    ];
  } else {
    // Si no hay búsqueda, solo aplicamos la base
    whereConditions = baseCondition;
  }

  let order: any = { id: "DESC" };
  if (orderBy === "price_asc") order = { listPrice: "ASC" };
  if (orderBy === "price_desc") order = { listPrice: "DESC" };

  return await productRepo.find({
    where: whereConditions,
    order: order,
  });
};

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
    const productId = parseInt(req.params.id as string, 10);

    const product = await productRepo.findOneBy({ id: productId });
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    // Soft-delete: lo desactivamos en vez de borrarlo, para no romper
    // los pedidos históricos (OrderItem) que lo referencian.
    product.isActive = false;
    await productRepo.save(product);

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      message: "Error interno al eliminar el producto.",
    });
  }
};
