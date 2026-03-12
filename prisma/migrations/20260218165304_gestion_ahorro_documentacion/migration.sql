-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL,
    "code" CHAR(2) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "currency_symbol" VARCHAR(5) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_name" VARCHAR(20) NOT NULL DEFAULT 'IVA',
    "phone_prefix" VARCHAR(5),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "launched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "tagline" VARCHAR(255),
    "device_type" VARCHAR(20),
    "device_model" VARCHAR(100),
    "price_usd_monthly" DECIMAL(10,2) NOT NULL,
    "price_usd_yearly" DECIMAL(10,2),
    "max_vehicles" INTEGER NOT NULL DEFAULT 1,
    "max_users" INTEGER NOT NULL DEFAULT 1,
    "max_geofences" INTEGER NOT NULL DEFAULT 3,
    "max_alerts" INTEGER NOT NULL DEFAULT 5,
    "history_days" INTEGER NOT NULL DEFAULT 30,
    "max_planned_routes" INTEGER NOT NULL DEFAULT 10,
    "features" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "badge_text" VARCHAR(50),
    "badge_color" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "price_monthly" DECIMAL(12,2) NOT NULL,
    "price_yearly" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "role" VARCHAR(30) NOT NULL DEFAULT 'platform_admin',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "last_login" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "legal_name" VARCHAR(255),
    "tax_id" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "website" VARCHAR(255),
    "address" JSONB NOT NULL DEFAULT '{}',
    "subscription_status" VARCHAR(20) NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    "plan_expires_at" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_steps" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "suspended_at" TIMESTAMP(3),
    "suspended_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "google_id" VARCHAR(255),
    "phone" VARCHAR(50),
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "role" VARCHAR(30) NOT NULL DEFAULT 'viewer',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "invited_by" UUID,
    "invite_token" VARCHAR(100),
    "invite_expires" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installers" (
    "id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "avatar_url" VARCHAR(500),
    "rut" VARCHAR(20),
    "company_name" VARCHAR(255),
    "company_address" JSONB NOT NULL DEFAULT '{}',
    "coverage_zones" JSONB NOT NULL DEFAULT '[]',
    "certified_devices" JSONB NOT NULL DEFAULT '[]',
    "total_installs" INTEGER NOT NULL DEFAULT 0,
    "active_devices" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commission_type" VARCHAR(20) NOT NULL DEFAULT 'percent',
    "payment_info" JSONB NOT NULL DEFAULT '{}',
    "password_hash" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "certified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "installer_id" UUID,
    "imei" VARCHAR(20) NOT NULL,
    "serial_number" VARCHAR(100),
    "device_type" VARCHAR(20) NOT NULL,
    "brand" VARCHAR(50),
    "model" VARCHAR(100),
    "firmware_version" VARCHAR(50),
    "sim_iccid" VARCHAR(25),
    "sim_phone" VARCHAR(50),
    "sim_carrier" VARCHAR(50),
    "installed_at" TIMESTAMP(3),
    "installed_by" UUID,
    "install_photos" JSONB NOT NULL DEFAULT '[]',
    "install_notes" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "last_seen" TIMESTAMP(3),
    "last_lat" DECIMAL(10,7),
    "last_lng" DECIMAL(10,7),
    "battery_level" INTEGER,
    "signal_strength" INTEGER,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "relay_status" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'stock',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "device_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "plate" VARCHAR(20),
    "vin" VARCHAR(20),
    "type" VARCHAR(30) NOT NULL DEFAULT 'car',
    "brand" VARCHAR(50),
    "model" VARCHAR(50),
    "year" SMALLINT,
    "color" VARCHAR(50),
    "fuel_type" VARCHAR(20) NOT NULL DEFAULT 'Diesel',
    "fuel_efficiency" REAL NOT NULL DEFAULT 10.0,
    "photo_url" VARCHAR(500),
    "primary_driver_id" UUID,
    "current_status" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "current_location" JSONB NOT NULL DEFAULT '{}',
    "odometer_km" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "odometer_updated" TIMESTAMP(3),
    "obd_data" JSONB NOT NULL DEFAULT '{}',
    "alert_config" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_drivers" (
    "vehicle_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "vehicle_drivers_pkey" PRIMARY KEY ("vehicle_id","user_id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "issue_date" DATE,
    "expiration_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "file_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_stats" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "fuel_saved" REAL NOT NULL,
    "maintenance_saved" REAL NOT NULL,
    "total_saved" REAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofences" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7) NOT NULL DEFAULT '#f97316',
    "icon" VARCHAR(50) NOT NULL DEFAULT 'map-pin',
    "type" VARCHAR(20) NOT NULL,
    "geometry" JSONB NOT NULL,
    "google_place_id" VARCHAR(255),
    "place_name" VARCHAR(255),
    "alert_on_enter" BOOLEAN NOT NULL DEFAULT true,
    "alert_on_exit" BOOLEAN NOT NULL DEFAULT true,
    "alert_on_stay" BOOLEAN NOT NULL DEFAULT false,
    "stay_minutes" INTEGER,
    "vehicle_ids" JSONB NOT NULL DEFAULT '[]',
    "schedule_type" VARCHAR(20) NOT NULL DEFAULT 'always',
    "schedule" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by" UUID,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'custom',
    "google_place_id" VARCHAR(255),
    "formatted_address" VARCHAR(500),
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "auto_geofence" BOOLEAN NOT NULL DEFAULT false,
    "geofence_radius" INTEGER NOT NULL DEFAULT 200,
    "geofence_id" UUID,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "last_visited" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "geofence_id" UUID,
    "trip_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
    "data" JSONB NOT NULL DEFAULT '{}',
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "address" VARCHAR(500),
    "notified_at" TIMESTAMP(3),
    "notified_via" JSONB NOT NULL DEFAULT '[]',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "read_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID,
    "route_id" UUID,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "distance_km" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "max_speed_kmh" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "avg_speed_kmh" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "idle_seconds" INTEGER NOT NULL DEFAULT 0,
    "start_location" JSONB,
    "end_location" JSONB,
    "google_polyline" TEXT,
    "optimal_distance_km" DECIMAL(10,3),
    "optimal_duration_min" INTEGER,
    "efficiency_score" DECIMAL(5,2),
    "excess_distance_km" DECIMAL(8,3),
    "excess_minutes" INTEGER,
    "behavior_score" DECIMAL(5,2),
    "harsh_braking" INTEGER NOT NULL DEFAULT 0,
    "harsh_accel" INTEGER NOT NULL DEFAULT 0,
    "speeding_events" INTEGER NOT NULL DEFAULT 0,
    "traffic_delay_min" INTEGER NOT NULL DEFAULT 0,
    "avg_traffic_level" VARCHAR(20),
    "fuel_used_liters" DECIMAL(6,3),
    "fuel_cost" DECIMAL(10,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_routes" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "driver_id" UUID,
    "origin_address" VARCHAR(500) NOT NULL,
    "origin_place_id" VARCHAR(255),
    "origin_lat" DECIMAL(10,7) NOT NULL,
    "origin_lng" DECIMAL(10,7) NOT NULL,
    "dest_address" VARCHAR(500) NOT NULL,
    "dest_place_id" VARCHAR(255),
    "dest_lat" DECIMAL(10,7) NOT NULL,
    "dest_lng" DECIMAL(10,7) NOT NULL,
    "waypoints" JSONB NOT NULL DEFAULT '[]',
    "google_route" JSONB NOT NULL DEFAULT '{}',
    "distance_km" DECIMAL(8,2),
    "duration_min" INTEGER,
    "duration_traffic" INTEGER,
    "traffic_level" VARCHAR(20),
    "deviation_meters" INTEGER NOT NULL DEFAULT 500,
    "notify_on_arrive" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_deviate" BOOLEAN NOT NULL DEFAULT true,
    "notify_contacts" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'planned',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "actual_duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_events" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "address" VARCHAR(500),
    "data" JSONB NOT NULL DEFAULT '{}',
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "scheduled_date" DATE,
    "scheduled_km" DECIMAL(10,2),
    "next_service_km" DECIMAL(10,2),
    "completed_date" DATE,
    "completed_km" DECIMAL(10,2),
    "completed_by" UUID,
    "cost" DECIMAL(10,2),
    "invoice_url" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'trialing',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),
    "payment_provider" VARCHAR(30),
    "external_id" VARCHAR(255),
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "billing_cycle" VARCHAR(20) NOT NULL DEFAULT 'monthly',
    "discount_code" VARCHAR(50),
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "subscription_id" UUID,
    "country_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_method" VARCHAR(50),
    "payment_provider" VARCHAR(30),
    "external_id" VARCHAR(255),
    "failure_reason" TEXT,
    "invoice_url" VARCHAR(500),
    "invoice_number" VARCHAR(100),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_jobs" (
    "id" UUID NOT NULL,
    "installer_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "organization_id" UUID,
    "scheduled_at" TIMESTAMP(3),
    "address" VARCHAR(500),
    "contact_name" VARCHAR(100),
    "contact_phone" VARCHAR(50),
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "duration_min" INTEGER,
    "install_photos" JSONB NOT NULL DEFAULT '[]',
    "install_notes" TEXT,
    "rating" SMALLINT,
    "review" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "commission_amount" DECIMAL(10,2),
    "commission_paid" BOOLEAN NOT NULL DEFAULT false,
    "commission_paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geocoding_cache" (
    "id" UUID NOT NULL,
    "cache_key" VARCHAR(64) NOT NULL,
    "query_type" VARCHAR(20) NOT NULL,
    "lat_input" DECIMAL(10,7),
    "lng_input" DECIMAL(10,7),
    "address_input" VARCHAR(500),
    "result" JSONB NOT NULL,
    "formatted_address" VARCHAR(500),
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "place_id" VARCHAR(255),
    "hits" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geocoding_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "alert_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "channel" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "organization_id" UUID,
    "user_id" UUID,
    "installer_id" UUID,
    "platform_admin_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VehicleGeofences" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_plan_id_country_id_key" ON "plan_prices"("plan_id", "country_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_country_id_idx" ON "organizations"("country_id");

-- CreateIndex
CREATE INDEX "organizations_plan_id_idx" ON "organizations"("plan_id");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_organization_id_key" ON "users"("email", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "installers_email_key" ON "installers"("email");

-- CreateIndex
CREATE INDEX "installers_country_id_idx" ON "installers"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_imei_key" ON "devices"("imei");

-- CreateIndex
CREATE INDEX "devices_imei_idx" ON "devices"("imei");

-- CreateIndex
CREATE INDEX "devices_organization_id_idx" ON "devices"("organization_id");

-- CreateIndex
CREATE INDEX "devices_device_type_idx" ON "devices"("device_type");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_device_id_key" ON "vehicles"("device_id");

-- CreateIndex
CREATE INDEX "vehicles_organization_id_idx" ON "vehicles"("organization_id");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicle_documents_vehicle_id_idx" ON "vehicle_documents"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_documents_status_idx" ON "vehicle_documents"("status");

-- CreateIndex
CREATE INDEX "savings_stats_organization_id_idx" ON "savings_stats"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "savings_stats_organization_id_month_key" ON "savings_stats"("organization_id", "month");

-- CreateIndex
CREATE INDEX "geofences_organization_id_idx" ON "geofences"("organization_id");

-- CreateIndex
CREATE INDEX "alerts_organization_id_idx" ON "alerts"("organization_id");

-- CreateIndex
CREATE INDEX "alerts_vehicle_id_idx" ON "alerts"("vehicle_id");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_organization_id_is_read_idx" ON "alerts"("organization_id", "is_read");

-- CreateIndex
CREATE INDEX "trips_organization_id_idx" ON "trips"("organization_id");

-- CreateIndex
CREATE INDEX "trips_vehicle_id_idx" ON "trips"("vehicle_id");

-- CreateIndex
CREATE INDEX "trips_started_at_idx" ON "trips"("started_at" DESC);

-- CreateIndex
CREATE INDEX "planned_routes_organization_id_idx" ON "planned_routes"("organization_id");

-- CreateIndex
CREATE INDEX "planned_routes_vehicle_id_idx" ON "planned_routes"("vehicle_id");

-- CreateIndex
CREATE INDEX "planned_routes_status_idx" ON "planned_routes"("status");

-- CreateIndex
CREATE INDEX "maintenance_records_vehicle_id_idx" ON "maintenance_records"("vehicle_id");

-- CreateIndex
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");

-- CreateIndex
CREATE INDEX "payments_organization_id_idx" ON "payments"("organization_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "installation_jobs_installer_id_idx" ON "installation_jobs"("installer_id");

-- CreateIndex
CREATE INDEX "installation_jobs_status_idx" ON "installation_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "geocoding_cache_cache_key_key" ON "geocoding_cache"("cache_key");

-- CreateIndex
CREATE INDEX "geocoding_cache_cache_key_idx" ON "geocoding_cache"("cache_key");

-- CreateIndex
CREATE INDEX "geocoding_cache_expires_at_idx" ON "geocoding_cache"("expires_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "_VehicleGeofences_AB_unique" ON "_VehicleGeofences"("A", "B");

-- CreateIndex
CREATE INDEX "_VehicleGeofences_B_index" ON "_VehicleGeofences"("B");

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installers" ADD CONSTRAINT "installers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_installer_id_fkey" FOREIGN KEY ("installer_id") REFERENCES "installers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_installed_by_fkey" FOREIGN KEY ("installed_by") REFERENCES "installers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_drivers" ADD CONSTRAINT "vehicle_drivers_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_drivers" ADD CONSTRAINT "vehicle_drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_stats" ADD CONSTRAINT "savings_stats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_geofence_id_fkey" FOREIGN KEY ("geofence_id") REFERENCES "geofences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_geofence_id_fkey" FOREIGN KEY ("geofence_id") REFERENCES "geofences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_read_by_fkey" FOREIGN KEY ("read_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "planned_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_routes" ADD CONSTRAINT "planned_routes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_routes" ADD CONSTRAINT "planned_routes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_routes" ADD CONSTRAINT "planned_routes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_routes" ADD CONSTRAINT "planned_routes_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_events" ADD CONSTRAINT "route_events_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "planned_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_events" ADD CONSTRAINT "route_events_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_jobs" ADD CONSTRAINT "installation_jobs_installer_id_fkey" FOREIGN KEY ("installer_id") REFERENCES "installers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_jobs" ADD CONSTRAINT "installation_jobs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_platform_admin_id_fkey" FOREIGN KEY ("platform_admin_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VehicleGeofences" ADD CONSTRAINT "_VehicleGeofences_A_fkey" FOREIGN KEY ("A") REFERENCES "geofences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VehicleGeofences" ADD CONSTRAINT "_VehicleGeofences_B_fkey" FOREIGN KEY ("B") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
