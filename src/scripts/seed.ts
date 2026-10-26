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

    // user: solo consulta de recursos (ajusta según tu caso)
    const permisosUser = permisos.filter((p) => p.codigo === "recursos.consultar");
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

async function main() {
    await seedRoles();
    await seedPermisos();
    await seedRolPermisos();
    await seedUsuarioAdmin();
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
