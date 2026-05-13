// backend/src/entity/Review.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Product } from "./Product";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  rating: number; // Ej: de 1 a 5 estrellitas

  @Column({ type: "text" })
  comment: string;

  // Si queremos moderar comentarios (que el admin apruebe o borre)
  @Column({ type: "boolean", default: true })
  isApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relación: Una reseña pertenece a UN usuario
  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  // Relación: Una reseña pertenece a UN producto
  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: "productId" })
  product: Product | null; // Ahora puede ser null
}
