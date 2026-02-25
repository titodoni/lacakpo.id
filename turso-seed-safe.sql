-- Seed users (only if not exists)
INSERT OR IGNORE INTO "users" ("id", "username", "password_hash", "name", "role", "department", "is_active", "created_at") VALUES 
('u1', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Administrator', 'super_admin', 'management', true, datetime('now')),
('u2', 'andi', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Andi CNC', 'cnc_operator', 'production', true, datetime('now')),
('u3', 'budi', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Budi Drafter', 'drafter', 'drafting', true, datetime('now')),
('u4', 'sari', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Sari Purchasing', 'purchasing', 'purchasing', true, datetime('now')),
('u5', 'dewi', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Dewi QC', 'qc', 'qc', true, datetime('now')),
('u6', 'finance', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Finance Admin', 'finance', 'finance', true, datetime('now')),
('u7', 'manager', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Pak Manager', 'manager', 'management', true, datetime('now')),
('u8', 'sales', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Sales Admin', 'sales_admin', 'sales', true, datetime('now')),
('u9', 'delivery', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQmM8J7qhYJ3Y7K1qZ2ZpYr2c9qW', 'Delivery Staff', 'delivery', 'logistics', true, datetime('now'));

-- Sample clients (only if not exists)
INSERT OR IGNORE INTO "clients" ("id", "code", "name", "contact_person", "phone", "created_at") VALUES 
('c1', 'SA', 'PT Sinar Abadi', 'Pak Ahmad', '021-5550101', datetime('now')),
('c2', 'DP', 'PT Delta Prima', 'Ibu Sari', '021-5550202', datetime('now')),
('c3', 'MK', 'PT Maju Kencana', 'Pak Budi', '021-5550303', datetime('now'));
