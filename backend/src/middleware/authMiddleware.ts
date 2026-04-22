// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = "anselmi_secreto_super_seguro_2026";

// Extendemos el Request de Express para que acepte nuestra info de usuario
export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    discount: number;
  };
}

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  // Buscamos el token en los headers de la petición
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]; // Separamos la palabra "Bearer" del token en sí
    try {
      // Desencriptamos el token para sacar el descuento del cliente
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded; // Guardamos al usuario en la petición
    } catch (err) {
      console.log("Token inválido o expirado. Se trata como invitado.");
    }
  }
  next(); // Dejamos pasar la petición al endpoint de productos
};
