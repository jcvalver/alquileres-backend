import { Request, Response } from "express";
import { prisma } from "../prisma";

// ✅ Resumen general de pagos (ingresos esperados vs cobrados)
export const getResumenGeneral = async (req: Request, res: Response) => {
  try {
    const totalEsperado = await prisma.pagos.aggregate({
      _sum: { monto_esperado: true },
    });

    const totalPagado = await prisma.pagos.aggregate({
      _sum: { monto_pagado: true },
    });

    const esperado = totalEsperado._sum.monto_esperado?.toNumber() || 0;
    const pagado = totalPagado._sum.monto_pagado?.toNumber() || 0;

    res.json({
      total_esperado: esperado,
      total_pagado: pagado,
      pendiente: esperado - pagado,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al generar resumen general" });
  }
};

// ✅ Reporte de pagos por mes y año
export const getPagosPorPeriodo = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: "Debe proporcionar year y month" });
    }

    const pagos = await prisma.pagos.findMany({
      where: {
        periodo: {
          gte: new Date(`${year}-${month}-01`),
          lt: new Date(`${year}-${month}-31`),
        },
      },
      include: {
        contratos: {
          include: {
            inquilinos: true,
            departamentos: true,
          },
        },
        estados_pago: true,
      },
    });

    // Convertir Decimals a number en la respuesta
    const pagosConvertidos = pagos.map((p) => ({
      ...p,
      monto_esperado: p.monto_esperado.toNumber(),
      monto_pagado: p.monto_pagado.toNumber(),
    }));

    res.json(pagosConvertidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pagos por periodo" });
  }
};

// ✅ Pagos atrasados
export const getPagosAtrasados = async (req: Request, res: Response) => {
  try {
    const hoy = new Date();

    const atrasados = await prisma.pagos.findMany({
      where: {
        estado_id: { not: 2 }, // asumimos que 2 = pagado
        periodo: { lt: hoy },
      },
      include: {
        contratos: {
          include: {
            inquilinos: true,
            departamentos: true,
          },
        },
        estados_pago: true,
      },
    });

    // Convertir Decimals a number
    const atrasadosConvertidos = atrasados.map((p) => ({
      ...p,
      monto_esperado: p.monto_esperado.toNumber(),
      monto_pagado: p.monto_pagado.toNumber(),
    }));

    res.json(atrasadosConvertidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pagos atrasados" });
  }
};

// ✅ Dashboard con métricas generales
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const contratosActivos = await prisma.contratos.count({
      where: { estado: "activo" },
    });

    const pagosPendientes = await prisma.pagos.count({
      where: { estado_id: 1 }, // Suponiendo 1 = pendiente
    });

    const pagosAtrasados = await prisma.pagos.count({
      where: { estado_id: 2 }, // Suponiendo 2 = atrasado
    });

    const ingresosTotales = await prisma.pagos.aggregate({
      _sum: { monto_pagado: true },
    });

    res.json({
      contratosActivos,
      pagosPendientes,
      pagosAtrasados,
      ingresosTotales: ingresosTotales._sum.monto_pagado || 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener dashboard" });
  }
};

// ✅ Contratos activos
export const getContratosActivos = async (req: Request, res: Response) => {
  try {
    const contratos = await prisma.contratos.findMany({
      where: { estado: "activo" },
      include: {
        inquilinos: true,
        departamentos: true,
      },
    });
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contratos activos" });
  }
};