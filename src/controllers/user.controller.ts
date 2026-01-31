import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Obtener todos los usuarios
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.usuarios.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener usuario por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.usuarios.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, email } = req.body;

    const updated = await prisma.usuarios.update({
      where: { id: BigInt(id) },
      data: { nombre, email },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar usuario
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.usuarios.delete({
      where: { id: BigInt(id) },
    });
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
