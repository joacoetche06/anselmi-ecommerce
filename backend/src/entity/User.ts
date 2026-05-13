// backend/src/entity/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserRole {
  ADMIN = "admin",
  B2B = "b2b", // Mayorista
  B2C = "b2c", // Minorista / Consumidor Final
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  fullName: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string; // Guardaremos la contraseña encriptada

  @Column({ type: "varchar", length: 50, nullable: true })
  cuit: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.B2C,
  })
  role: UserRole;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // --- NUEVO CAMPO: Descuento personalizado por cliente ---
  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  address: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  zipCode: string;

  // --- CAMPOS PARA RECUPERAR CONTRASEÑA ---
  @Column({ type: "varchar", length: 255, nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  resetPasswordExpires: Date | null;
}
