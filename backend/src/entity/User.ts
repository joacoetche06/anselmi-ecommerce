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
  cuit: string; // Necesario para facturación a clientes B2B

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.B2C,
  })
  role: UserRole;

  @Column({ type: "boolean", default: true })
  isActive: boolean; // Los B2B podrían requerir validación manual (false al inicio)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
