import nodemailer from "nodemailer";

const SUBJECT_DEFAULT = "Solicitud de recuperación de contraseña";

/** Placeholders que el front puede usar en la plantilla HTML del correo */
export const PLACEHOLDERS_RECUPERACION = {
    usuarioNombre: "{{usuarioNombre}}",
    usuarioEmail: "{{usuarioEmail}}",
    token: "{{token}}",
    link: "{{link}}",
    expiracion: "{{expiracion}}",
} as const;

export type VariablesCorreoRecuperacion = {
    usuarioNombre: string;
    usuarioEmail: string;
    token: string;
    link: string;
    expiracion: string;
};

const smtpPort = Number(process.env.SMTP_PORT ?? 587);

// Por defecto se valida el certificado TLS. Si usas un correo corporativo con cert autofirmado
// o host distinto al del certificado, usa SMTP_TLS_REJECT_UNAUTHORIZED=false en el .env
const tlsRejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";
const tlsServername = process.env.SMTP_TLS_SERVERNAME?.trim();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: smtpPort,
    // 465 = SSL implícito; 587 u otros suelen usar STARTTLS (secure: false)
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
    },
    tls: {
        rejectUnauthorized: tlsRejectUnauthorized,
        ...(tlsServername ? { servername: tlsServername } : {}),
    },
});

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Sustituye los placeholders en la plantilla HTML enviada por el frontend */
export function renderPlantillaRecuperacion(html: string, vars: VariablesCorreoRecuperacion): string {
    return html
        .replaceAll(PLACEHOLDERS_RECUPERACION.usuarioNombre, escapeHtml(vars.usuarioNombre))
        .replaceAll(PLACEHOLDERS_RECUPERACION.usuarioEmail, escapeHtml(vars.usuarioEmail))
        .replaceAll(PLACEHOLDERS_RECUPERACION.token, vars.token)
        .replaceAll(PLACEHOLDERS_RECUPERACION.link, vars.link)
        .replaceAll(PLACEHOLDERS_RECUPERACION.expiracion, escapeHtml(vars.expiracion));
}

export const enviarCorreoRecuperacion = async (opts: {
    html: string;
    subject?: string;
    usuarioNombre: string;
    usuarioEmail: string;
    token: string;
    expiresAt: Date;
}) => {
    const link = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${opts.token}`;
    const expiracion = opts.expiresAt.toLocaleString();

    const htmlRenderizado = renderPlantillaRecuperacion(opts.html, {
        usuarioNombre: opts.usuarioNombre,
        usuarioEmail: opts.usuarioEmail,
        token: opts.token,
        link,
        expiracion,
    });

    await transporter.sendMail({
        from: `"Soporte" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || opts.usuarioEmail,
        subject: opts.subject?.trim() || SUBJECT_DEFAULT,
        html: htmlRenderizado,
    });
};
