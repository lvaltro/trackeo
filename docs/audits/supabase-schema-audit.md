# Auditoría de esquema Supabase vs código

Generado: 2026-03-12T01:19:19.750Z

## Resumen

- Tablas detectadas en código: 8
- Tablas en base de datos: 46
- Tablas solo en código: 1
- Tablas solo en BD: 39

## Esquema

Comparación contra esquema cargado desde **docs/audits** (modo offline).

## Tablas solo en código (revisar si existen en Supabase)

- `device_positions`

## Tablas solo en BD (no referenciadas en código)

- `brain_items`
- `brain_tasks`
- `brain_projects`
- `brain_habit_logs`
- `brain_journal_entries`
- `brain_financial_transactions`
- `brain_decisions`
- `plans`
- `plan_prices`
- `countries`
- `organizations`
- `users`
- `installers`
- `vehicle_drivers`
- `savings_stats`
- `vehicles`
- `brain_habits`
- `brain_inbox`
- `leads`
- `brain_chat_history`
- `brain_focus`
- `_prisma_migrations`
- `geocoding_cache`
- `geofences`
- `places`
- `alerts`
- `trips`
- `planned_routes`
- `route_events`
- `subscriptions`
- `payments`
- `installation_jobs`
- `audit_logs`
- `platform_admins`
- `_VehicleGeofences`
- `brain_today_habits`
- `brain_monthly_finances`
- `brain_timeline`
- `brain_pending_tasks`

## Detalle por tabla

### vehicle_status

- Archivos: src\hooks\useVehicleTracker.js
- Columnas en código: device_id, last_speed, last_latitude, last_longitude, is_online, last_update, ignition
- Columnas en BD: device_id, last_latitude, last_longitude, last_speed, ignition, is_online, last_update, updated_at
- Columnas en BD no usadas en código: updated_at

### devices

- Archivos: server\middleware\ownership.js, app\api\admin\health\route.ts, app\api\worker\process\route.ts
- Columnas en código: id
- Columnas en BD: battery_level, signal_strength, is_online, created_at, updated_at, id, organization_id, installer_id, installed_at, installed_by, install_photos, config, last_seen, last_lat, last_lng, imei, serial_number, device_type, brand, model, firmware_version, sim_iccid, sim_phone, sim_carrier, install_notes, relay_status, status
- Columnas en BD no usadas en código: battery_level, signal_strength, is_online, created_at, updated_at, organization_id, installer_id, installed_at, installed_by, install_photos, config, last_seen, last_lat, last_lng, imei, serial_number, device_type, brand, model, firmware_version, sim_iccid, sim_phone, sim_carrier, install_notes, relay_status, status

### notifications

- Archivos: server\routes\health.js, core\notifications\index.js
- Columnas en código: id, user_id, tipo, mensaje, dispositivo, leido, fuente, created_at, data
- Columnas en BD: id, organization_id, user_id, alert_id, data, sent_at, read_at, created_at, leido, type, title, body, channel, status
- ⚠️ Solo en código (revisar en BD): tipo, mensaje, dispositivo, fuente
- Columnas en BD no usadas en código: organization_id, alert_id, sent_at, read_at, type, title, body, channel, status

### vehicle_documents

- Archivos: core\documents\index.js
- Columnas en código: (ninguna detectada)
- Columnas en BD: id, vehicle_id, issue_date, expiration_date, created_at, updated_at, expires_at, organization_id, type, status, file_url
- Columnas en BD no usadas en código: id, vehicle_id, issue_date, expiration_date, created_at, updated_at, expires_at, organization_id, type, status, file_url

### device_positions

- Archivos: core\jobs\weeklyStats.js, app\api\worker\process\route.ts
- Columnas en código: device_id, latitude, longitude, speed, recorded_at, id

### device_events

- Archivos: core\jobs\weeklyStats.js, app\api\worker\process\route.ts
- Columnas en código: device_id, event_type, attributes, recorded_at
- Columnas en BD: position_data, attributes, created_at, device_id, server_time, id, event_type
- ⚠️ Solo en código (revisar en BD): recorded_at
- Columnas en BD no usadas en código: position_data, created_at, server_time, id

### vehicle_weekly_stats

- Archivos: core\jobs\weeklyStats.js
- Columnas en código: score, km_total
- Columnas en BD: id, week_start, km_total, driving_minutes, trips_count, max_speed_kmh, avg_speed_kmh, overspeed_count, harsh_brake_count, harsh_accel_count, score, prev_score, prev_km, daily_km, calculated_at, created_at, updated_at, organization_id, vehicle_id
- Columnas en BD no usadas en código: id, week_start, driving_minutes, trips_count, max_speed_kmh, avg_speed_kmh, overspeed_count, harsh_brake_count, harsh_accel_count, prev_score, prev_km, daily_km, calculated_at, created_at, updated_at, organization_id, vehicle_id

### maintenance_records

- Archivos: core\maintenance\index.js
- Columnas en código: (ninguna detectada)
- Columnas en BD: id, organization_id, vehicle_id, scheduled_date, scheduled_km, next_service_km, completed_date, completed_km, completed_by, cost, created_at, type, title, notes, invoice_url, status
- Columnas en BD no usadas en código: id, organization_id, vehicle_id, scheduled_date, scheduled_km, next_service_km, completed_date, completed_km, completed_by, cost, created_at, type, title, notes, invoice_url, status
