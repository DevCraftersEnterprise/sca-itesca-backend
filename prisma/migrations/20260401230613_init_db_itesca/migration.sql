-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLEADO', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('ONLINE', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "CursoTipo" AS ENUM ('INTERNO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "CursoEstado" AS ENUM ('POR_INSCRIBIR', 'EN_CURSO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "AsistenciaEstado" AS ENUM ('ASISTENCIA', 'FALTA', 'JUSTIFICADA');

-- CreateEnum
CREATE TYPE "ValidacionEstado" AS ENUM ('POR_VALIDAR', 'VALIDADO');

-- CreateEnum
CREATE TYPE "Calificacion" AS ENUM ('APROBADO', 'REPROBADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'EMPLEADO',
    "puesto" TEXT,
    "adscripcionId" INTEGER NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adscripcion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Adscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionHrs" INTEGER NOT NULL,
    "modalidad" "Modalidad" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "tipo" "CursoTipo" NOT NULL,
    "estado" "CursoEstado" NOT NULL DEFAULT 'POR_INSCRIBIR',
    "reconocimiento" TEXT,
    "creadorId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "estado" "AsistenciaEstado" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cursoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoAdscripcion" (
    "id" SERIAL NOT NULL,
    "adscripcionId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,

    CONSTRAINT "CursoAdscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoEmpleado" (
    "id" SERIAL NOT NULL,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "ValidacionEstado" NOT NULL DEFAULT 'POR_VALIDAR',
    "calificacion" "Calificacion",
    "constancia" TEXT,
    "cursoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "CursoEmpleado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Adscripcion_nombre_key" ON "Adscripcion"("nombre");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_adscripcionId_fkey" FOREIGN KEY ("adscripcionId") REFERENCES "Adscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoAdscripcion" ADD CONSTRAINT "CursoAdscripcion_adscripcionId_fkey" FOREIGN KEY ("adscripcionId") REFERENCES "Adscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoAdscripcion" ADD CONSTRAINT "CursoAdscripcion_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoEmpleado" ADD CONSTRAINT "CursoEmpleado_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoEmpleado" ADD CONSTRAINT "CursoEmpleado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
