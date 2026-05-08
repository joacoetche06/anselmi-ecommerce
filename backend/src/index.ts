// backend/src/index.ts
import "reflect-metadata";
import express, { Request, Response } from "express"; // <-- Importación corregida y con tipos
import cors from "cors"; // <-- Importación corregida
import { AppDataSource } from "./data-source";
import { Product } from "./entity/Product";
import {
  register,
  login,
  updateUser,
  getAllUsers,
  getMyData,
} from "./controllers/authController";
import { optionalAuth, AuthRequest } from "./middleware/authMiddleware";
import orderRoutes from "./routes/orderRoutes"; // <-- Agregalo arriba con los imports
import productRoutes from "./routes/productRoutes";
import { getPublicProducts } from "./controllers/productController";
import { generateCotizador } from "./controllers/reportController";
// Inicializamos la aplicación Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/orders", orderRoutes); // <-- Conectamos la ruta
app.use("/api/products", productRoutes);
AppDataSource.initialize()
  .then(async () => {
    console.log(
      "✅ Conexión a la base de datos de Anselmi establecida con éxito.",
    );

    // --- RUTAS DE LA API ---

    // 1. Obtener todos los productos (Catálogo Dinámico)
    app.get(
      "/api/products",
      optionalAuth,
      async (req: AuthRequest, res: Response) => {
        try {
          // 🔥 ACÁ ESTÁ LA MAGIA: Llamamos a tu función con filtros
          const products = await getPublicProducts(req);

          // ¿El usuario se logueó? Sacamos su descuento. Si es invitado, es 0.
          const userDiscount = req.user ? req.user.discount : 0;

          // Recorremos los productos y calculamos en tiempo real
          const productsWithDynamicPricing = products.map((p) => {
            const netoAleph = Number(p.listPrice);
            const netoConDescuento =
              netoAleph - netoAleph * (userDiscount / 100);
            const precioFinalConIva = netoConDescuento * 1.21;

            return {
              id: p.id,
              sku: p.sku,
              name: p.name,
              stockQuantity: p.stockQuantity,
              finalPrice: parseFloat(precioFinalConIva.toFixed(2)),
              appliedDiscount: userDiscount,
              requierePresupuesto: p.requierePresupuesto,
              imageUrl: p.imageUrl, // <--- ¡AGREGÁ ESTA LÍNEA ACÁ!
            };
          });

          res.json(productsWithDynamicPricing);
        } catch (error) {
          console.error("Error al obtener productos:", error);
          res.status(500).json({ message: "Error interno del servidor" });
        }
      },
    );

    // 2. Rutas de Autenticación
    app.post("/api/auth/register", register);
    app.post("/api/auth/login", login);

    app.get("/api/auth/users", getAllUsers);
    app.put("/api/auth/users/:id", updateUser);

    app.get("/api/products/cotizador", optionalAuth, generateCotizador);

    // 1.5 Obtener UN producto por ID (con precio dinámico)
    app.get(
      "/api/products/:id",
      optionalAuth,
      async (req: AuthRequest, res: Response): Promise<any> => {
        try {
          const productRepo = AppDataSource.getRepository(Product);
          // Buscamos el producto por el ID que viene en la URL
          const p = await productRepo.findOneBy({
            id: parseInt(req.params.id as string),
          });

          if (!p) {
            return res.status(404).json({ message: "Producto no encontrado" });
          }

          // Aplicamos la misma lógica de precios que en el catálogo
          const userDiscount = req.user ? req.user.discount : 0;
          const netoAleph = Number(p.listPrice);
          const netoConDescuento = netoAleph - netoAleph * (userDiscount / 100);
          const precioFinalConIva = netoConDescuento * 1.21;

          // Armamos la respuesta fusionando la data de la BD con los precios calculados
          const productWithDynamicPricing = {
            ...p, // Esto trae el id, sku, name, imageUrl, linea, color, etc.
            finalPrice: parseFloat(precioFinalConIva.toFixed(2)),
            appliedDiscount: userDiscount,
          };

          res.json(productWithDynamicPricing);
        } catch (error) {
          console.error("Error al obtener el producto:", error);
          res.status(500).json({ message: "Error interno del servidor" });
        }
      },
    );

    app.get("/api/auth/users", getAllUsers);
    app.get("/api/auth/me", optionalAuth, getMyData);

    // --- LEVANTAR EL SERVIDOR ---
    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
      console.log(
        `👉 Probá el catálogo en: http://localhost:${PORT}/api/products`,
      );
    });
  })
  .catch((error) =>
    console.log("❌ Error al conectar con la base de datos: ", error),
  );
