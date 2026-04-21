// backend/src/scripts/importAleph.ts
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import * as xlsx from "xlsx";
import * as path from "path";

async function runImport() {
  console.log("Iniciando conexión a la BD...");
  await AppDataSource.initialize();
  const productRepo = AppDataSource.getRepository(Product);

  // Apuntamos al archivo FV que tenés en la carpeta docs
  const filePath = path.join(__dirname, "../../../docs/LISTA FV GRIFERIAS.XLS");
  console.log(`Leyendo archivo de Aleph: ${filePath}`);

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Lo convertimos a una matriz para poder recorrer las filas fácilmente
    const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    let isDataRow = false;
    let upsertCount = 0;

    for (const row of rows) {
      // 1. Buscamos dónde empieza la tabla de datos real
      if (!isDataRow) {
        if (row[0] === "Artículo") {
          isDataRow = true;
        }
        continue;
      }

      // 2. Filtramos filas vacías
      if (!row[0] || row[0].toString().trim() === "") continue;

      // 3. Mapeamos: Código, Descripción y Precio "GENERAL"
      const sku = row[0].toString().trim();
      const description = row[2] ? row[2].toString().trim() : "";
      const price = parseFloat(row[3]); // El precio GENERAL está en la columna D (índice 3)

      // Si el precio es inválido o no existe, saltamos la fila
      if (isNaN(price)) continue;

      // 4. Lógica "Upsert" (Actualiza si existe, crea si es nuevo)
      let product = await productRepo.findOneBy({ sku });
      if (!product) {
        product = new Product();
        product.sku = sku;
      }

      product.name = description;
      product.listPrice = price;

      await productRepo.save(product);
      upsertCount++;
    }

    console.log(
      `✅ ¡Importación exitosa! Se procesaron y guardaron ${upsertCount} artículos.`,
    );
  } catch (error) {
    console.error("Error al leer el archivo Excel:", error);
  } finally {
    process.exit(0);
  }
}

runImport().catch((err) => {
  console.error("❌ Hubo un error fatal en la importación:", err);
  process.exit(1);
});
