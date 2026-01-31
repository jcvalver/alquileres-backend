import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ---------- USUARIOS ----------
  const admin = await prisma.usuarios.upsert({
    where: { email: "admin@rentas.com" },
    update: {},
    create: {
      nombre: "Admin",
      email: "admin@rentas.com",
      password_hash: "123456", // ⚠️ En prod usar bcrypt
    },
  });

  // ---------- ESTADOS DE PAGO ----------
  const estados = [
    { nombre: "pendiente", descripcion: "Pago pendiente", color_hex: "#FFA500", orden: 1 },
    { nombre: "pagado", descripcion: "Pago realizado", color_hex: "#28A745", orden: 2 },
    { nombre: "atrasado", descripcion: "Pago vencido", color_hex: "#DC3545", orden: 3 },
  ];

  for (const estado of estados) {
    await prisma.estados_pago.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado,
    });
  }

  // ---------- INQUILINOS ----------
  const inquilino = await prisma.inquilinos.upsert({
    where: { dni: "12345678" },
    update: {},
    create: {
      nombre: "Juan",
      apellido: "Pérez",
      dni: "12345678",
      telefono: "987654321",
      correo: "juan.perez@example.com",
      direccion: "Av. Siempre Viva 123",
    },
  });

  // ---------- DEPARTAMENTOS ----------
  const departamento = await prisma.departamentos.upsert({
    where: { id: 1 },
    update: {},
    create: {
      usuario_id: admin.id,
      nombre: "Departamento 101",
      direccion: "Calle Falsa 123",
      descripcion: "Departamento amplio con vista al parque",
      precio_mensual: 1200.0,
      estado: "disponible",
    },
  });

  // ---------- CONTRATOS ----------
  const contrato = await prisma.contratos.create({
    data: {
      departamento_id: departamento.id,
      inquilino_id: inquilino.id,
      fecha_inicio: new Date("2025-01-01"),
      fecha_fin: new Date("2025-12-31"),
      monto_mensual: 1200.0,
      dia_vencimiento: 5,
      estado: "activo",
    },
  });

  // ---------- PAGOS ----------
  const estadoPendiente = await prisma.estados_pago.findUnique({
    where: { nombre: "pendiente" },
  });

  if (estadoPendiente) {
    await prisma.pagos.create({
      data: {
        contrato_id: contrato.id,
        periodo: new Date("2025-09-01"),
        monto_esperado: 1200.0,
        monto_pagado: 0,
        metodo: null,
        estado_id: estadoPendiente.id,
        notas: "Primer mes de alquiler",
      },
    });
  }

  console.log("✅ Seed completado con usuario, inquilino, departamento, contrato y pago");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
