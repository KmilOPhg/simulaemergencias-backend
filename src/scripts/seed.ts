import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";

// ─── Roles ───────────────────────────────────────────────────────────────────

async function seedRoles() {
    const roles = [
        { nombre: "admin", descripcion: "Administrador del sistema (acceso total)" },
        { nombre: "user", descripcion: "Usuario operativo estándar" },
    ] as const;

    for (const r of roles) {
        await prisma.rol.upsert({
            where: { nombre: r.nombre },
            create: { nombre: r.nombre, descripcion: r.descripcion, activo: true },
            update: { descripcion: r.descripcion, activo: true },
        });
    }

    const result = await prisma.rol.findMany({ select: { id: true, nombre: true } });
    console.log("✔ Roles:");
    console.table(result);
    return result;
}

// ─── Permisos ────────────────────────────────────────────────────────────────

const PERMISOS = [
    // USUARIOS
    { codigo: "usuarios.crear", nombre: "Crear usuarios", descripcion: "Registrar usuarios (POST /auth/register)", modulo: "USUARIOS" },
    { codigo: "usuarios.consultar", nombre: "Consultar usuarios", descripcion: "Listar y ver detalle de usuarios", modulo: "USUARIOS" },
    { codigo: "usuarios.actualizar", nombre: "Actualizar usuarios", descripcion: "Modificar datos de usuarios", modulo: "USUARIOS" },
    { codigo: "usuarios.deshabilitar", nombre: "Deshabilitar usuarios", descripcion: "Activar/inactivar usuarios", modulo: "USUARIOS" },
    // ROLES
    { codigo: "roles.crear", nombre: "Crear roles", descripcion: "Crear rol y asignar permisos", modulo: "ROLES" },
    { codigo: "roles.consultar", nombre: "Consultar roles", descripcion: "Listar roles y ver rol con permisos", modulo: "ROLES" },
    { codigo: "roles.actualizar", nombre: "Actualizar roles", descripcion: "Modificar rol y sus permisos", modulo: "ROLES" },
    { codigo: "roles.inhabilitar", nombre: "Inhabilitar roles", descripcion: "Activar/inactivar un rol", modulo: "ROLES" },
    // RECURSOS (módulo de ejemplo)
    { codigo: "recursos.crear", nombre: "Crear recursos", descripcion: "Alta de recursos", modulo: "RECURSOS" },
    { codigo: "recursos.consultar", nombre: "Consultar recursos", descripcion: "Listar y ver recursos", modulo: "RECURSOS" },
    { codigo: "recursos.actualizar", nombre: "Actualizar recursos", descripcion: "Modificar recursos", modulo: "RECURSOS" },
    { codigo: "recursos.deshabilitar", nombre: "Deshabilitar recursos", descripcion: "Activar/inactivar recursos", modulo: "RECURSOS" },
    // ESTUDIANTES (HU-01)
    { codigo: "estudiantes.consultar", nombre: "Consultar estudiantes", descripcion: "Listar estudiantes con los campos necesarios para identificarlos", modulo: "ESTUDIANTES" },
    // EJERCICIOS (HU-04)
    { codigo: "ejercicios.crear", nombre: "Registrar ejercicios", descripcion: "Registrar un ejercicio de emergencia", modulo: "EJERCICIOS" },
    // VERIFICACIONES (HU-07)
    { codigo: "verificaciones.registrar", nombre: "Registrar verificaciones", descripcion: "Registrar la verificación de un estudiante en un ejercicio", modulo: "VERIFICACIONES" },
] as const;

async function seedPermisos() {
    for (const permiso of PERMISOS) {
        await prisma.permiso.upsert({
            where: { codigo: permiso.codigo },
            create: permiso,
            update: permiso,
        });
    }

    const result = await prisma.permiso.findMany({ select: { id: true, codigo: true, nombre: true, modulo: true } });
    console.log("✔ Permisos:");
    console.table(result);
    return result;
}

// ─── Asignación de permisos por rol ──────────────────────────────────────────

async function seedRolPermisos() {
    const admin = await prisma.rol.findUniqueOrThrow({ where: { nombre: "admin" } });
    const user = await prisma.rol.findUniqueOrThrow({ where: { nombre: "user" } });
    const permisos = await prisma.permiso.findMany();

    // admin: todos los permisos
    await prisma.rolPermiso.createMany({
        data: permisos.map((p) => ({ rolId: admin.id, permisoId: p.id })),
        skipDuplicates: true,
    });

    // user: responsable operativo de los ejercicios (consulta estudiantes, registra ejercicios y verificaciones)
    const permisosOperativos = new Set([
        "recursos.consultar",
        "estudiantes.consultar",
        "ejercicios.crear",
        "verificaciones.registrar",
    ]);
    const permisosUser = permisos.filter((p) => permisosOperativos.has(p.codigo));
    await prisma.rolPermiso.createMany({
        data: permisosUser.map((p) => ({ rolId: user.id, permisoId: p.id })),
        skipDuplicates: true,
    });

    console.log("✔ Permisos asignados a roles admin/user.");
}

// ─── Usuario administrador por defecto ───────────────────────────────────────

async function seedUsuarioAdmin() {
    const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin123";

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
        console.log(`✔ Usuario admin ya existe (${email}), no se modifica.`);
        return;
    }

    const admin = await prisma.rol.findUniqueOrThrow({ where: { nombre: "admin" } });
    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
        data: {
            nombre: "Administrador",
            email,
            passwordHash,
            usuarioRoles: { create: [{ rolId: admin.id }] },
        },
    });

    console.log(`✔ Usuario admin creado: ${email} / ${password} (id ${usuario.id})`);
    console.log("  ⚠ Cambia esta contraseña antes de ir a producción.");
}

// Datos ficticios para el prototipo. No corresponden a estudiantes reales de Ágape School.
const GRUPOS = [
    { codigo: "1A", nombre: "Primero A" },
    { codigo: "3B", nombre: "Tercero B" },
    { codigo: "5A", nombre: "Quinto A" },
] as const;

const ESTUDIANTES = [
    { codigoUnico: "AGP-1001", nombres: "Lucía", apellidos: "Herrera Díaz", grupo: "1A" },
    { codigoUnico: "AGP-1002", nombres: "Mateo", apellidos: "Rojas Peña", grupo: "1A" },
    { codigoUnico: "AGP-1003", nombres: "Sofía", apellidos: "Castro Luna", grupo: "1A" },
    { codigoUnico: "AGP-1004", nombres: "Emiliano", apellidos: "Vargas Ortiz", grupo: "1A" },
    { codigoUnico: "AGP-3001", nombres: "Valentina", apellidos: "Morales Ruiz", grupo: "3B" },
    { codigoUnico: "AGP-3002", nombres: "Samuel", apellidos: "Delgado Cruz", grupo: "3B" },
    { codigoUnico: "AGP-3003", nombres: "Isabella", apellidos: "Núñez Pardo", grupo: "3B" },
    { codigoUnico: "AGP-3004", nombres: "Tomás", apellidos: "Guerrero Silva", grupo: "3B" },
    { codigoUnico: "AGP-5001", nombres: "Camila", apellidos: "Restrepo Gil", grupo: "5A" },
    { codigoUnico: "AGP-5002", nombres: "Juan", apellidos: "Osorio Méndez", grupo: "5A" },
    { codigoUnico: "AGP-5003", nombres: "Mariana", apellidos: "Cifuentes León", grupo: "5A" },
    { codigoUnico: "AGP-5004", nombres: "Andrés", apellidos: "Palacios Ríos", grupo: "5A" },
] as const;

async function seedGruposYEstudiantes() {
    for (const grupo of GRUPOS) {
        await prisma.grupo.upsert({
            where: { codigo: grupo.codigo },
            create: { codigo: grupo.codigo, nombre: grupo.nombre, activo: true },
            update: { nombre: grupo.nombre, activo: true },
        });
    }

    const grupos = await prisma.grupo.findMany({ select: { id: true, codigo: true } });
    const grupoPorCodigo = new Map(grupos.map((grupo) => [grupo.codigo, grupo.id]));

    for (const estudiante of ESTUDIANTES) {
        const grupoId = grupoPorCodigo.get(estudiante.grupo);
        if (!grupoId) {
            throw new Error(`No existe el grupo ${estudiante.grupo} para sembrar estudiantes`);
        }
        await prisma.estudiante.upsert({
            where: { codigoUnico: estudiante.codigoUnico },
            create: {
                codigoUnico: estudiante.codigoUnico,
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                grupoId,
                activo: true,
            },
            update: {
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                grupoId,
                activo: true,
            },
        });
    }

    console.log(`✔ Grupos ficticios: ${GRUPOS.length}. Estudiantes ficticios: ${ESTUDIANTES.length}.`);
}

async function main() {
    await seedRoles();
    await seedPermisos();
    await seedRolPermisos();
    await seedUsuarioAdmin();
    await seedGruposYEstudiantes();
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
