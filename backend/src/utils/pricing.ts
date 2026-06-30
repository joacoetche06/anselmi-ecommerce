import { Config } from "../entity/Config";
import { Product } from "../entity/Product";

export interface PricedProduct {
  finalPrice: number; // con IVA
  cashPrice: number; // con descuento contado
  appliedDiscount: number;
}

export function calculatePrices(
  product: Pick<Product, "listPrice">,
  config: Pick<Config, "taxRate" | "cashDiscount">,
  userDiscount = 0,
): PricedProduct {
  const neto = Number(product.listPrice);
  const netoConDesc = neto - neto * (userDiscount / 100);
  const finalPrice = netoConDesc * (1 + Number(config.taxRate) / 100);
  const cashPrice = finalPrice * (1 - Number(config.cashDiscount) / 100);
  return {
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    cashPrice: parseFloat(cashPrice.toFixed(2)),
    appliedDiscount: userDiscount,
  };
}
