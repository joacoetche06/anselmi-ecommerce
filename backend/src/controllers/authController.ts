// backend/src/controllers/authController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/User";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = "anselmi_secreto_super_seguro_2026"; // En producción esto va en un archivo .env

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, cuit, role, isActive } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    // 1. Verificar si el email ya existe
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      res.status(400).json({ message: "El email ya está registrado" });
      return;
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Crear el nuevo usuario
    const newUser = new User();
    newUser.fullName = fullName;
    newUser.email = email;
    newUser.passwordHash = passwordHash;
    newUser.cuit = cuit;
    newUser.role = role;

    // LÓGICA MEJORADA:
    // Si mandan el campo isActive desde el frontend (como hará el admin), lo respetamos.
    // Si no lo mandan (ej: un registro público a futuro), por defecto los B2B nacen inactivos.
    if (isActive !== undefined) {
      newUser.isActive = isActive;
    } else if (role === UserRole.B2B) {
      newUser.isActive = false;
    } else {
      newUser.isActive = true;
    }

    await userRepository.save(newUser);

    res.status(201).json({
      message: "Usuario registrado con éxito",
      isActive: newUser.isActive,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // 1. Buscar al usuario
    const user = await userRepository.findOneBy({ email });
    if (!user) {
      res.status(400).json({ message: "Credenciales inválidas" });
      return;
    }

    // 2. Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(400).json({ message: "Credenciales inválidas" });
      return;
    }

    // 3. Verificar si el usuario está activo (Especial para B2B esperando validación)
    if (!user.isActive) {
      res.status(403).json({
        message:
          "Tu cuenta Mayorista está pendiente de validación por la administración.",
      });
      return;
    }

    // 4. Generar el Token (JWT)
    const token = jwt.sign(
      { id: user.id, role: user.role, discount: user.discountPercentage },
      JWT_SECRET,
      { expiresIn: "1d" }, // El login dura 1 día
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        discountPercentage: user.discountPercentage,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
