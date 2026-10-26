import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { AppError } from "../utils/AppError";
import { enviarCorreoRecuperacion } from "../utils/mailer";

const EXPIRACION_MINUTOS = 15;
const MAX_SOLICITUDES_POR_HORA = 3;

// ─── SOLICITAR RECUPERACIÓN ───────────────────────────────────────────────────

export const solicitarRecuperacion = async (
    email: string,
    correo: { html: string; subject?: string }
) => {
    // Siempre responder igual — no confirmar si el email existe (evita enumeración de usuarios)
    const respuestaGenerica = "Si el correo existe en el sistema, recibirás instrucciones para restablecer tu contraseña.";

    const emailLimpio = email?.trim().toLowerCase();
    if (!emailLimpio) throw new AppError("El email es obligatorio.", 400);

    const usuario = await prisma.usuario.findUnique({
        where: { email: emailLimpio },
        select: { id: true, nombre: true, email: true, estado: true },
    });

    if (!usuario || usuario.estado !== "ACTIVO") {
        return { mensaje: respuestaGenerica };
    }

    // Rate limiting: máximo N solicitudes por hora
    const hace1Hora = new Date(Date.now() - 60 * 60 * 1000);
    const solicitudesRecientes = await prisma.tokenRecuperacion.count({
        where: {
            usuarioId: usuario.id,
            creadoEn: { gte: hace1Hora },
        },
    });

    if (solicitudesRecientes >= MAX_SOLICITUDES_POR_HORA) {
        return { mensaje: respuestaGenerica };
    }

    // Invalidar tokens anteriores no usados de este usuario
    await prisma.tokenRecuperacion.updateMany({
        where: { usuarioId: usuario.id, usado: false },
        data: { usado: true },
    });

    // Generar token criptográfico de 32 bytes → 64 chars hex
    const tokenPlano = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(tokenPlano, 10);
    const expiresAt = new Date(Date.now() + EXPIRACION_MINUTOS * 60 * 1000);

    await prisma.tokenRecuperacion.create({
        data: { usuarioId: usuario.id, tokenHash, expiresAt },
    });

    await enviarCorreoRecuperacion({
        html: correo.html,
        subject: correo.subject,
        usuarioNombre: usuario.nombre,
        usuarioEmail: usuario.email!,
        token: tokenPlano,
        expiresAt,
    });

    return { mensaje: respuestaGenerica };
};

// ─── RESTABLECER CONTRASEÑA ───────────────────────────────────────────────────

export const restablecerContrasena = async (token: string, nuevaContrasena: string) => {
    if (!token?.trim()) throw new AppError("El token es obligatorio.", 400);
    if (!nuevaContrasena || nuevaContrasena.length < 8) {
        throw new AppError("La contraseña debe tener al menos 8 caracteres.", 400);
    }

    const tokensActivos = await prisma.tokenRecuperacion.findMany({
        where: {
            usado: false,
            expiresAt: { gt: new Date() },
        },
        select: { id: true, tokenHash: true, usuarioId: true },
        orderBy: { creadoEn: "desc" },
        take: 20,
    });

    let tokenValido: typeof tokensActivos[number] | null = null;
    for (const t of tokensActivos) {
        const coincide = await bcrypt.compare(token.trim(), t.tokenHash);
        if (coincide) {
            tokenValido = t;
            break;
        }
    }

    if (!tokenValido) {
        throw new AppError("El token es inválido o ha expirado.", 400);
    }

    const nuevaHash = await bcrypt.hash(nuevaContrasena, 10);

    await prisma.$transaction([
        prisma.usuario.update({
            where: { id: tokenValido.usuarioId },
            data: { passwordHash: nuevaHash },
        }),
        prisma.tokenRecuperacion.update({
            where: { id: tokenValido.id },
            data: { usado: true },
        }),
    ]);

    return { mensaje: "Contraseña restablecida correctamente." };
};
