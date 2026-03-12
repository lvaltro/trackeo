# Paso a paso: notificaciones de leads con Supabase + Resend (remitente @trackeo.cl)

Guía para que cada nuevo lead registrado en la landing te llegue por email, enviado desde `noreply@trackeo.cl`.

---

## Parte 1 — Resend (dominio y API key)

### 1.1 Crear cuenta en Resend

1. Entra a **[resend.com](https://resend.com)** y haz clic en **Sign up**.
2. Regístrate con tu email (puede ser tu Gmail).
3. Verifica tu correo si te lo piden.

### 1.2 Añadir y verificar el dominio trackeo.cl

1. En el panel de Resend, ve a **Domains** (menú lateral).
2. Clic en **Add Domain**.
3. Escribe: `trackeo.cl` y confirma.
4. Resend te mostrará **registros DNS** que debes agregar en donde administres el dominio (ej. Cloudflare, GoDaddy, Nic Chile, etc.):

   Ejemplo típico (los valores exactos los da Resend):

   | Tipo  | Nombre / Host     | Valor / Apunta a        |
   |-------|-------------------|--------------------------|
   | MX    | `send` (o @)      | `feedback-smtp.region.resend.com` (prioridad según Resend) |
   | TXT   | `send` (o @)      | `resend-verification=...` (código que te da Resend) |
   | (DKIM)| Lo que indique Resend | Valor que indique Resend |

5. En tu proveedor DNS, agrega **exactamente** los registros que Resend muestre (pueden ser 2–3: verificación + envío).
6. En Resend, clic en **Verify**. La verificación puede tardar unos minutos (hasta 48 h en algunos proveedores).
7. Cuando el dominio aparezca como **Verified**, ya puedes enviar desde `noreply@trackeo.cl`.

### 1.3 Crear la API key

1. En Resend, ve a **API Keys** (menú lateral).
2. Clic en **Create API Key**.
3. Pon un nombre, ej: `Supabase notify-new-lead`.
4. Copia la key (solo se muestra una vez). Guárdala para el paso de Supabase.

---

## Parte 2 — Supabase (tabla, función y webhook)

### 2.1 Tabla `leads` y políticas

1. Entra a **[app.supabase.com](https://app.supabase.com)** y abre tu proyecto.
2. Ve a **SQL Editor** → **New query**.
3. Pega y ejecuta:

```sql
-- Tabla de leads (si no existe)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- Permisos para el rol anon (cliente con anon key) — evita error 42501
grant usage on schema public to anon;
grant insert on public.leads to anon;
grant select on public.leads to anon;

-- RLS
alter table public.leads enable row level security;

-- Política: permitir solo INSERT desde el cliente (anon)
drop policy if exists "Permitir insertar leads" on public.leads;
create policy "Permitir insertar leads"
  on public.leads
  for insert
  to anon
  with check (true);
```

4. Ejecuta (Run). No deberías ver errores.

### 2.2 Desplegar la Edge Function

1. Instala Supabase CLI si no la tienes:  
   `npm install -g supabase`
2. En tu máquina, en la raíz del repo (donde está la carpeta `supabase`), inicia sesión:  
   `supabase login`
3. Vincula el proyecto (sustituye `TU_PROJECT_REF` por el ref de tu proyecto, ej. `haqiovbihunfjtbfniid`):  
   `supabase link --project-ref TU_PROJECT_REF`
4. Despliega la función:  
   `supabase functions deploy notify-new-lead`
5. Si te pide región, elige la más cercana (ej. `South America (São Paulo)`).

### 2.3 Secrets de la Edge Function

1. En Supabase: **Project Settings** (icono engranaje) → **Edge Functions**.
2. En **Secrets**, agrega:

| Name              | Value / Notas |
|-------------------|----------------|
| `RESEND_API_KEY`  | La API key que copiaste de Resend. |
| `NOTIFY_EMAIL_TO` | Tu email donde quieres recibir los avisos (ej. `tugmail@gmail.com` o `hola@trackeo.cl`). |

Opcional (recomendado en producción):

| Name             | Value |
|------------------|--------|
| `WEBHOOK_SECRET` | Una contraseña larga aleatoria (ej. generada en [randomkeygen.com](https://randomkeygen.com)). La usarás en el webhook en el siguiente paso. |

3. Guarda los secrets.

### 2.4 Database Webhook (disparar la función en cada INSERT en `leads`)

1. En Supabase ve a **Database** → **Webhooks**.
2. Clic en **Create a new hook**.
3. Configura:
   - **Name:** `notify-new-lead`.
   - **Table:** `public.leads`.
   - **Events:** marca solo **Insert**.
   - **Type:** **Supabase Edge Functions**.
   - **Function:** `notify-new-lead`.
4. Si configuraste `WEBHOOK_SECRET`:
   - En **HTTP Headers** agrega un header:
     - Name: `x-webhook-secret`
     - Value: el mismo valor que pusiste en el secret `WEBHOOK_SECRET`.
5. Guarda el webhook.

---

## Parte 3 — Probar el flujo

1. Abre tu landing (local o deploy) y envía un correo de prueba en el formulario.
2. Comprueba en Supabase **Table Editor** → `leads` que apareció el registro.
3. Revisa tu bandeja (y spam) en la dirección que pusiste en `NOTIFY_EMAIL_TO`.
4. El correo debe llegar con remitente **Trackeo Leads &lt;noreply@trackeo.cl&gt;** (Opción B).

Si no llega el email:
- Revisa **Edge Functions** → **notify-new-lead** → **Logs** en Supabase por errores.
- Confirma que el dominio `trackeo.cl` está **Verified** en Resend y que la API key es la correcta en los secrets.

---

## Resumen rápido

| Dónde        | Qué hacer |
|-------------|------------|
| **Resend**  | Cuenta → Dominio `trackeo.cl` → Verificar DNS → API Key. |
| **Supabase**| Tabla `leads` + RLS → Deploy `notify-new-lead` → Secrets `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` (y opcional `WEBHOOK_SECRET`) → Webhook INSERT en `leads` → Edge Function `notify-new-lead`. |
| **Destino** | Puede ser Gmail u otro; el **remitente** será `noreply@trackeo.cl` una vez el dominio esté verificado en Resend. |
