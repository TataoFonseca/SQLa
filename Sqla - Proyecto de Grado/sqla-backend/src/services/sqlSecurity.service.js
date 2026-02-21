const forbiddenPatterns = [
    /DROP\s+DATABASE/i,
    /ALTER\s+DATABASE/i,
    /TRUNCATE\s+TABLE/i,
    /xp_cmdshell/i,
    /sp_configure/i,
    /USE\s+/i,
    /EXEC\s+/i,
    /GRANT\s+/i,
    /REVOKE\s+/i,
    /DENY\s+/i,
    /CREATE\s+LOGIN/i,
    /ALTER\s+LOGIN/i,
    /DROP\s+LOGIN/i
];

export function securityCheck(sql) {

    // 🔹 Bloquear múltiples statements separados por ;
    const statements = sql.split(";").filter(s => s.trim() !== "");

    if (statements.length > 1) {
        return {
            ok: false,
            message: "No se permiten múltiples sentencias SQL en una sola ejecución."
        };
    }

    // 🔹 Revisar patrones prohibidos
    for (const pattern of forbiddenPatterns) {
        if (pattern.test(sql)) {
            return {
                ok: false,
                message: "La consulta contiene instrucciones no permitidas."
            };
        }
    }

    return { ok: true };
}