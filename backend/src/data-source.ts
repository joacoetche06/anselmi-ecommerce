// backend/src/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Product } from "./entity/Product";
import { User } from "./entity/User"; // <-- Agregamos esto
import { Order } from "./entity/Order"; // <-- Agregamos esto
import { OrderItem } from "./entity/OrderItem"; // <-- Agregamos esto
import { Config } from "./entity/Config";
import { Review } from "./entity/Review";
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "anselmi_db",
  synchronize: process.env.NODE_ENV !== "production",
  logging: false,
  entities: [Product, User, Order, OrderItem, Config, Review], // <-- Actualizamos este array
  migrations: [],
  subscribers: [],
});
