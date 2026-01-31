-- CreateTable
CREATE TABLE "contratos" (
    "id" BIGSERIAL NOT NULL,
    "departamento_id" BIGINT NOT NULL,
    "inquilino_id" BIGINT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "monto_mensual" DECIMAL(12,2) NOT NULL,
    "dia_vencimiento" INTEGER NOT NULL DEFAULT 5,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT,
    "nombre" VARCHAR(120) NOT NULL,
    "direccion" VARCHAR(255),
    "descripcion" TEXT,
    "precio_mensual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'disponible',
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_pago" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "color_hex" VARCHAR(7),
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estados_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquilinos" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "apellido" VARCHAR(120) NOT NULL,
    "dni" VARCHAR(20) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(120),
    "direccion" VARCHAR(255),
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquilinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" BIGSERIAL NOT NULL,
    "contrato_id" BIGINT NOT NULL,
    "periodo" DATE NOT NULL,
    "monto_esperado" DECIMAL(12,2) NOT NULL,
    "monto_pagado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metodo" VARCHAR(50),
    "estado_id" INTEGER NOT NULL,
    "fecha_pago" TIMESTAMP(6),
    "notas" TEXT,
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(30) NOT NULL DEFAULT 'admin',
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_contratos_dep" ON "contratos"("departamento_id");

-- CreateIndex
CREATE INDEX "idx_contratos_estado" ON "contratos"("estado");

-- CreateIndex
CREATE INDEX "idx_contratos_inq" ON "contratos"("inquilino_id");

-- CreateIndex
CREATE UNIQUE INDEX "estados_pago_nombre_key" ON "estados_pago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "inquilinos_dni_key" ON "inquilinos"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "inquilinos_correo_key" ON "inquilinos"("correo");

-- CreateIndex
CREATE INDEX "idx_pagos_contrato" ON "pagos"("contrato_id");

-- CreateIndex
CREATE INDEX "idx_pagos_estado" ON "pagos"("estado_id");

-- CreateIndex
CREATE INDEX "idx_pagos_periodo" ON "pagos"("periodo" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_pago_periodo" ON "pagos"("contrato_id", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_inquilino_id_fkey" FOREIGN KEY ("inquilino_id") REFERENCES "inquilinos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados_pago"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
