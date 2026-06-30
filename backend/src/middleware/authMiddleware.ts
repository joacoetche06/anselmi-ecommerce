// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
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

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;

      // EL FIX: Verificamos que req.user exista ANTES de leer el role
      if (req.user && req.user.role === "admin") {
        next(); // ¡Adelante, jefe!
        return;
      } else {
        res.status(403).json({
          message: "Acceso denegado: Zona exclusiva para administradores.",
        });
        return;
      }
    } catch (err) {
      res.status(401).json({ message: "Token inválido o expirado." });
      return;
    }
  } else {
    res.status(401).json({ message: "No autorizado. Inicie sesión." });
  }
};
