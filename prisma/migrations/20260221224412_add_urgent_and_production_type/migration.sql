-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_items" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_items" ("created_at", "delivered_at", "id", "is_delivered", "item_name", "po_id", "quantity_delivered", "quantity_total", "quantity_unit", "specification") SELECT "created_at", "delivered_at", "id", "is_delivered", "item_name", "po_id", "quantity_delivered", "quantity_total", "quantity_unit", "specification" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE INDEX "idx_items_po" ON "items"("po_id");
CREATE TABLE "new_purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "po_number" TEXT NOT NULL,
    "client_po_number" TEXT,
    "client_id" TEXT NOT NULL,
    "po_date" DATETIME NOT NULL,
    "delivery_deadline" DATETIME,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_purchase_orders" ("client_id", "client_po_number", "created_at", "created_by", "delivery_deadline", "id", "notes", "po_date", "po_number", "status") SELECT "client_id", "client_po_number", "created_at", "created_by", "delivery_deadline", "id", "notes", "po_date", "po_number", "status" FROM "purchase_orders";
DROP TABLE "purchase_orders";
ALTER TABLE "new_purchase_orders" RENAME TO "purchase_orders";
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
