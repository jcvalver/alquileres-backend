import { Request, Response } from "express";
import { prisma } from "../prisma";

// ✅ Obtener todos los contratos (incluye inquilino y departamento)
export const getContratos = async (req: Request, res: Response) => {
  try {
    const contratos = await prisma.contratos.findMany({
      include: {
        departamentos: true,
        inquilinos: true,
      },
    });
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contratos" });
  }
};

// ✅ Obtener contrato por ID
export const getContratoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contrato = await prisma.contratos.findUnique({
      where: { id: BigInt(id) },
      include: {
        departamentos: true,
        inquilinos: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({ error: "Contrato no encontrado" });
    }
    res.json(contrato);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contrato" });
  }
};

// ✅ Crear contrato
export const createContrato = async (req: Request, res: Response) => {
  try {
    const { departamento_id, inquilino_id, fecha_inicio, fecha_fin, monto_mensual, dia_vencimiento } = req.body;

    const nuevo = await prisma.contratos.create({
      data: {
        departamento_id: BigInt(departamento_id),
        inquilino_id: BigInt(inquilino_id),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        monto_mensual,
        dia_vencimiento: dia_vencimiento || 5,
      },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear contrato" });
  }
};

// ✅ Actualizar contrato
export const updateContrato = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, monto_mensual, dia_vencimiento, estado } = req.body;

    const actualizado = await prisma.contratos.update({
      where: { id: BigInt(id) },
      data: {
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : undefined,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : undefined,
        monto_mensual,
        dia_vencimiento,
        estado,
        actualizado_en: new Date(),
      },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar contrato" });
  }
};

// ✅ Eliminar contrato
export const deleteContrato = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.contratos.delete({
      where: { id: BigInt(id) },
    });
    res.json({ message: "Contrato eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar contrato" });
  }
};

// ✅ Contratos vigentes (fecha_fin nula o mayor a hoy)
export const getContratosVigentes = async (_req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const contratos = await prisma.contratos.findMany({
      where: {
        OR: [
          { fecha_fin: null },
          { fecha_fin: { gte: hoy } },
        ],
        estado: "activo",
      },
      include: {
        inquilinos: true,
        departamentos: true,
      },
    });
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contratos vigentes" });
  }
};

// ✅ Contratos vencidos (fecha_fin < hoy o estado != activo)
export const getContratosVencidos = async (_req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const contratos = await prisma.contratos.findMany({
      where: {
        OR: [
          { fecha_fin: { lt: hoy } },
          { estado: { not: "activo" } },
        ],
      },
      include: {
        inquilinos: true,
        departamentos: true,
      },
    });
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contratos vencidos" });
  }
};

// ✅ Contratos próximos a vencer (ej. dentro de 30 días)
export const getContratosPorVencer = async (_req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 30);

    const contratos = await prisma.contratos.findMany({
      where: {
        fecha_fin: {
          gte: hoy,
          lte: limite,
        },
        estado: "activo",
      },
      include: {
        inquilinos: true,
        departamentos: true,
      },
    });
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contratos próximos a vencer" });
  }
};

// ✅ Resumen de contratos (activos, vencidos, total)
export const getResumenContratos = async (_req: Request, res: Response) => {
  try {
    const hoy = new Date();

    const activos = await prisma.contratos.count({
      where: {
        OR: [
          { fecha_fin: null },
          { fecha_fin: { gte: hoy } },
        ],
        estado: "activo",
      },
    });

    const vencidos = await prisma.contratos.count({
      where: {
        OR: [
          { fecha_fin: { lt: hoy } },
          { estado: { not: "activo" } },
        ],
      },
    });

    const total = await prisma.contratos.count();

    res.json({ total, activos, vencidos });
  } catch (error) {
    res.status(500).json({ error: "Error al generar resumen de contratos" });
  }
};
