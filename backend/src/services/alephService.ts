// backend/src/services/alephService.ts
import axios from "axios";
import https from "https";

// La API de Aleph es HTTP plano; el agente evita que axios falle por SSL
// cuando en algún entorno se fuerce https. Headers de auth fijos del cliente.
const alephApi = axios.create({
  baseURL: "http://aleph.dyndns.info/integracion",
  headers: {
    apikey: process.env.ALEPH_APIKEY || "ADCT-8083-2055",
    clientid: process.env.ALEPH_CLIENTID || "ANSELMI",
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 60000,
});

// --- Tipos de la respuesta de Aleph (solo los campos que usamos) ---
export interface AlephArticulo {
  Codigo: string;
  Nombre: string;
  Precio1: number;
  Stock: number;
  StockInfinito: boolean;
  TasaIva: number;
  MonedaVenta: number; // 20 = pesos (confirmado por Nurith 30/06)
  Web: boolean;
  Habilitado: boolean;
  Marca: string;
  Rubro: string;
  Imagen1: string;
  Nomenclador: string;
}

export interface AlephStock {
  Producto: string;
  Cantidad: number;
  Deposito: string;
  CodigoDeposito: number;
}

const MONEDA_PESOS = 20;

/**
 * Trae el catálogo completo de Aleph.
 * soloweb=false devuelve TODOS los artículos (no solo los habilitados para web).
 * El objeto artículo ya incluye el campo `Stock`, así que en el flujo normal
 * no hace falta llamar a getStock por cada producto.
 */
export async function getArticulos(
  soloweb = false,
): Promise<AlephArticulo[]> {
  const { data } = await alephApi.get<AlephArticulo[]>(
    `/articulos/GetArticulosAll/?soloweb=${soloweb}`,
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Consulta el stock de UN producto puntual por su código de Aleph.
 * Nurith (30/06): se consulta por Producto, NO por Deposito (Anselmi no usa
 * depósitos). Respuesta:
 *   - [] cuando el producto no tiene stock  -> interpretar como 0
 *   - [{ Cantidad }] cuando tiene stock
 * Se usa para refrescar un producto individual; el sync masivo usa el campo
 * Stock que ya viene en getArticulos.
 */
export async function getStock(codigoAleph: string): Promise<number> {
  const { data } = await alephApi.get<AlephStock[]>(
    `/stock/GetStock?Producto=${encodeURIComponent(codigoAleph)}`,
  );
  if (!Array.isArray(data) || data.length === 0) return 0;
  return Number(data[0].Cantidad) || 0;
}

/**
 * Normaliza un artículo de Aleph a los campos de nuestra entidad Product.
 * Devuelve null si el artículo no debe importarse (moneda desconocida, etc.).
 */
export function mapArticuloToProduct(a: AlephArticulo): {
  sku: string;
  name: string;
  listPrice: number;
  taxRate: number;
  stockQuantity: number;
} | null {
  // Validación defensiva de moneda: solo importamos pesos.
  // Si algún artículo viniera en otra moneda, lo salteamos para no cargar
  // un precio incorrecto (habría que resolver conversión antes).
  if (Number(a.MonedaVenta) !== MONEDA_PESOS) return null;

  const price = Number(a.Precio1);
  if (isNaN(price) || price <= 0) return null;

  // StockInfinito: si Aleph marca stock infinito, no tiene sentido un número;
  // lo tratamos como un stock alto para que nunca aparezca sin stock.
  const stock = a.StockInfinito ? 9999 : Number(a.Stock) || 0;

  return {
    // SKU confirmado (30/06): es `Codigo`. Coincide con product.sku existente
    // (ej. "0103/C3 CR" en ambos lados). El upsert matchea por este campo.
    sku: a.Codigo,
    name: a.Nombre,
    listPrice: price,
    taxRate: Number(a.TasaIva) || 21,
    stockQuantity: stock,
    // NOTA: isActive NO se decide acá. El sync respeta el isActive de los
    // productos existentes (lo maneja el admin) y aplica un default solo a
    // los nuevos. Ver syncCatalog en alephSync.ts.
  };
}
