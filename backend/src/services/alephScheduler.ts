// backend/src/services/alephScheduler.ts
import * as cron from "node-cron";
import { AppDataSource } from "../data-source";
import { Config } from "../entity/Config";
import { syncCatalog } from "./alephSync";

// Formatea una fecha a YYYY-MM-DD, que es lo que espera GetArticulos/{Fecha}.
function toAlephDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Evita solapamiento: si un sync todavía está corriendo, no arranca otro.
let syncing = false;

async function runIncremental() {
  if (syncing) {
    console.log("[aleph-cron] Sync ya en curso, se saltea esta corrida.");
    return;
  }
  syncing = true;
  try {
    const configRepo = AppDataSource.getRepository(Config);
    const config = await configRepo.findOneBy({ id: 1 });

    // Si nunca sincronizó, hace un completo la primera vez.
    // Si ya hay fecha, pide incremental desde esa fecha.
    // Nota: se resta 1 día por seguridad, para no perder cambios en el borde.
    let desde: string | undefined;
    if (config?.lastAlephSync) {
      const d = new Date(config.lastAlephSync);
      d.setDate(d.getDate() - 1);
      desde = toAlephDate(d);
    }

    console.log(
      `[aleph-cron] Incremental ${desde ? "desde " + desde : "(completo, primera vez)"}...`,
    );
    const result = await syncCatalog(desde);
    console.log(
      `[aleph-cron] OK. total:${result.total} nuevos:${result.created} act:${result.updated} salteados:${result.skipped} (${result.durationMs}ms)`,
    );
  } catch (err) {
    console.error("[aleph-cron] Error en sync incremental:", err);
  } finally {
    syncing = false;
  }
}

async function runFull() {
  if (syncing) {
    console.log("[aleph-cron] Sync ya en curso, se saltea el completo.");
    return;
  }
  syncing = true;
  try {
    console.log("[aleph-cron] Sync COMPLETO diario (red de seguridad)...");
    const result = await syncCatalog(); // sin fecha = completo
    console.log(
      `[aleph-cron] Completo OK. total:${result.total} nuevos:${result.created} act:${result.updated} salteados:${result.skipped} (${result.durationMs}ms)`,
    );
  } catch (err) {
    console.error("[aleph-cron] Error en sync completo:", err);
  } finally {
    syncing = false;
  }
}

/**
 * Programa los syncs automáticos. Se llama una vez al arrancar el server.
 * - Incremental: cada hora en punto (min 0).
 * - Completo: todos los días a las 04:00 (madrugada, poca carga).
 *
 * Estos horarios son el patrón e-commerce estándar: el incremental mantiene
 * precio/stock al día durante la jornada, y el completo nocturno repara
 * cualquier cambio que el incremental se haya perdido (ver duda de FechaCambio
 * pendiente con Nurith).
 */
export function startAlephScheduler() {
  // Cada hora en punto
  cron.schedule("0 * * * *", runIncremental);

  // Todos los días a las 04:00
  cron.schedule("0 4 * * *", runFull);

  console.log(
    "[aleph-cron] Scheduler activo: incremental cada hora, completo diario 04:00.",
  );
}
