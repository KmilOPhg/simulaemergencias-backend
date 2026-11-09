-- CreateTable
CREATE TABLE "ejercicios_grupos" (
    "id" SERIAL NOT NULL,
    "ejercicioId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "seleccionadoPorId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ejercicios_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ejercicios_grupos_grupoId_idx" ON "ejercicios_grupos"("grupoId");

-- CreateIndex
CREATE UNIQUE INDEX "ejercicios_grupos_ejercicioId_grupoId_key" ON "ejercicios_grupos"("ejercicioId", "grupoId");

-- AddForeignKey
ALTER TABLE "ejercicios_grupos" ADD CONSTRAINT "ejercicios_grupos_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicios_emergencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejercicios_grupos" ADD CONSTRAINT "ejercicios_grupos_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejercicios_grupos" ADD CONSTRAINT "ejercicios_grupos_seleccionadoPorId_fkey" FOREIGN KEY ("seleccionadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
