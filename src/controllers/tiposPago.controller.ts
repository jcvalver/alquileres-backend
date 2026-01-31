import { Request, Response } from "express";
import { prisma } from "../prisma";

// ✅ Obtener todos los tipos de pago
export const getTiposPago = async (req: Request, res: Response) => {
  try {
    const tipos = await prisma.tiposPago.findMany({
      orderBy: { id: "asc" },
    });
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tipos de pago" });
  }
};

// ✅ Obtener un tipo de pago por ID
export const getTipoPagoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tipo = await prisma.tiposPago.findUnique({
      where: { id: Number(id) },
    });

    if (!tipo) {
      return res.status(404).json({ error: "Tipo de pago no encontrado" });
    }

    res.json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tipo de pago" });
  }
};

// ✅ Crear un nuevo tipo de pago
export const createTipoPago = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion } = req.body;

    const nuevo = await prisma.tiposPago.create({
      data: { nombre, descripcion },
    });

    res.status(201).json(nuevo);
  } catch (error: any) {
    // Manejar conflicto por unique constraint de nombre
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "El nombre ya existe" });
    }
    res.status(500).json({ error: "Error al crear tipo de pago" });
  }
};

// ✅ Actualizar tipo de pago
export const updateTipoPago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const actualizado = await prisma.tiposPago.update({
      where: { id: Number(id) },
      data: { nombre, descripcion },
    });

    res.json(actualizado);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Tipo de pago no encontrado" });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "El nombre ya existe" });
    }
    res.status(500).json({ error: "Error al actualizar tipo de pago" });
  }
};

// ✅ Eliminar tipo de pago
export const deleteTipoPago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.tiposPago.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Tipo de pago eliminado correctamente" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Tipo de pago no encontrado" });
    }
    res.status(500).json({ error: "Error al eliminar tipo de pago" });
  }
};
