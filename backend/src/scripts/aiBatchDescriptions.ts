// backend/src/scripts/aiBatchDescriptions.ts
//
// Genera descripciones para TODO el catálogo de una sola pasada usando la Batch API
// de Anthropic (50% más barato). Pensado para correr UNA vez sobre los ~6900 productos.
//
// Cómo correrlo (cuando ya esté la key en el .env):
//   npx ts-node src/scripts/aiBatchDescriptions.ts
//
// Por defecto solo procesa productos que NO tienen autoDescription todavía.
// Es seguro volver a correrlo: no repite los ya hechos.

import "dotenv/config";
import "reflect-metadata";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import { IsNull } from "typeorm";

const ANTHROPIC_BATCH_URL = "https://api.anthropic.com/v1/messages/batches";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";

const DESCRIPTION_SYSTEM = `Sos un redactor de e-commerce para Anselmi Desarrollos Comerciales,
una distribuidora argentina de griferías, sanitarios y materiales de construcción.
Escribís descripciones de producto en español rioplatense neutro, tono comercial y claro.

Reglas:
- 2 a 3 oraciones, máximo 60 palabras.
- Mencioná el uso típico del producto si se deduce del nombre.
- NO inventes características, medidas ni specs que no estén en los datos.
- Devolvé SOLO la descripción, sin títulos ni comillas.`;

function buildUserPrompt(p: Product): string {
  const datos: string[] = [`Nombre del producto: ${p.name}`];
  if (p.linea) datos.push(`Línea/marca: ${p.linea}`);
  if (p.color) datos.push(`Color: ${p.color}`);
  return `Generá la descripción para este producto:\n${datos.join("\n")}`;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ Falta ANTHROPIC_API_KEY en el .env.");
    process.exit(1);
  }

  await AppDataSource.initialize();
  console.log("✅ Conectado a la base de datos.");

  const productRepo = AppDataSource.getRepository(Product);

  // Solo los que todavía no tienen descripción automática.
  const productos = await productRepo.find({
    where: { autoDescription: IsNull() },
    order: { id: "ASC" },
  });

  console.log(`📦 Productos a procesar: ${productos.length}`);
  if (productos.length === 0) {
    console.log("Nada pendiente. Listo.");
    await AppDataSource.destroy();
    return;
  }

  // Armamos los requests del batch. custom_id = id del producto, para mapear la respuesta.
  const requests = productos.map((p) => ({
    custom_id: `product-${p.id}`,
    params: {
      model: MODEL,
      max_tokens: 200,
      temperature: 0.7,
      system: DESCRIPTION_SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(p) }],
    },
  }));

  // 1. Creamos el batch
  console.log("⏳ Enviando batch a Anthropic...");
  const createResp = await axios.post(
    ANTHROPIC_BATCH_URL,
    { requests },
    {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
    },
  );

  const batchId = createResp.data.id;
  console.log(`✅ Batch creado: ${batchId}`);

  // 2. Polleamos hasta que termine
  let resultsUrl: string | null = null;
  while (!resultsUrl) {
    await new Promise((r) => setTimeout(r, 15000)); // esperamos 15s entre chequeos
    const statusResp = await axios.get(`${ANTHROPIC_BATCH_URL}/${batchId}`, {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
    });
    const status = statusResp.data.processing_status;
    const counts = statusResp.data.request_counts;
    console.log(
      `   estado: ${status} | ok: ${counts?.succeeded ?? 0} / ${productos.length}`,
    );
    if (status === "ended") {
      resultsUrl = statusResp.data.results_url;
    }
  }

  // 3. Bajamos resultados (formato JSONL) y guardamos
  console.log("⬇️  Descargando resultados...");
  const resultsResp = await axios.get(resultsUrl!, {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    responseType: "text",
  });

  const lines = (resultsResp.data as string).trim().split("\n");
  let guardados = 0;
  let fallidos = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    const id = parseInt(entry.custom_id.replace("product-", ""), 10);

    if (entry.result?.type === "succeeded") {
      const text = entry.result.message.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
        .trim();

      if (text) {
        await productRepo.update(id, {
          autoDescription: text,
          descriptionGeneratedAt: new Date(),
        });
        guardados++;
      }
    } else {
      fallidos++;
      console.warn(`   ⚠️ Falló product-${id}`);
    }
  }

  console.log(`\n✅ Listo. Guardados: ${guardados} | Fallidos: ${fallidos}`);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("❌ Error en el batch:", err.response?.data || err.message);
  process.exit(1);
});
