-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_purchase_orders" ("client_id", "client_po_number", "created_at", "created_by", "delivery_deadline", "finished_at", "id", "invoice_number", "invoiced_at", "is_invoiced", "is_paid", "is_urgent", "notes", "paid_at", "po_date", "po_number", "status") SELECT "client_id", "client_po_number", "created_at", "created_by", "delivery_deadline", "finished_at", "id", "invoice_number", "invoiced_at", "is_invoiced", "is_paid", "is_urgent", "notes", "paid_at", "po_date", "po_number", "status" FROM "purchase_orders";
DROP TABLE "purchase_orders";
ALTER TABLE "new_purchase_orders" RENAME TO "purchase_orders";
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");
CREATE INDEX "idx_po_status" ON "purchase_orders"("status");
CREATE INDEX "idx_po_deadline" ON "purchase_orders"("delivery_deadline");
CREATE INDEX "idx_po_invoiced" ON "purchase_orders"("is_invoiced");
CREATE INDEX "idx_po_paid" ON "purchase_orders"("is_paid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
