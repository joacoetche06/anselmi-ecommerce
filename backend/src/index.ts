// backend/src/index.ts
import "reflect-metadata";
import express, { Request, Response } from "express"; // <-- Importación corregida y con tipos
import cors from "cors"; // <-- Importación corregida
import { AppDataSource } from "./data-source";
import { Product } from "./entity/Product";

// Inicializamos la aplicación Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

AppDataSource.initialize()
  .then(async () => {
    console.log(
      "✅ Conexión a la base de datos de Anselmi establecida con éxito.",
    );

    // --- RUTAS DE LA API ---

    // 1. Obtener todos los productos (Catálogo)
    app.get("/api/products", async (req: Request, res: Response) => {
      try {
        const productRepo = AppDataSource.getRepository(Product);
        const products = await productRepo.find();
        res.json(products);
      } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error interno del servidor" });
      }
    });

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
