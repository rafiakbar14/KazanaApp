
-- 1. Insert New Products
INSERT INTO products (sku, name, category, current_stock, unit_cost, selling_price, user_id, location_type, product_type)
VALUES 
('KWS-002', 'Kopi Walik Susu Gula Aren', 'Minuman', 50, 9000, 18000, '18c1e306-4222-4ebe-b430-41527dbb596c', 'toko', 'finished_good'),
('RBC-003', 'Roti Bakar Keju', 'Makanan', 30, 15000, 25000, '18c1e306-4222-4ebe-b430-41527dbb596c', 'toko', 'finished_good');

-- 2. Create a Sales Transaction
-- Note: UUID is required by schema, I'll generate a random-like string
-- I'll use product id 1 (KWS-001) which has price 15000
-- Subtotal for 2 units = 30000

INSERT INTO sales (uuid, invoice_number, total_amount, discount_amount, tax_amount, payment_method, payment_status, user_id, type, created_at)
VALUES 
('manual-seed-uuid-001', 'INV-2024-001', 30000, 0, 0, 'cash', 'paid', '18c1e306-4222-4ebe-b430-41527dbb596c', 'pos', NOW());

-- Get the last sale id (assuming it's serial)
WITH last_sale AS (SELECT id FROM sales WHERE uuid = 'manual-seed-uuid-001')
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
SELECT id, 1, 2, 15000, 30000 FROM last_sale;

-- Update stock for KWS-001 (id 1)
UPDATE products SET current_stock = current_stock - 2 WHERE id = 1;

-- 3. Create Accounting Journal Entry
INSERT INTO journal_entries (description, reference, user_id, date)
VALUES ('Penjualan POS INV-2024-001', 'INV-2024-001', '18c1e306-4222-4ebe-b430-41527dbb596c', NOW());

-- Insert Journal Items
WITH last_entry AS (SELECT id FROM journal_entries WHERE reference = 'INV-2024-001')
INSERT INTO journal_items (entry_id, account_id, debit, credit, user_id)
SELECT id, 13, 30000, 0, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry -- Kas Utama (D)
UNION ALL
SELECT id, 20, 0, 30000, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry -- Pendapatan (C)
UNION ALL
SELECT id, 21, 16000, 0, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry -- HPP (D)
UNION ALL
SELECT id, 15, 0, 16000, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry; -- Persediaan (C)
