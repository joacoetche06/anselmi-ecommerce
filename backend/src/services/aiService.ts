// backend/src/services/aiService.ts
//
// Lógica de negocio sobre Claude: descripciones de producto y asistente de redacción.
// Acá viven los prompts. El cómo se llama a la API está en anthropicClient.ts.

import { callClaude } from "./anthropicClient";
import { Product } from "../entity/Product";

// ---------- 1. DESCRIPCIONES DE PRODUCTO ----------

const DESCRIPTION_SYSTEM = `Sos un redactor de e-commerce para Anselmi Desarrollos Comerciales,
una distribuidora argentina de griferías, sanitarios y materiales de construcción.
Escribís descripciones de producto en español rioplatense neutro, tono comercial y claro.

Reglas:
- 2 a 3 oraciones, máximo 60 palabras.
- Mencioná el uso típico del producto (baño, cocina, obra, etc.) si se deduce del nombre.
- NO inventes características, medidas, materiales ni specs que no estén en los datos que te paso.
- No uses signos de exclamación excesivos ni lenguaje exagerado.
- Devolvé SOLO la descripción, sin títulos, comillas ni texto adicional.`;

/**
 * Arma el prompt con los datos que tenemos del producto y devuelve la descripción.
 * Usa nombre, marca/línea y color (los que existan).
 */
export async function generateProductDescription(
  product: Pick<Product, "name" | "linea" | "color">,
): Promise<string> {
  const datos: string[] = [`Nombre del producto: ${product.name}`];
  if (product.linea) datos.push(`Línea/marca: ${product.linea}`);
  if (product.color) datos.push(`Color: ${product.color}`);

  const userPrompt = `Generá la descripción para este producto:\n${datos.join("\n")}`;

  return await callClaude({
    system: DESCRIPTION_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 200,
    temperature: 0.7,
  });
}

// ---------- 2. ASISTENTE DE REDACCIÓN (PANEL ADMIN) ----------

export type WritingAction = "generar" | "mejorar" | "acortar" | "corregir";

const WRITING_SYSTEM = `Sos un asistente de redacción para el panel de administración de
Anselmi Desarrollos Comerciales (e-commerce de griferías, sanitarios y materiales).
Ayudás a escribir banners, textos de home y copys de ofertas en español rioplatense,
tono comercial profesional. Devolvé SOLO el texto pedido, sin explicaciones ni comillas.`;

function buildWritingPrompt(action: WritingAction, texto: string): string {
  switch (action) {
    case "generar":
      return `Generá un texto a partir de esta idea o instrucción:\n\n${texto}`;
    case "mejorar":
      return `Mejorá la redacción de este texto, manteniendo el sentido:\n\n${texto}`;
    case "acortar":
      return `Acortá este texto dejándolo más conciso, sin perder lo importante:\n\n${texto}`;
    case "corregir":
      return `Corregí ortografía y gramática de este texto, sin cambiar el estilo:\n\n${texto}`;
    default:
      return texto;
  }
}

export async function assistWriting(
  action: WritingAction,
  texto: string,
): Promise<string> {
  return await callClaude({
    system: WRITING_SYSTEM,
    messages: [{ role: "user", content: buildWritingPrompt(action, texto) }],
    maxTokens: 500,
    temperature: 0.7,
  });
}
