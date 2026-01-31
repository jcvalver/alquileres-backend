import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Crear departamento
export const createDepartamento = async (req: Request, res: Response) => {
  try {
    const { usuario_id, nombre, direccion, descripcion, precio_mensual, estado } = req.body;

    const departamento = await prisma.departamentos.create({
      data: {
        usuario_id,
        nombre,
        direccion,
        descripcion,
        precio_mensual,
        estado: estado || "disponible",
      },
    });

    res.json(departamento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear departamento" });
  }
};

// Listar departamentos
export const getDepartamentos = async (req: Request, res: Response) => {
  try {
    const departamentos = await prisma.departamentos.findMany({
      include: { usuarios: true },
    });
    res.json(departamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar departamentos" });
  }
};

// Obtener por ID
export const getDepartamentoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const departamento = await prisma.departamentos.findUnique({
      where: { id: BigInt(id) },
      include: { usuarios: true },
    });

    if (!departamento) {
      return res.status(404).json({ error: "Departamento no encontrado" });
    }

    res.json(departamento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener departamento" });
  }
};

// Actualizar departamento
export const updateDepartamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuario_id, nombre, direccion, descripcion, precio_mensual, estado } = req.body;

    const departamento = await prisma.departamentos.update({
      where: { id: BigInt(id) },
      data: { usuario_id, nombre, direccion, descripcion, precio_mensual, estado },
    });

    res.json(departamento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar departamento" });
  }
};

// Eliminar departamento
export const deleteDepartamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.departamentos.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: "Departamento eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar departamento" });
  }
};
