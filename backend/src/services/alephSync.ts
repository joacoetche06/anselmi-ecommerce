// backend/src/services/alephSync.ts
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import { getArticulos, mapArticuloToProduct } from "./alephService";

export interface SyncResult {
  total: number; // artículos traídos de Aleph
  created: number; // productos nuevos
  updated: number; // productos existentes actualizados
  skipped: number; // salteados (moneda no pesos, precio inválido)
  durationMs: number;
}

/**
 * Sincroniza el catálogo completo desde Aleph.
 *
 * Política acordada (30/06):
 * - Match por `Codigo` (== product.sku).
 * - Existentes: se actualiza precio, stock, nombre e IVA. NO se toca isActive
 *   (la visibilidad la maneja el admin).
 * - Nuevos: entran con isActive = true (visibles). El admin oculta lo que no va.
 * - El stock sale del campo `Stock` que ya viene en getArticulos, así que no
 *   se hace una llamada por producto.
 */
export async function syncCatalog(): Promise<SyncResult> {
  const start = Date.now();
  const productRepo = AppDataSource.getRepository(Product);

  const articulos = await getArticulos(false); // false = todo el catálogo

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const articulo of articulos) {
    const mapped = mapArticuloToProduct(articulo);
    if (!mapped) {
      skipped++;
      continue;
    }

    let product = await productRepo.findOneBy({ sku: mapped.sku });

    if (!product) {
      // Nuevo: se crea visible.
      product = new Product();
      product.sku = mapped.sku;
      product.isActive = true;
      created++;
    } else {
      // Existente: se respeta isActive tal cual está.
      updated++;
    }

    product.name = mapped.name;
    product.listPrice = mapped.listPrice;
    product.taxRate = mapped.taxRate;
    product.stockQuantity = mapped.stockQuantity;

    await productRepo.save(product);
  }

  return {
    total: articulos.length,
    created,
    updated,
    skipped,
    durationMs: Date.now() - start,
  };
}
