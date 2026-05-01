import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import ExcelJS from "exceljs";
import { Config } from "../entity/Config";
import { User } from "../entity/User"; // <-- Agregá esta importación
import * as path from "path"; // <-- NUEVO
import * as fs from "fs"; // <-- NUEVO
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    discount: number;
    status: string;
  };
}

export const generateCotizador = async (req: AuthRequest, res: Response) => {
  try {
    const configRepo = AppDataSource.getRepository(Config);
    let globalConfig = await configRepo.findOneBy({ id: 1 });

    if (!globalConfig) {
      globalConfig = {
        cashDiscount: 10,
        defaultMargin: 1.5,
        taxRate: 21,
      } as Config;
    }

    // 1. LÓGICA DE USUARIO: Definimos qué descuento aplicar
    let targetDiscount = req.user?.discount || 0;

    // Si es Admin y viene un clientId por query params (?clientId=5), buscamos a ese cliente
    if (req.user?.role === "admin" && req.query.clientId) {
      const userRepo = AppDataSource.getRepository(User);
      const targetUser = await userRepo.findOneBy({
        id: Number(req.query.clientId),
      });
      if (targetUser) {
        targetDiscount = targetUser.discountPercentage;
      }
    }

    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({ order: { name: "ASC" } });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Anselmi - Desarrollos Comerciales";
    const sheet = workbook.addWorksheet("Cotizador Inteligente", {
      views: [{ state: "frozen", ySplit: 5 }],
    });

    const headerFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0056B3" },
    } as ExcelJS.Fill;
    const headerFont = { color: { argb: "FFFFFFFF" }, bold: true, size: 12 };

    // --- NUEVO BLOQUE DEL LOGO ---
    sheet.mergeCells("A1:B4"); // Hacemos la celda del logo un poco más alta

    // Ruta absoluta al logo que guardaste en tu backend
    const logoPath = path.join(__dirname, "../assets/logo.jpeg");
    console.log("Buscando logo en:", logoPath);
    // Verificamos que el logo exista para que no explote si te olvidás de subirlo
    if (fs.existsSync(logoPath)) {
      const logoId = workbook.addImage({
        filename: logoPath,
        extension: "jpeg",
      });

      // Insertamos el logo. tl = Top Left (Arriba Izquierda), br = Bottom Right (Abajo Derecha)
      // TypeScript exige propiedades completas en el tipo Anchor, así que casteamos a any
      // para usar las coordenadas col/row simples que usa exceljs en tiempo de ejecución.
      // Insertamos el logo usando medidas exactas en píxeles para no deformarlo
      sheet.addImage(logoId, {
        tl: { col: 0.2, row: 0.2 }, // Un poquito de margen superior e izquierdo
        ext: { width: 320, height: 70 }, // Ancho y alto exactos (Ajustá estos números si lo querés más grande o chico)
        editAs: "absolute",
      } as any);
    } else {
      // Fallback: Si no encuentra la imagen, pone el texto (como lo tenías antes)
      const titleCell = sheet.getCell("A1");
      titleCell.value = "Cotizador Anselmi - Lista de Precios B2B";
      titleCell.font = { size: 16, bold: true, color: { argb: "FF0056B3" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
    }

    // 2. CABECERA MULTI-DESCUENTO (La Cascada)
    // 2. CABECERA MULTI-DESCUENTO (La Cascada)
    // Fusionamos E y F para que las etiquetas tengan lugar de sobra, y alineamos a la derecha

    sheet.mergeCells("E1:F1");
    sheet.getCell("E1").value = "Tu Bonificación:";
    sheet.getCell("E1").font = { bold: true };
    sheet.getCell("E1").alignment = { horizontal: "right" };
    sheet.getCell("G1").value = targetDiscount / 100;
    sheet.getCell("G1").numFmt = "0.00%";

    sheet.mergeCells("E2:F2");
    sheet.getCell("E2").value = "Desc. Pago Contado:";
    sheet.getCell("E2").font = { bold: true };
    sheet.getCell("E2").alignment = { horizontal: "right" };
    sheet.getCell("G2").value = globalConfig.cashDiscount / 100;
    sheet.getCell("G2").numFmt = "0.00%";

    sheet.mergeCells("E3:F3");
    sheet.getCell("E3").value = "Tu Margen (Remarque):";
    sheet.getCell("E3").font = { bold: true };
    sheet.getCell("E3").alignment = { horizontal: "right" };
    sheet.getCell("G3").value = globalConfig.defaultMargin;
    sheet.getCell("G3").font = { bold: true, color: { argb: "FF28A745" } }; // Verde para indicar edición

    sheet.mergeCells("E4:F4");
    sheet.getCell("E4").value = "IVA:";
    sheet.getCell("E4").font = { bold: true };
    sheet.getCell("E4").alignment = { horizontal: "right" };
    sheet.getCell("G4").value = globalConfig.taxRate / 100;
    sheet.getCell("G4").numFmt = "0.00%";

    sheet.getRow(5).values = [
      "SKU",
      "Descripción",
      "Precio Lista Base",
      "Tu Costo Neto",
      "Precio Venta (Público)",
      "Cantidad",
      "Subtotal",
    ];
    sheet.getRow(5).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center" };
    });

    sheet.columns = [
      { width: 15 },
      { width: 50 },
      { width: 18 },
      { width: 18 },
      { width: 22 },
      { width: 12 },
      { width: 18 },
    ];

    let currentRow = 6;
    for (const p of products) {
      const row = sheet.getRow(currentRow);

      row.getCell("A").value = p.sku;
      row.getCell("B").value = p.name;

      row.getCell("C").value = Number(p.listPrice);
      row.getCell("C").numFmt = '"$"#,##0.00';

      // 3. FÓRMULA EN CASCADA: Precio * (1 - Bonificacion) * (1 - PagoContado)
      row.getCell("D").value = {
        formula: `C${currentRow}*(1-$G$1)*(1-$G$2)`,
        date1904: false,
      };
      row.getCell("D").numFmt = '"$"#,##0.00';
      row.getCell("D").font = { bold: true };

      // Col E: Precio Venta = Costo * Margen * (1 + IVA)
      row.getCell("E").value = {
        formula: `D${currentRow}*$G$3*(1+$G$4)`,
        date1904: false,
      };
      row.getCell("E").numFmt = '"$"#,##0.00';

      row.getCell("F").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF3CD" },
      } as ExcelJS.Fill;

      row.getCell("G").value = {
        formula: `IF(ISBLANK(F${currentRow}), "", E${currentRow}*F${currentRow})`,
        date1904: false,
      };
      row.getCell("G").numFmt = '"$"#,##0.00';

      currentRow++;
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Cotizador_Anselmi.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al generar cotizador:", error);
    res.status(500).json({ message: "Error interno al generar el reporte" });
  }
};
