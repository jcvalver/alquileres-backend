import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../prisma";
import { fileTypeFromFile } from "file-type";
import { storageConfig } from "../config/storage";
import { deleteFromSupabaseByPublicUrl, uploadImageToSupabase } from "../services/supabaseStorage.service";

type MulterRequest = Request & { file?: Express.Multer.File; files?: { [fieldname: string]: Express.Multer.File[] } };

// ✅ Obtener todos los pagos
export const getPagos = async (req: Request, res: Response) => {
  try {
    const pagos = await prisma.pagos.findMany({
      include: {
        contratos:{
          include: {
            inquilinos: true,       // 🔹 Agrega datos del inquilino
            departamentos: true,    // 🔹 Agrega datos del departamento
          },
        },
        estados_pago: true,
      },
      orderBy: { id: "asc" }, // opcional, para mantener orden
    });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pagos" });
  }
};

// ✅ Obtener pago por ID
export const getPagoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pago = await prisma.pagos.findUnique({
      where: { id: BigInt(id) },
      include: {
        contratos: true,
        estados_pago: true,
      },
    });

    if (!pago) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    res.json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pago" });
  }
};

// ✅ Crear pago
export const createPago = async (req: Request, res: Response) => {
  try {
    const { contrato_id, periodo, fecha_pago, monto_esperado, monto_pagado, metodo, estado_id, notas, tipo_pago_id } = req.body;

    // Manejo de archivos (multer guarda en req.files para upload.fields)
    const files = (req as MulterRequest).files;
  const comprobanteFile = files?.comprobante?.[0];
  const reciboFile = files?.recibo?.[0];

    let comprobantePath: string | null = null;
    let reciboPath: string | null = null;

    if (comprobanteFile) {
      // Validación estricta: comprobar magic bytes con file-type
      const tipo = await fileTypeFromFile(comprobanteFile.path).catch(() => null);
      if (!tipo || !tipo.mime.startsWith("image/")) {
        try { fs.unlinkSync(comprobanteFile.path); } catch (e) { /* ignore */ }
        return res.status(400).json({ error: "Sólo se permiten archivos de imagen como comprobante" });
      }

      if (storageConfig.provider === "supabase") {
        const uploaded = await uploadImageToSupabase({
          filePath: comprobanteFile.path,
          folder: "comprobantes",
          originalName: comprobanteFile.originalname,
        });
        try { fs.unlinkSync(comprobanteFile.path); } catch (e) { /* ignore */ }
        comprobantePath = uploaded.publicUrl;
      } else {
        comprobantePath = path.join("uploads", "comprobantes", comprobanteFile.filename);
      }
    }

    if (reciboFile) {
      const tipoRec = await fileTypeFromFile(reciboFile.path).catch(() => null);
      if (!tipoRec || !tipoRec.mime.startsWith("image/")) {
        try { fs.unlinkSync(reciboFile.path); } catch (e) { /* ignore */ }
        return res.status(400).json({ error: "Sólo se permiten archivos de imagen como recibo" });
      }

      if (storageConfig.provider === "supabase") {
        const uploaded = await uploadImageToSupabase({
          filePath: reciboFile.path,
          folder: "recibos",
          originalName: reciboFile.originalname,
        });
        try { fs.unlinkSync(reciboFile.path); } catch (e) { /* ignore */ }
        reciboPath = uploaded.publicUrl;
      } else {
        reciboPath = path.join("uploads", "recibos", reciboFile.filename);
      }
    }

    const nuevo = await prisma.pagos.create({
      data: {
        contrato_id: BigInt(contrato_id),
        periodo: new Date(periodo),
        fecha_pago: fecha_pago ? new Date(fecha_pago) : null,
        monto_esperado,
        monto_pagado: monto_pagado || 0,
        metodo,
        estado_id:Number(estado_id),
        notas,
        tipo_pago_id:Number(tipo_pago_id),
        comprobante_pago: comprobantePath,
        recibo_pago: reciboPath,
  },
    });

    res.status(201).json(nuevo);
  } catch (error: any) {
    console.error("❌ Error en createPago:", error);
    res.status(500).json({ error: "Error al crear pago", detalle: error.message });
  }
};

// ✅ Actualizar pago
export const updatePago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { monto_pagado,periodo,fecha_pago, metodo, estado_id, notas, tipo_pago_id } = req.body;

  // Manejo de archivos (puede venir comprobante y/o recibo en req.files)
  const files = (req as MulterRequest).files;
  const comprobanteFile = files?.comprobante?.[0];
  const reciboFile = files?.recibo?.[0];

  // traer pago actual para poder borrar comprobante/recibo anterior si aplica
  const pagoActual = await prisma.pagos.findUnique({ where: { id: BigInt(id) } });
    if (!pagoActual) return res.status(404).json({ error: "Pago no encontrado" });
    let comprobantePath = pagoActual.comprobante_pago || null;
  let reciboPath = pagoActual.recibo_pago || null;

    if (comprobanteFile) {
      // Validación estricta: comprobar magic bytes con file-type
      const tipo = await fileTypeFromFile(comprobanteFile.path).catch(() => null);
      if (!tipo || !tipo.mime.startsWith("image/")) {
        try { fs.unlinkSync(comprobanteFile.path); } catch (e) { /* ignore */ }
        return res.status(400).json({ error: "Sólo se permiten archivos de imagen como comprobante" });
      }

      // borrar anterior si existe
      if (pagoActual.comprobante_pago) {
        if (storageConfig.provider === "supabase") {
          await deleteFromSupabaseByPublicUrl(String(pagoActual.comprobante_pago));
        } else {
          const absoluteOld = path.join(process.cwd(), String(pagoActual.comprobante_pago));
          try { if (fs.existsSync(absoluteOld)) fs.unlinkSync(absoluteOld); } catch (e) { /* ignore */ }
        }
      }

      if (storageConfig.provider === "supabase") {
        const uploaded = await uploadImageToSupabase({
          filePath: comprobanteFile.path,
          folder: "comprobantes",
          originalName: comprobanteFile.originalname,
        });
        try { fs.unlinkSync(comprobanteFile.path); } catch (e) { /* ignore */ }
        comprobantePath = uploaded.publicUrl;
      } else {
        comprobantePath = path.join("uploads", "comprobantes", comprobanteFile.filename);
      }
    }

    if (reciboFile) {
      const tipoRec = await fileTypeFromFile(reciboFile.path).catch(() => null);
      if (!tipoRec || !tipoRec.mime.startsWith("image/")) {
        try { fs.unlinkSync(reciboFile.path); } catch (e) { /* ignore */ }
        return res.status(400).json({ error: "Sólo se permiten archivos de imagen como recibo" });
      }

      if (pagoActual.recibo_pago) {
        if (storageConfig.provider === "supabase") {
          await deleteFromSupabaseByPublicUrl(String(pagoActual.recibo_pago));
        } else {
          const absoluteOldRecibo = path.join(process.cwd(), String(pagoActual.recibo_pago));
          try { if (fs.existsSync(absoluteOldRecibo)) fs.unlinkSync(absoluteOldRecibo); } catch (e) { /* ignore */ }
        }
      }

      if (storageConfig.provider === "supabase") {
        const uploaded = await uploadImageToSupabase({
          filePath: reciboFile.path,
          folder: "recibos",
          originalName: reciboFile.originalname,
        });
        try { fs.unlinkSync(reciboFile.path); } catch (e) { /* ignore */ }
        reciboPath = uploaded.publicUrl;
      } else {
        reciboPath = path.join("uploads", "recibos", reciboFile.filename);
      }
    }

    const actualizado = await prisma.pagos.update({
      where: { id: BigInt(id) },
      data: {
        monto_pagado,
        metodo,
        estado_id:Number(estado_id),
        tipo_pago_id:Number(tipo_pago_id),
        notas,
        periodo: new Date(periodo),
        fecha_pago: fecha_pago ? new Date(fecha_pago) : null,
        comprobante_pago: comprobantePath,
        recibo_pago: reciboPath,
        actualizado_en: new Date(),
  },
    });

    res.json(actualizado);
  } catch (error: any) {
     console.error("❌ Error en createPago:", error);
    res.status(500).json({ error: "Error al actualizar pago", detalle: error.message });
  }
};

// ✅ Eliminar pago
export const deletePago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.pagos.delete({
      where: { id: BigInt(id) },
    });
    res.json({ message: "Pago eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar pago" });
  }
};

// ✅ Reporte: pagos por contrato
export const getPagosByContrato = async (req: Request, res: Response) => {
  try {
    const { contratoId } = req.params;
    const pagos = await prisma.pagos.findMany({
      where: { contrato_id: BigInt(contratoId) },
      orderBy: { periodo: "desc" },
      include: { estados_pago: true },
    });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pagos por contrato" });
  }
};

// ✅ Reporte: deudas activas (pagos pendientes o atrasados)
export const getDeudas = async (_req: Request, res: Response) => {
  try {
    const deudas = await prisma.pagos.findMany({
      where: {
        estados_pago: {
          nombre: { in: ["pendiente", "atrasado"] },
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
    res.json(deudas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener deudas activas" });
  }
};

// ✅ Reporte: resumen mensual (monto esperado vs pagado)
export const getResumenMensual = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    const pagos = await prisma.pagos.findMany({
      where: {
        periodo: {
          gte: new Date(`${year}-${month}-01`),
          lt: new Date(`${year}-${Number(month) + 1}-01`),
        },
      },
    });

    const totalEsperado = pagos.reduce((acc, p) => acc + Number(p.monto_esperado), 0);
    const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto_pagado), 0);

    res.json({
      year,
      month,
      totalEsperado,
      totalPagado,
      diferencia: totalEsperado - totalPagado,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al generar resumen mensual" });
  }
};

// ✅ Pagos agrupados por contrato
export const getPagosAgrupadosPorContrato = async (req: Request, res: Response) => {
  try {
    const contratos = await prisma.contratos.findMany({
      include: {
        inquilinos: true,
        departamentos: true,
        pagos: {
          include: {
            estados_pago: true,
            tipos_pago: true,
          },
          orderBy: { periodo: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    // 🔹 Transformar estructura para frontend
    const resultado = contratos.map((c) => ({
      contrato_id: c.id,
      nombre: c.departamentos?.nombre || "Sin departamento",
      inquilino: c.inquilinos
        ? `${c.inquilinos.nombre} ${c.inquilinos.apellido}`
        : "Sin inquilino",
      pagos: c.pagos.map((p) => ({
        id: p.id,
        periodo: p.periodo,
        fecha_pago:p.fecha_pago,
        monto_esperado: Number(p.monto_esperado),
        monto_pagado: Number(p.monto_pagado),
        estados_pago: p.estados_pago ? {id:p.estados_pago.id, nombre: p.estados_pago.nombre } : null,
        tipos_pago: p.tipos_pago ? {id:p.tipos_pago.id, nombre: p.tipos_pago.nombre } : null,
        comprobante_pago: p.comprobante_pago ? String(p.comprobante_pago).replace(/\\\\/g, '/') : null,
        comprobante_url: p.comprobante_pago
          ? `${req.protocol}://${req.get("host") || `localhost:${process.env.PORT || 4000}`}/${String(p.comprobante_pago).replace(/\\\\/g, '/')}`
          : null,
         recibo_pago: p.recibo_pago ? String(p.recibo_pago).replace(/\\\\/g, '/') : null,
         recibo_url: p.recibo_pago
           ? `${req.protocol}://${req.get("host") || `localhost:${process.env.PORT || 4000}`}/${String(p.recibo_pago).replace(/\\\\/g, '/')}`
           : null,
        notas:p.notas
      })),
    }));

    res.json(resultado);
  } catch (error) {
    console.error("❌ Error en getPagosAgrupadosPorContrato:", error);
    res.status(500).json({ error: "Error al obtener pagos agrupados por contrato" });
  }
};
