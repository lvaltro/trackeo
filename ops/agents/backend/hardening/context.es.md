# Contexto: Agente de Hardening Backend

## Qué problema resuelve
Identifica y corrige vulnerabilidades de seguridad en la capa HTTP del backend Express.js. No toca lógica de negocio — solo endurece la superficie expuesta al internet.

## Cuándo usarlo
- Después de agregar nuevos endpoints al API
- Antes de un deploy importante a producción
- Cuando se actualizan dependencias (npm update)
- Periódicamente como auditoría de seguridad (mensual recomendado)
- Después de recibir reportes de abuso o ataques

## Qué riesgo mitiga
- **DDoS / abuso**: Rate limiting previene saturación del servidor
- **XSS / Clickjacking**: Helmet configura headers protectores
- **CORS bypass**: Política estricta de origins evita requests no autorizados
- **Memory exhaustion**: Límite de body size previene payloads gigantes
- **Credential leaks**: Auditoría de secretos previene exposición accidental

## Señales de activación
- `npm audit` reporta vulnerabilidades high/critical
- Logs muestran patrones de abuso (muchos 403, 429, o requests desde origins desconocidos)
- Se agregaron endpoints sin validación de input
- El rate limiter está bloqueando requests legítimos (necesita ajuste)
- Headers de seguridad faltan en respuestas HTTP (verificar con securityheaders.com)
