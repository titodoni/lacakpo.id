-- CreateTable
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

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "po_number" TEXT NOT NULL,
    "client_po_number" TEXT,
    "client_id" TEXT NOT NULL,
    "po_date" DATETIME NOT NULL,
    "delivery_deadline" DATETIME,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_tracks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "last_note" TEXT,
    CONSTRAINT "item_tracks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_tracks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activity_logs_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "item_tracks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "delivery_date" DATETIME NOT NULL,
    "surat_jalan_number" TEXT,
    "notes" TEXT,
    "delivered_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deliveries_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "deliveries_delivered_by_fkey" FOREIGN KEY ("delivered_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "idx_items_po" ON "items"("po_id");

-- CreateIndex
CREATE INDEX "idx_tracks_item" ON "item_tracks"("item_id");

-- CreateIndex
CREATE INDEX "idx_tracks_dept" ON "item_tracks"("department");

-- CreateIndex
CREATE UNIQUE INDEX "item_tracks_item_id_department_key" ON "item_tracks"("item_id", "department");

-- CreateIndex
CREATE INDEX "idx_logs_item" ON "activity_logs"("item_id");

-- CreateIndex
CREATE INDEX "idx_logs_created" ON "activity_logs"("created_at");
