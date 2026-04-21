// backend/src/entity/Order.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum OrderStatus {
  PENDING = "pending", // Carrito activo / Pedido no finalizado
  CONFIRMED = "confirmed", // El cliente confirmó el pedido
  PROCESSING = "processing", // Anselmi está armando el pedido
  COMPLETED = "completed", // Entregado/Facturado
  CANCELLED = "cancelled",
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  // Relación: Muchos pedidos pueden pertenecer a un usuario
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: "text", nullable: true })
  notes: string; // Comentarios adicionales del cliente para la entrega

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
