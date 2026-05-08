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

    // Buscamos solo los productos que NO tienen linea asignada (asumimos que si no tienen línea, tampoco tienen imagen ni color)
    const productsWithoutImage = await productRepo.find({
      where: [{ linea: IsNull() }],
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
        const searchResponse = await axios.get(searchUrl);

        // 1. Cargamos los resultados de búsqueda
        let $ = cheerio.load(searchResponse.data);

        // 2. Buscamos el link para ENTRAR al producto
        const productDetailUrl = $("article a").first().attr("href");

        if (productDetailUrl) {
          // 3. Viajamos a la URL del producto individual
          const detailResponse = await axios.get(productDetailUrl);
          $ = cheerio.load(detailResponse.data); // Recargamos Cheerio con la página nueva

          // 4. Ahora sí, en la página correcta, buscamos todo
          // Buscamos la imagen principal de la galería de WooCommerce
          let foundImageUrl = $(".woocommerce-product-gallery__image img")
            .first()
            .attr("src");

          // Buscamos los atributos (le sacamos la 'a' para que agarre el texto haya o no un link)
          const colorRaw = $(
            ".woocommerce-product-attributes-item--attribute_pa_color td p",
          )
            .text()
            .trim();
          const lineaRaw = $(
            ".woocommerce-product-attributes-item--attribute_pa_linea td p",
          )
            .text()
            .trim();

          // 5. Asignamos y guardamos
          product.imageUrl = foundImageUrl || product.imageUrl; // Si no encuentra foto nueva, deja la vieja
          product.color = colorRaw !== "" ? colorRaw : null;
          product.linea = lineaRaw !== "" ? lineaRaw : null;

          await productRepo.save(product);

          console.log(
            `✅ ¡Éxito! [${product.sku}] -> Color: ${product.color || "N/A"} | Línea: ${product.linea || "N/A"}`,
          );
        } else {
          console.log(
            `⚠️ No se encontró el producto en el buscador: ${product.sku}`,
          );
          fs.appendFileSync(
            txtPath,
            `SKU: ${product.sku} | Nombre: ${product.name}\n`,
          );
          missingCount++;
        }

        // Pausa obligatoria para no tirarles el servidor a FV
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
