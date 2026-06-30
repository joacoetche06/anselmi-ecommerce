import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 5, scale: 2, default: 5.0 })
  cashDiscount: number; // Ej: 5.00 (5%)

  @Column("decimal", { precision: 5, scale: 2, default: 1.5 })
  defaultMargin: number; // Ej: 1.50 (50%)

  @Column("decimal", { precision: 5, scale: 2, default: 21.0 })
  taxRate: number; // Ej: 21.00 (21%)
}
