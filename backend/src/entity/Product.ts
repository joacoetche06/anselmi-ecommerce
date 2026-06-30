// backend/src/entity/Product.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  // "Artículo" en el Excel de Aleph
  @Column({ type: "varchar", length: 50, unique: true })
  sku: string;

  // "Descripción" en el Excel
  @Column({ type: "varchar", length: 255 })
  name: string;

  // "GENERAL" en el Excel (Precio de fábrica sin IVA)
  @Column({ type: "decimal", precision: 10, scale: 2 })
  listPrice: number;

  // Bonificación de Anselmi
  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  // Ganancia para el público (B2C)
  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  markupPercentage: number;

  // Para el semáforo en Angular
  @Column({ type: "int", default: 0 })
  stockQuantity: number;

  @Column({ type: "boolean", default: false })
  isHeavyFreight: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  imageUrl: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "boolean", default: false })
  hidden: boolean;

  @Column({ type: "varchar", nullable: true })
  linea: string | null;

  @Column({ type: "varchar", nullable: true })
  color: string | null;

  // Descripción generada por Claude (automática)
  @Column({ type: "text", nullable: true })
  autoDescription: string | null;

  // Descripción escrita/editada a mano (tiene prioridad sobre la auto)
  @Column({ type: "text", nullable: true })
  manualDescription: string | null;

  // Cuándo se generó la descripción auto por última vez
  @Column({ type: "timestamp", nullable: true })
  descriptionGeneratedAt: Date | null;
}
