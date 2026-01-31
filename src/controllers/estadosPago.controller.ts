import { Request, Response } from "express";
import { prisma } from "../prisma";

// ✅ Obtener todos los estados de pago
export const getEstadosPago = async (req: Request, res: Response) => {
  try {
    const estados = await prisma.estados_pago.findMany({
      orderBy: { orden: "asc" },
    });
    res.json(estados);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estados de pago" });
  }
};

// ✅ Obtener un estado de pago por ID
export const getEstadoPagoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const estado = await prisma.estados_pago.findUnique({
      where: { id: Number(id) },
    });

    if (!estado) {
      return res.status(404).json({ error: "Estado de pago no encontrado" });
    }

    res.json(estado);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estado de pago" });
  }
};

// ✅ Crear un nuevo estado de pago
export const createEstadoPago = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, color_hex, orden } = req.body;

    const nuevo = await prisma.estados_pago.create({
      data: { nombre, descripcion, color_hex, orden },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear estado de pago" });
  }
};

// ✅ Actualizar estado de pago
export const updateEstadoPago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, color_hex, orden } = req.body;

    const actualizado = await prisma.estados_pago.update({
      where: { id: Number(id) },
      data: { nombre, descripcion, color_hex, orden },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado de pago" });
  }
};

// ✅ Eliminar estado de pago
export const deleteEstadoPago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.estados_pago.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Estado de pago eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar estado de pago" });
  }
};
