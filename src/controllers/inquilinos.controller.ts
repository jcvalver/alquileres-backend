import { Request, Response } from "express";
import { prisma } from "../prisma";

// ✅ Obtener todos los inquilinos
export const getInquilinos = async (req: Request, res: Response) => {
  try {
    const inquilinos = await prisma.inquilinos.findMany();
    res.json(inquilinos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener inquilinos" });
  }
};

// ✅ Obtener un inquilino por ID
export const getInquilinoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inquilino = await prisma.inquilinos.findUnique({
      where: { id: BigInt(id) },
    });
    if (!inquilino) {
      return res.status(404).json({ error: "Inquilino no encontrado" });
    }
    res.json(inquilino);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener inquilino" });
  }
};

// ✅ Crear un nuevo inquilino
export const createInquilino = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, dni, telefono, correo, direccion } = req.body;
    const nuevo = await prisma.inquilinos.create({
      data: { nombre, apellido, dni, telefono, correo, direccion },
    });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear inquilino" });
  }
};

// ✅ Actualizar inquilino
export const updateInquilino = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, telefono, correo, direccion } = req.body;
    const actualizado = await prisma.inquilinos.update({
      where: { id: BigInt(id) },
      data: { nombre, apellido, dni, telefono, correo, direccion, actualizado_en: new Date() },
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar inquilino" });
  }
};

// ✅ Eliminar inquilino
export const deleteInquilino = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.inquilinos.delete({
      where: { id: BigInt(id) },
    });
    res.json({ message: "Inquilino eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar inquilino" });
  }
};
