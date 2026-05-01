import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import { IsNull } from "typeorm";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs"; // <-- Importamos el File System de Node
import * as path from "path"; // <-- Importamos path para manejar rutas

const scrapeFVImages = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la BD. Iniciando búsqueda de imágenes...");

    const productRepo = AppDataSource.getRepository(Product);

    // Buscamos solo los productos que NO tienen imagen
    const productsWithoutImage = await productRepo.find({
      where: [{ imageUrl: "" }, { imageUrl: IsNull() }],
    });

    console.log(
      `🔍 Se encontraron ${productsWithoutImage.length} productos sin imagen.`,
    );

    // --- NUEVO: Preparamos el archivo .txt ---
    const txtPath = path.join(__dirname, "productos_sin_imagen.txt");
    // Borramos el archivo viejo si existe, y le ponemos un encabezado
    fs.writeFileSync(txtPath, "--- REPORTE DE SKU SIN IMAGEN EN FV ---\n\n");
    let missingCount = 0;

    for (const product of productsWithoutImage) {
      try {
        const cleanSku = product.sku.split(" ")[0];
        const searchUrl = `https://fvsa.com/?s=${encodeURIComponent(cleanSku)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        let foundImageUrl = $("article img").first().attr("src");

        if (foundImageUrl) {
          product.imageUrl = foundImageUrl;
          await productRepo.save(product);
          console.log(`✅ ¡Éxito! [${product.sku}] -> ${foundImageUrl}`);
        } else {
          console.log(`⚠️ No se encontró imagen para: ${product.sku}`);

          // --- NUEVO: Escribimos el SKU en el archivo .txt ---
          fs.appendFileSync(
            txtPath,
            `SKU: ${product.sku} | Nombre: ${product.name}\n`,
          );
          missingCount++;
        }

        // Pausa de 2 segundos para no saturar al servidor
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        console.log(`❌ Error buscando el SKU ${product.sku}: ${err.message}`);
        fs.appendFileSync(txtPath, `ERROR AL BUSCAR SKU: ${product.sku}\n`);
        missingCount++;
      }
    }

    // --- NUEVO: Resumen final en el .txt ---
    fs.appendFileSync(
      txtPath,
      `\n--- TOTAL SIN IMAGEN ENCONTRADA: ${missingCount} ---`,
    );

    console.log(`🎉 ¡Proceso de Scraping finalizado!`);
    console.log(
      `📄 Se generó el reporte en: src/scripts/productos_sin_imagen.txt`,
    );

    process.exit(0);
  } catch (error) {
    console.error("Error general:", error);
    process.exit(1);
  }
};

scrapeFVImages();
