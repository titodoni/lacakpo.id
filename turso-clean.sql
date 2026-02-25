CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "po_number" TEXT NOT NULL,
    "client_po_number" TEXT,
    "client_id" TEXT NOT NULL,
    "po_date" DATETIME NOT NULL,
    "delivery_deadline" DATETIME,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "is_vendor_job" BOOLEAN NOT NULL DEFAULT false,
    "vendor_name" TEXT,
    "vendor_phone" TEXT,
    "vendor_estimation" DATETIME,
    "is_invoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoiced_at" DATETIME,
    "invoice_number" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" DATETIME,
    "finished_at" DATETIME,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");
CREATE INDEX "idx_po_status" ON "purchase_orders"("status");
CREATE INDEX "idx_po_deadline" ON "purchase_orders"("delivery_deadline");
CREATE INDEX "idx_po_invoiced" ON "purchase_orders"("is_invoiced");
CREATE INDEX "idx_po_paid" ON "purchase_orders"("is_paid");

CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "po_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "specification" TEXT,
    "quantity_total" INTEGER NOT NULL,
    "quantity_unit" TEXT NOT NULL DEFAULT 'pcs',
    "quantity_delivered" INTEGER NOT NULL DEFAULT 0,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" DATETIME,
    "production_type" TEXT NOT NULL DEFAULT 'both',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_items_po" ON "items"("po_id");

CREATE TABLE "item_tracks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "last_note" TEXT
);

CREATE INDEX "idx_tracks_item" ON "item_tracks"("item_id");
CREATE INDEX "idx_tracks_dept" ON "item_tracks"("department");
CREATE UNIQUE INDEX "item_tracks_item_id_department_key" ON "item_tracks"("item_id", "department");

CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "track_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "action_type" TEXT NOT NULL DEFAULT 'progress_update',
    "old_progress" INTEGER,
    "new_progress" INTEGER,
    "delta" INTEGER,
    "system_message" TEXT NOT NULL,
    "user_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_logs_item" ON "activity_logs"("item_id");
CREATE INDEX "idx_logs_created" ON "activity_logs"("created_at");

CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "delivery_date" DATETIME NOT NULL,
    "surat_jalan_number" TEXT,
    "notes" TEXT,
    "delivered_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    "resolved_by" TEXT
);

CREATE INDEX "idx_issues_item" ON "issues"("item_id");
CREATE INDEX "idx_issues_status" ON "issues"("status");
