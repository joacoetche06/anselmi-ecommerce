// backend/src/controllers/authController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/User";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import { MoreThan } from "typeorm";
import { sendPasswordResetEmail } from "../services/emailService";
const JWT_SECRET = process.env.JWT_SECRET!;
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      email,
      password,
      cuit,
      phone,
      address,
      city,
      zipCode,
      role,
      isActive,
    } = req.body;
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
    newUser.phone = phone;
    newUser.address = address;
    newUser.city = city;
    newUser.zipCode = zipCode;

    // Si no mandan rol, por defecto es Minorista (B2C)
    newUser.role = role || UserRole.B2C;

    // LÓGICA DE ACTIVACIÓN AUTOMÁTICA:
    // Los minoristas se activan solos. Los mayoristas (B2B) quedan en false.
    newUser.isActive = newUser.role === UserRole.B2C;

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

// Traer todos los usuarios (para el panel de Admin)
export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    // Traemos todos menos las contraseñas por seguridad
    const users = await userRepository.find({
      select: [
        "id",
        "fullName",
        "email",
        "cuit",
        "phone", // <-- NUEVO
        "address", // <-- NUEVO
        "city", // <-- NUEVO
        "zipCode", // <-- NUEVO
        "role",
        "isActive",
        "discountPercentage",
        "createdAt",
      ],
      order: { createdAt: "DESC" }, // Los más nuevos arriba
    });
    res.json(users);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// Actualizar un usuario (Aprobar/Suspender o cambiar descuento)
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, discountPercentage } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOneBy({
      id: parseInt(id as string, 10),
    });
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (discountPercentage !== undefined)
      user.discountPercentage = discountPercentage;

    await userRepository.save(user);
    res.json({ message: "Usuario actualizado correctamente", user });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// --- NUEVO: OBTENER DATOS DEL USUARIO LOGUEADO ---
export const getMyData = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user viene del middleware de autenticación (authMiddleware)
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    // Devolvemos los datos (sin la contraseña)
    // Devolvemos los datos (sin la contraseña)
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      cuit: user.cuit,
      phone: user.phone, // <-- NUEVO
      address: user.address, // <-- NUEVO
      city: user.city, // <-- NUEVO
      zipCode: user.zipCode, // <-- NUEVO
      role: user.role,
      discountPercentage: user.discountPercentage,
    });
  } catch (error) {
    console.error("Error al obtener mis datos:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

// --- SOLICITAR RECUPERACIÓN DE CONTRASEÑA ---
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ email });

    // No le decimos al frontend si el mail no existe por seguridad (evita escaneo de mails)
    if (!user) {
      res.json({
        message: "Si el correo existe, recibirás un enlace de recuperación.",
      });
      return;
    }

    // Generamos un token aleatorio seguro de 32 caracteres
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Lo guardamos en el usuario con 1 hora de validez
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora en ms
    await userRepository.save(user);

    // Mandamos el mail
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      message: "Si el correo existe, recibirás un enlace de recuperación.",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// --- GUARDAR LA NUEVA CONTRASEÑA ---
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Buscamos al usuario que tenga ESE token y que NO esté vencido
    const user = await userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()), // Que la fecha de vencimiento sea mayor a AHORA
      },
    });

    if (!user) {
      res.status(400).json({ message: "El token es inválido o ha expirado." });
      return;
    }

    // Encriptamos la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // Limpiamos los campos del token para que no se pueda volver a usar
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await userRepository.save(user);

    res.json({
      message: "Contraseña actualizada exitosamente. Ya podés iniciar sesión.",
    });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
