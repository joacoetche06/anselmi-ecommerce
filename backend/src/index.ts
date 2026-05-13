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
  resetPassword,
  forgotPassword,
} from "./controllers/authController";
import { optionalAuth, AuthRequest } from "./middleware/authMiddleware";
import orderRoutes from "./routes/orderRoutes"; // <-- Agregalo arriba con los imports
import productRoutes from "./routes/productRoutes";
import { getPublicProducts } from "./controllers/productController";
import { generateCotizador } from "./controllers/reportController";
import { Review } from "./entity/Review";
import { IsNull, Not } from "typeorm";
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

    // 1.6. Productos Relacionados (Cross-selling)
    app.get(
      "/api/products/:id/related",
      optionalAuth,
      async (req: AuthRequest, res: Response): Promise<any> => {
        try {
          const productId = parseInt(req.params.id as string);
          const productRepo = AppDataSource.getRepository(Product);

          const product = await productRepo.findOneBy({ id: productId });
          if (!product)
            return res.status(404).json({ message: "No encontrado" });

          let relatedProducts: Product[] = [];

          // Si el producto tiene línea, buscamos otros de la misma línea
          if (product.linea) {
            relatedProducts = await productRepo.find({
              where: {
                linea: product.linea,
                isActive: true,
                hidden: false,
                id: Not(productId),
              },
              take: 4, // Máximo 4 para que quede parejo en la grilla
            });
          }

          // Si no tiene línea, o era el único de su línea, traemos 4 al azar/novedades
          if (relatedProducts.length === 0) {
            relatedProducts = await productRepo.find({
              where: { isActive: true, hidden: false, id: Not(productId) },
              take: 4,
              order: { id: "DESC" },
            });
          }

          // Aplicamos la misma lógica de precios dinámicos
          const userDiscount = req.user ? req.user.discount : 0;
          const mappedRelated = relatedProducts.map((p) => {
            const netoAleph = Number(p.listPrice);
            const netoConDescuento =
              netoAleph - netoAleph * (userDiscount / 100);
            const precioFinalConIva = netoConDescuento * 1.21;
            return {
              ...p,
              finalPrice: parseFloat(precioFinalConIva.toFixed(2)),
              appliedDiscount: userDiscount,
            };
          });

          res.json(mappedRelated);
        } catch (error) {
          console.error("Error en relacionados:", error);
          res.status(500).json({ message: "Error interno" });
        }
      },
    );

    // --- RUTAS DE RESEÑAS (COMUNIDAD) ---

    // 1. Crear una reseña (Protegida, requiere login)
    app.post(
      "/api/products/:id/reviews",
      optionalAuth,
      async (req: AuthRequest, res: Response): Promise<any> => {
        try {
          if (!req.user) {
            return res
              .status(401)
              .json({ message: "Debes iniciar sesión para dejar una reseña." });
          }

          const { rating, comment } = req.body;
          const productId = parseInt(req.params.id as string);

          const productRepo = AppDataSource.getRepository(Product);
          const reviewRepo = AppDataSource.getRepository(Review);

          const product = await productRepo.findOneBy({ id: productId });
          if (!product)
            return res.status(404).json({ message: "Producto no encontrado" });

          const newReview = reviewRepo.create({
            rating,
            comment,
            user: { id: req.user.id } as any, // Pass only the user ID
            product: product,
            isApproved: true, // Por defecto lo aprobamos.
          });

          await reviewRepo.save(newReview);
          res
            .status(201)
            .json({ message: "Reseña guardada con éxito", review: newReview });
        } catch (error) {
          console.error("Error al guardar reseña:", error);
          res.status(500).json({ message: "Error interno del servidor" });
        }
      },
    );

    // 2. Traer reseñas de un producto específico (Para la vista de detalle)
    app.get(
      "/api/products/:id/reviews",
      async (req: Request, res: Response) => {
        try {
          const productId = parseInt(req.params.id as string);
          const reviewRepo = AppDataSource.getRepository(Review);

          const reviews = await reviewRepo.find({
            where: { product: { id: productId }, isApproved: true },
            relations: ["user"], // Traemos la relación para saber el nombre del autor
            order: { createdAt: "DESC" },
          });

          // Mapeamos para NO mandar datos sensibles del usuario (como el passwordHash)
          const safeReviews = reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            userName: r.user.fullName,
          }));

          res.json(safeReviews);
        } catch (error) {
          console.error("Error al traer reseñas:", error);
          res.status(500).json({ message: "Error interno" });
        }
      },
    );

    // 3. Traer las últimas reseñas globales (Para la Home de Anselmi)
    app.get("/api/reviews/latest", async (req: Request, res: Response) => {
      try {
        const reviewRepo = AppDataSource.getRepository(Review);
        const latestReviews = await reviewRepo.find({
          where: { isApproved: true, rating: 5 }, // Traemos solo las de 5 estrellas para la Home
          relations: ["user", "product"],
          order: { createdAt: "DESC" },
          take: 3, // Solo las 3 más recientes
        });

        const safeReviews = latestReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          userName: r.user.fullName,
          productName: r.product?.name,
          productId: r.product?.id,
        }));

        res.json(safeReviews);
      } catch (error) {
        console.error("Error al traer últimas reseñas:", error);
        res.status(500).json({ message: "Error interno" });
      }
    });

    // 4. Crear una reseña de la EMPRESA (General)
    app.post(
      "/api/reviews/company",
      optionalAuth,
      async (req: AuthRequest, res: Response): Promise<any> => {
        try {
          if (!req.user)
            return res
              .status(401)
              .json({ message: "Iniciá sesión para opinar." });

          const { rating, comment } = req.body;
          const reviewRepo = AppDataSource.getRepository(Review);

          const newReview = reviewRepo.create({
            rating,
            comment,
            user: { id: req.user.id } as any,
            product: null, // <--- CLAVE: Al ser null, es institucional
            isApproved: true,
          });

          await reviewRepo.save(newReview);
          res
            .status(201)
            .json({ message: "¡Gracias por tu opinión sobre Anselmi!" });
        } catch (error) {
          res.status(500).json({ message: "Error al guardar" });
        }
      },
    );

    // 5. Traer TODAS las opiniones generales (Para la página de Comunidad)
    app.get("/api/reviews/company", async (req: Request, res: Response) => {
      try {
        const reviewRepo = AppDataSource.getRepository(Review);
        const reviews = await reviewRepo.find({
          where: { product: IsNull(), isApproved: true }, // Buscamos solo las que no tienen producto
          relations: ["user"],
          order: { createdAt: "DESC" },
        });

        res.json(
          reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            userName: r.user.fullName,
            createdAt: r.createdAt,
          })),
        );
      } catch (error) {
        res.status(500).json({ message: "Error" });
      }
    });

    app.post("/api/auth/forgot-password", forgotPassword);

    app.post("/api/auth/reset-password", resetPassword);

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
