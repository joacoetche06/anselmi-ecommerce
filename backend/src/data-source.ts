// backend/src/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Product } from "./entity/Product";
import { User } from "./entity/User"; // <-- Agregamos esto
import { Order } from "./entity/Order"; // <-- Agregamos esto
import { OrderItem } from "./entity/OrderItem"; // <-- Agregamos esto
import { Config } from "./entity/Config";
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost", // Cambiaremos esto cuando subas a producción en Render/Supabase
  port: 5432,
  username: "postgres", // Tu usuario local de postgres
  password: "postgres", // Tu clave local
  database: "anselmi_db", // El nombre de la base que crees en pgAdmin/consola
  synchronize: true, // ¡Magia! Crea las tablas automáticamente según tus entidades (solo para desarrollo)
  logging: false,
  entities: [Product, User, Order, OrderItem, Config], // <-- Actualizamos este array
  migrations: [],
  subscribers: [],
});
